use anchor_lang::prelude::*;
use crate::errors::KalendError;
use crate::state::{Series, SeriesStatus, IndexKind};
use crate::math::WAD;
use crate::events::ReceivedSettleReport;
use crate::events::SettleReport;

pub const SPL_STAKE_POOL_PROGRAM_ID: Pubkey =
    pubkey!("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

#[derive(Accounts)]
pub struct SettleOnchain<'info> {
    #[account(
        mut,
        has_one = index_source @ KalendError::InvalidIndex,
    )]
    pub series: Account<'info, Series>,

    /// CHECK: SPL Stake Pool account whose rate is read directly
    pub index_source: UncheckedAccount<'info>,

    #[account(mut)]
    pub crank: Signer<'info>,
}

pub fn settle_onchain_handler(ctx: Context<SettleOnchain>) -> Result<()> {
    let series = &mut ctx.accounts.series;

    if series.status != SeriesStatus::Open as u8 {
        return err!(KalendError::SeriesNotOpen);
    }

    if series.index_kind != IndexKind::StakePoolRate as u8 {
        return err!(KalendError::Unauthorized);
    }

    let now = Clock::get()?.unix_timestamp;
    if now < series.maturity_ts {
        return err!(KalendError::SeriesMaturityNotReached);
    }

    let idx_settle = stake_pool_rate_wad(&ctx.accounts.index_source.to_account_info())?;

    series.idx_settle = idx_settle;
    series.split_num = 1;
    series.split_den = 1;
    series.settled_ts = now;
    series.status = SeriesStatus::Settled as u8;

    emit!(ReceivedSettleReport {
        report: SettleReport {
            kind: 2,
            version: 1,
            series: series.key(),
            observed_ts: now,
            index_wad: idx_settle,
            split_num: 1,
            split_den: 1,
        },
        series: series.key(),
        idx_settle,
    });

    Ok(())
}

/// Exchange rate of one SPL stake-pool token in WAD: total_lamports / pool_token_supply.
/// Shared by open_series (idx_open) and settle_onchain (idx_settle) so both ends of a
/// series' term come from the same on-chain source.
pub fn stake_pool_rate_wad(pool_info: &AccountInfo) -> Result<u128> {
    if pool_info.owner != &SPL_STAKE_POOL_PROGRAM_ID {
        return err!(KalendError::InvalidIndex);
    }
    let data = pool_info.try_borrow_data()?;
    // SPL Stake Pool layout: total_lamports @258 (u64 LE), pool_token_supply @266 (u64 LE)
    if data.len() < 274 {
        return err!(KalendError::InvalidIndex);
    }
    let total_lamports = u64::from_le_bytes(
        data[258..266].try_into().map_err(|_| error!(KalendError::InvalidIndex))?,
    );
    let pool_token_supply = u64::from_le_bytes(
        data[266..274].try_into().map_err(|_| error!(KalendError::InvalidIndex))?,
    );
    if pool_token_supply == 0 {
        return err!(KalendError::InvalidIndex);
    }
    (total_lamports as u128)
        .checked_mul(WAD)
        .ok_or(error!(KalendError::MathOverflow))?
        .checked_div(pool_token_supply as u128)
        .ok_or(error!(KalendError::MathOverflow))
}
