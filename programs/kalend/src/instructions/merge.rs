use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, burn, Mint, TokenAccount, TokenInterface, TransferChecked, Burn,
};
use crate::errors::KalendError;
use crate::state::{Series, SeriesStatus};
use crate::events::TokensMerged;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Merge<'info> {
    #[account(
        mut,
        has_one = vault,
        has_one = pt_mint,
        has_one = yt_mint,
        has_one = collateral_mint,
    )]
    pub series: Account<'info, Series>,

    pub collateral_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        mint::token_program = token_2022_program,
    )]
    pub pt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        mint::token_program = token_2022_program,
    )]
    pub yt_mint: InterfaceAccount<'info, Mint>,

    /// Raw collateral vault owned by Series PDA
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// User's raw collateral destination account
    #[account(mut)]
    pub user_collateral: InterfaceAccount<'info, TokenAccount>,

    /// User's PT source account
    #[account(mut)]
    pub user_pt: InterfaceAccount<'info, TokenAccount>,

    /// User's YT source account
    #[account(mut)]
    pub user_yt: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub collateral_token_program: Interface<'info, TokenInterface>,
    pub token_2022_program: Interface<'info, TokenInterface>,
}

pub fn merge_handler(ctx: Context<Merge>, amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(KalendError::ZeroAmount);
    }

    let series = &ctx.accounts.series;
    if series.status != SeriesStatus::Open as u8 {
        return err!(KalendError::SeriesNotOpen);
    }

    let now = Clock::get()?.unix_timestamp;
    if now >= series.maturity_ts {
        return err!(KalendError::SeriesAlreadyMatured);
    }

    // 1. Burn PT from user
    burn(
        CpiContext::new(
            ctx.accounts.token_2022_program.key(),
            Burn {
                mint: ctx.accounts.pt_mint.to_account_info(),
                from: ctx.accounts.user_pt.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // 2. Burn YT from user
    burn(
        CpiContext::new(
            ctx.accounts.token_2022_program.key(),
            Burn {
                mint: ctx.accounts.yt_mint.to_account_info(),
                from: ctx.accounts.user_yt.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // 3. Transfer 1:1 raw collateral from series vault to user
    let collateral_mint_key = series.collateral_mint;
    let maturity_bytes = series.maturity_ts.to_le_bytes();
    let nonce_bytes = series.nonce.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[
        Series::SEED,
        collateral_mint_key.as_ref(),
        maturity_bytes.as_ref(),
        nonce_bytes.as_ref(),
        &[series.bump],
    ]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.collateral_token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.collateral_mint.to_account_info(),
                to: ctx.accounts.user_collateral.to_account_info(),
                authority: ctx.accounts.series.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.collateral_mint.decimals,
    )?;

    emit!(TokensMerged {
        series: series.key(),
        user: ctx.accounts.user.key(),
        amount,
    });

    Ok(())
}
