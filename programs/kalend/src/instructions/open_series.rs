use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::errors::KalendError;
use crate::state::{Config, Registry, Series, IndexKind, SeriesStatus};
use crate::events::SeriesOpened;

#[derive(Accounts)]
#[instruction(
    maturity_ts: i64,
    nonce: u16,
    index_kind: u8,
    index_source: Pubkey,
    idx_open: u128,
    privacy_mode: u8,
    max_rate_bps: u32,
    dividend_cap_bps: u32,
    accept_issuer_risk: bool,
)]
pub struct OpenSeries<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = authority @ KalendError::Unauthorized
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        mut,
        seeds = [Registry::SEED],
        bump = registry.bump
    )]
    pub registry: Box<Account<'info, Registry>>,

    #[account(
        init,
        payer = authority,
        space = Series::LEN,
        seeds = [
            Series::SEED,
            collateral_mint.key().as_ref(),
            maturity_ts.to_le_bytes().as_ref(),
            nonce.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub series: Box<Account<'info, Series>>,

    /// Raw collateral mint
    pub collateral_mint: InterfaceAccount<'info, Mint>,

    /// Program owning the collateral mint (Token or Token-2022)
    pub collateral_token_program: Interface<'info, TokenInterface>,

    /// Quote asset mint
    pub quote_mint: InterfaceAccount<'info, Mint>,

    /// Principal Token (PT) Token-2022 mint
    #[account(
        init,
        payer = authority,
        mint::decimals = collateral_mint.decimals,
        mint::authority = series,
        mint::token_program = token_2022_program,
    )]
    pub pt_mint: Box<InterfaceAccount<'info, Mint>>,

    /// Yield Token (YT) Token-2022 mint
    #[account(
        init,
        payer = authority,
        mint::decimals = collateral_mint.decimals,
        mint::authority = series,
        mint::token_program = token_2022_program,
    )]
    pub yt_mint: Box<InterfaceAccount<'info, Mint>>,

    /// Vault account holding raw collateral (canonical ATA owned by Series PDA)
    #[account(
        init,
        payer = authority,
        associated_token::mint = collateral_mint,
        associated_token::authority = series,
        associated_token::token_program = collateral_token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_2022_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn open_series_handler(
    ctx: Context<OpenSeries>,
    maturity_ts: i64,
    nonce: u16,
    index_kind: u8,
    index_source: Pubkey,
    idx_open: u128,
    privacy_mode: u8,
    max_rate_bps: u32,
    dividend_cap_bps: u32,
    accept_issuer_risk: bool,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    if maturity_ts <= now {
        return err!(KalendError::MaturityInPast);
    }
    if idx_open == 0 {
        return err!(KalendError::InvalidIndex);
    }

    // Extension policy enforcement (Section 7.5)
    validate_collateral_mint(
        &ctx.accounts.collateral_mint.to_account_info(),
        index_kind,
        accept_issuer_risk,
    )?;

    let series = &mut ctx.accounts.series;
    series.collateral_mint = ctx.accounts.collateral_mint.key();
    series.collateral_program = ctx.accounts.collateral_token_program.key();
    series.quote_mint = ctx.accounts.quote_mint.key();
    series.index_kind = index_kind;
    series.index_source = index_source;
    series.idx_open = idx_open;
    series.open_ts = now;
    series.maturity_ts = maturity_ts;
    series.pt_mint = ctx.accounts.pt_mint.key();
    series.yt_mint = ctx.accounts.yt_mint.key();
    series.vault = ctx.accounts.vault.key();
    series.status = SeriesStatus::Open as u8;
    series.idx_settle = 0;
    series.split_num = 1;
    series.split_den = 1;
    series.settled_ts = 0;
    series.privacy_mode = privacy_mode;
    series.max_rate_bps = max_rate_bps;
    series.dividend_cap_bps = dividend_cap_bps;
    series.nonce = nonce;
    series.bump = ctx.bumps.series;

    // Register in Registry
    let registered = ctx.accounts.registry.append(series.key());
    if !registered {
        return err!(KalendError::RegistryFull);
    }

    emit!(SeriesOpened {
        series: series.key(),
        collateral_mint: series.collateral_mint,
        quote_mint: series.quote_mint,
        pt_mint: series.pt_mint,
        yt_mint: series.yt_mint,
        open_ts: now,
        maturity_ts,
        idx_open,
    });

    Ok(())
}

fn validate_collateral_mint(
    mint_info: &AccountInfo,
    index_kind: u8,
    accept_issuer_risk: bool,
) -> Result<()> {
    use anchor_spl::token_2022::spl_token_2022::extension::{
        BaseStateWithExtensions, ExtensionType, StateWithExtensions,
    };
    use anchor_spl::token_2022::spl_token_2022::state::Mint as MintState;

    let mint_data = mint_info.try_borrow_data()?;
    if let Ok(state) = StateWithExtensions::<MintState>::unpack(&mint_data) {
        let extension_types = state.get_extension_types().unwrap_or_default();

        for ext in extension_types {
            match ext {
                // Strictly forbidden extensions breaking 1:1 vault accounting or custody
                ExtensionType::TransferFeeConfig
                | ExtensionType::MintCloseAuthority
                | ExtensionType::NonTransferable => {
                    return err!(KalendError::DisallowedCollateralExtension);
                }

                // Permitted conditionally with explicit risk acknowledgment
                ExtensionType::PermanentDelegate | ExtensionType::Pausable => {
                    if !accept_issuer_risk {
                        return err!(KalendError::DisallowedCollateralExtension);
                    }
                }

                // ScaledUiAmount permitted ONLY for ScaledUiDividendAdjusted equities series
                ExtensionType::ScaledUiAmount => {
                    if index_kind != IndexKind::ScaledUiDividendAdjusted as u8 {
                        return err!(KalendError::DisallowedCollateralExtension);
                    }
                }

                _ => {}
            }
        }
    }

    Ok(())
}
