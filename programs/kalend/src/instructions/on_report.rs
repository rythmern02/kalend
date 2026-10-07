use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction;
use crate::errors::KalendError;
use crate::state::{
    Config, Series, FillReceipt, RateRecord,
    FillStatus, SeriesStatus, RENT_VAULT_SEED,
};
use crate::events::{
    FillReport, SettleReport, RateReport,
    ReceivedFillReport, ReceivedSettleReport, ReceivedRateReport, SettlementDisputed,
};
use crate::math::settle_index_within_bounds;

#[derive(Accounts)]
pub struct OnReport<'info> {
    /// CHECK: Forwarder state account; verified against registered forwarders in Config
    pub state: UncheckedAccount<'info>,

    /// Signer PDA derived by the forwarder: ["forwarder", forwarderState, receiverProgram]
    pub forwarder_authority: Signer<'info>,
}

pub fn on_report_handler(
    ctx: Context<OnReport>,
    metadata: Vec<u8>,
    report: Vec<u8>,
) -> Result<()> {
    if report.len() < 2 {
        return err!(KalendError::InvalidReportPayload);
    }

    let kind = report[0];
    let version = report[1];

    if version != 1 {
        return err!(KalendError::UnsupportedReportVersion);
    }

    // 1. Verify forwarder authority PDA:
    // Derivation seeds: ["forwarder", forwarderState, receiverProgram] under forwarderProgram
    let (expected_authority, _bump) = Pubkey::find_program_address(
        &[
            b"forwarder",
            ctx.accounts.state.key().as_ref(),
            crate::ID.as_ref(),
        ],
        ctx.accounts.state.owner,
    );

    if ctx.accounts.forwarder_authority.key() != expected_authority {
        return err!(KalendError::InvalidForwarderAuthority);
    }

    // 2. Extract workflow_id from metadata (first 32 bytes)
    if metadata.len() < 32 {
        return err!(KalendError::InvalidWorkflowIdentity);
    }
    let mut workflow_id = [0u8; 32];
    workflow_id.copy_from_slice(&metadata[..32]);

    match kind {
        1 => handle_fill_report(&ctx, &report, &workflow_id),
        2 => handle_settle_report(&ctx, &report, &workflow_id),
        3 => handle_rate_report(&ctx, &report, &workflow_id),
        _ => err!(KalendError::UnknownReportKind),
    }
}

/// Load the canonical Config from a remaining account. The forwarder only proves who signed;
/// without this check a caller could supply a look-alike Config that lists its own forwarder.
fn load_config(info: &AccountInfo) -> Result<Config> {
    let (expected, _) = Pubkey::find_program_address(&[Config::SEED], &crate::ID);
    if info.key() != expected || *info.owner != crate::ID {
        return err!(KalendError::Unauthorized);
    }
    let data = info.try_borrow_data()?;
    if data.len() < 8 || data[..8] != *<Config as anchor_lang::Discriminator>::DISCRIMINATOR {
        return err!(KalendError::Unauthorized);
    }
    Config::deserialize(&mut &data[8..]).map_err(|_| error!(KalendError::InvalidReportPayload))
}

/// Load a Series owned by this program (owner + discriminator checked).
fn load_series(info: &AccountInfo) -> Result<Series> {
    if *info.owner != crate::ID {
        return err!(KalendError::SeriesMismatch);
    }
    let data = info.try_borrow_data()?;
    if data.len() < 8 || data[..8] != *<Series as anchor_lang::Discriminator>::DISCRIMINATOR {
        return err!(KalendError::SeriesMismatch);
    }
    Series::deserialize(&mut &data[8..]).map_err(|_| error!(KalendError::InvalidReportPayload))
}

fn handle_fill_report(
    ctx: &Context<OnReport>,
    report_bytes: &[u8],
    workflow_id: &[u8; 32],
) -> Result<()> {
    // Deserialize FillReport strictly
    let mut cursor = report_bytes;
    let report = FillReport::deserialize(&mut cursor)
        .map_err(|_| error!(KalendError::InvalidReportPayload))?;

    if !cursor.is_empty() {
        return err!(KalendError::TrailingReportBytes);
    }

    let now = Clock::get()?.unix_timestamp;
    if now > report.not_after {
        return err!(KalendError::RoundExpired);
    }

    // Remaining accounts layout for FillReport (all covered by the signed account hash):
    // [0]: config (read-only)
    // [1]: series (read-only)
    // [2]: fill_receipt (uninitialized PDA ["fill", round_id])
    // [3]: rent_vault (PDA ["rent"])
    // [4]: system_program
    // [5]: requester wallet (read-only)
    // [6]: dealer wallet (read-only)
    let remaining = ctx.remaining_accounts;
    if remaining.len() < 7 {
        return err!(KalendError::InvalidReportPayload);
    }
    let requester = remaining[5].key();
    let dealer = remaining[6].key();
    if requester == dealer {
        return err!(KalendError::PartyMismatch);
    }

    let config_info = &remaining[0];
    let series_info = &remaining[1];
    let fill_receipt_info = &remaining[2];
    let rent_vault_info = &remaining[3];
    let system_program_info = &remaining[4];

    // Load and verify Config
    let config = load_config(config_info)?;

    if config.paused {
        return err!(KalendError::ProtocolPaused);
    }

    if !config.is_authorized_forwarder(ctx.accounts.state.owner, &ctx.accounts.state.key(), workflow_id) {
        return err!(KalendError::InvalidForwarderProgram);
    }

    // Verify series ownership and tradability (fills only for open, unmatured series)
    let series = load_series(series_info)?;
    if series.status != SeriesStatus::Open as u8 {
        return err!(KalendError::SeriesNotOpen);
    }
    if now >= series.maturity_ts {
        return err!(KalendError::SeriesAlreadyMatured);
    }
    if report.side > 1 {
        return err!(KalendError::InvalidReportPayload);
    }
    if report.asset_amount == 0 || report.quote_amount == 0 {
        return err!(KalendError::ZeroAmount);
    }

    // Replay protection: FillReceipt PDA must be derived from ["fill", round_id]
    let (expected_receipt_pda, receipt_bump) = Pubkey::find_program_address(
        &[FillReceipt::SEED, report.round_id.as_ref()],
        &crate::ID,
    );
    if fill_receipt_info.key() != expected_receipt_pda {
        return err!(KalendError::Unauthorized);
    }

    // Allocate FillReceipt PDA using RentVault lamports
    let (expected_rent_vault, rent_bump) = Pubkey::find_program_address(
        &[RENT_VAULT_SEED],
        &crate::ID,
    );
    if rent_vault_info.key() != expected_rent_vault {
        return err!(KalendError::Unauthorized);
    }

    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(FillReceipt::LEN);

    // Create FillReceipt account funded by RentVault PDA via invoke_signed
    let rent_vault_seeds: &[&[u8]] = &[RENT_VAULT_SEED, &[rent_bump]];
    let create_ix = system_instruction::create_account(
        rent_vault_info.key,
        fill_receipt_info.key,
        lamports,
        FillReceipt::LEN as u64,
        &crate::ID,
    );

    invoke_signed(
        &create_ix,
        &[
            rent_vault_info.clone(),
            fill_receipt_info.clone(),
            system_program_info.clone(),
        ],
        // Both the payer (RentVault) and the new account (FillReceipt PDA) must sign create_account.
        &[rent_vault_seeds, &[FillReceipt::SEED, report.round_id.as_ref(), &[receipt_bump]]],
    )?;

    // Calculate report hash
    let report_hash = solana_sha256_hasher::hashv(&[report_bytes]).to_bytes();

    // Write FillReceipt state
    let receipt = FillReceipt {
        round_id: report.round_id,
        series: series_info.key(),
        requester,
        dealer,
        side: report.side,
        asset_amount: report.asset_amount,
        quote_amount: report.quote_amount,
        quote_mint: series.quote_mint,
        ts: now,
        report_hash,
        status: FillStatus::Approved as u8,
        bump: receipt_bump,
    };

    let mut receipt_data = fill_receipt_info.try_borrow_mut_data()?;
    let discriminator = <FillReceipt as anchor_lang::Discriminator>::DISCRIMINATOR;
    receipt_data[..8].copy_from_slice(&discriminator);
    let mut writer = &mut receipt_data[8..];
    receipt.serialize(&mut writer)?;

    emit!(ReceivedFillReport {
        report,
        series: series_info.key(),
        requester,
        dealer,
        report_hash,
    });

    Ok(())
}

fn handle_settle_report(
    ctx: &Context<OnReport>,
    report_bytes: &[u8],
    workflow_id: &[u8; 32],
) -> Result<()> {
    let mut cursor = report_bytes;
    let report = SettleReport::deserialize(&mut cursor)
        .map_err(|_| error!(KalendError::InvalidReportPayload))?;

    if !cursor.is_empty() {
        return err!(KalendError::TrailingReportBytes);
    }

    let remaining = ctx.remaining_accounts;
    if remaining.len() < 2 {
        return err!(KalendError::InvalidReportPayload);
    }

    let config_info = &remaining[0];
    let series_info = &remaining[1];

    let config = load_config(config_info)?;

    if !config.is_authorized_forwarder(ctx.accounts.state.owner, &ctx.accounts.state.key(), workflow_id) {
        return err!(KalendError::InvalidForwarderProgram);
    }

    if series_info.key() != report.series {
        return err!(KalendError::SeriesMismatch);
    }

    let mut series = load_series(series_info)?;
    let mut series_data = series_info.try_borrow_mut_data()?;

    if series.status != SeriesStatus::Open as u8 {
        return err!(KalendError::SeriesNotOpen);
    }

    let now = Clock::get()?.unix_timestamp;
    // Clock validation: Program enforces maturity independently of oracle
    if now < series.maturity_ts {
        return err!(KalendError::SeriesMaturityNotReached);
    }

    if report.index_wad == 0 {
        return err!(KalendError::InvalidIndex);
    }

    // Equity series sanity check: verify within configured dividend cap band
    if series.index_kind == crate::state::IndexKind::ScaledUiDividendAdjusted as u8 {
        let max_allowed = series.idx_open.saturating_add(
            series.idx_open.saturating_mul(series.dividend_cap_bps as u128) / 10_000
        );
        if report.index_wad < series.idx_open || report.index_wad > max_allowed {
            // Persist Disputed (returning an error would roll the status change back).
            series.status = SeriesStatus::Disputed as u8;
            let mut writer = &mut series_data[8..];
            series.serialize(&mut writer)?;
            emit!(SettlementDisputed { series: series_info.key(), index_wad: report.index_wad });
            return Ok(());
        }
    } else {
        // Oracle-independent bound for stake-pool / oracle indexes (spec 7.6 item 8).
        let term = series.maturity_ts.saturating_sub(series.open_ts);
        if !settle_index_within_bounds(series.idx_open, report.index_wad, series.max_rate_bps, term)? {
            series.status = SeriesStatus::Disputed as u8;
            let mut writer = &mut series_data[8..];
            series.serialize(&mut writer)?;
            emit!(SettlementDisputed { series: series_info.key(), index_wad: report.index_wad });
            return Ok(());
        }
    }

    series.idx_settle = report.index_wad;
    series.split_num = report.split_num;
    series.split_den = report.split_den;
    series.settled_ts = now;
    series.status = SeriesStatus::Settled as u8;

    let mut writer = &mut series_data[8..];
    series.serialize(&mut writer)?;

    emit!(ReceivedSettleReport {
        report,
        series: series_info.key(),
        idx_settle: report.index_wad,
    });

    Ok(())
}

fn handle_rate_report(
    ctx: &Context<OnReport>,
    report_bytes: &[u8],
    workflow_id: &[u8; 32],
) -> Result<()> {
    let mut cursor = report_bytes;
    let report = RateReport::deserialize(&mut cursor)
        .map_err(|_| error!(KalendError::InvalidReportPayload))?;

    if !cursor.is_empty() {
        return err!(KalendError::TrailingReportBytes);
    }

    let remaining = ctx.remaining_accounts;
    if remaining.len() < 4 {
        return err!(KalendError::InvalidReportPayload);
    }

    let config_info = &remaining[0];
    let rate_record_info = &remaining[1];
    let rent_vault_info = &remaining[2];
    let system_program_info = &remaining[3];

    let config = load_config(config_info)?;

    if !config.is_authorized_forwarder(ctx.accounts.state.owner, &ctx.accounts.state.key(), workflow_id) {
        return err!(KalendError::InvalidForwarderProgram);
    }

    let (expected_record_pda, record_bump) = Pubkey::find_program_address(
        &[RateRecord::SEED, report.benchmark_id.as_ref()],
        &crate::ID,
    );
    if rate_record_info.key() != expected_record_pda {
        return err!(KalendError::Unauthorized);
    }

    // Allocate account if not yet created
    if rate_record_info.data_is_empty() {
        let (expected_rent_vault, rent_bump) = Pubkey::find_program_address(
            &[RENT_VAULT_SEED],
            &crate::ID,
        );
        if rent_vault_info.key() != expected_rent_vault {
            return err!(KalendError::Unauthorized);
        }

        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(RateRecord::LEN);
        let rent_vault_seeds: &[&[u8]] = &[RENT_VAULT_SEED, &[rent_bump]];
        let create_ix = system_instruction::create_account(
            rent_vault_info.key,
            rate_record_info.key,
            lamports,
            RateRecord::LEN as u64,
            &crate::ID,
        );

        invoke_signed(
            &create_ix,
            &[
                rent_vault_info.clone(),
                rate_record_info.clone(),
                system_program_info.clone(),
            ],
            &[rent_vault_seeds, &[RateRecord::SEED, report.benchmark_id.as_ref(), &[record_bump]]],
        )?;
    }

    let now = Clock::get()?.unix_timestamp;
    let record = RateRecord {
        benchmark_id: report.benchmark_id,
        rate_bps: report.rate_bps,
        window_end: report.window_end,
        updated_ts: now,
        bump: record_bump,
    };

    let mut record_data = rate_record_info.try_borrow_mut_data()?;
    let discriminator = <RateRecord as anchor_lang::Discriminator>::DISCRIMINATOR;
    record_data[..8].copy_from_slice(&discriminator);
    let mut writer = &mut record_data[8..];
    record.serialize(&mut writer)?;

    emit!(ReceivedRateReport { report });

    Ok(())
}
