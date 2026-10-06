use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};
use crate::errors::KalendError;
use crate::state::{
    AllowEntry, Escrow, FillReceipt, FillStatus, Series, SeriesStatus, roles,
};
use crate::events::FillExecuted;

#[derive(Accounts)]
pub struct ExecuteFill<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    /// CHECK: Verified against fill_receipt.requester
    pub requester: UncheckedAccount<'info>,

    /// CHECK: Verified against fill_receipt.dealer
    pub dealer: UncheckedAccount<'info>,

    pub asset_mint: InterfaceAccount<'info, Mint>,
    pub quote_mint: InterfaceAccount<'info, Mint>,

    pub asset_token_program: Interface<'info, TokenInterface>,
    pub quote_token_program: Interface<'info, TokenInterface>,

    #[account(
        mut,
        seeds = [FillReceipt::SEED, fill_receipt.round_id.as_ref()],
        bump = fill_receipt.bump,
    )]
    pub fill_receipt: Box<Account<'info, FillReceipt>>,

    #[account(
        has_one = quote_mint,
    )]
    pub series: Box<Account<'info, Series>>,

    #[account(
        seeds = [AllowEntry::SEED, requester.key().as_ref()],
        bump = allow_entry_requester.bump
    )]
    pub allow_entry_requester: Box<Account<'info, AllowEntry>>,

    #[account(
        seeds = [AllowEntry::SEED, dealer.key().as_ref()],
        bump = allow_entry_dealer.bump
    )]
    pub allow_entry_dealer: Box<Account<'info, AllowEntry>>,

    #[account(
        mut,
        seeds = [
            Escrow::SEED,
            series.key().as_ref(),
            requester.key().as_ref(),
            asset_mint.key().as_ref()
        ],
        bump = requester_asset_escrow.bump,
        has_one = series @ KalendError::SeriesMismatch,
        constraint = requester_asset_escrow.owner == requester.key() @ KalendError::PartyMismatch,
    )]
    pub requester_asset_escrow: Box<Account<'info, Escrow>>,

    #[account(
        mut,
        token::mint = asset_mint,
        token::authority = requester_asset_escrow,
        token::token_program = asset_token_program,
    )]
    pub requester_asset_escrow_token: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [
            Escrow::SEED,
            series.key().as_ref(),
            dealer.key().as_ref(),
            quote_mint.key().as_ref()
        ],
        bump = dealer_quote_escrow.bump,
        has_one = series @ KalendError::SeriesMismatch,
        constraint = dealer_quote_escrow.owner == dealer.key() @ KalendError::PartyMismatch,
    )]
    pub dealer_quote_escrow: Box<Account<'info, Escrow>>,

    #[account(
        mut,
        token::mint = quote_mint,
        token::authority = dealer_quote_escrow,
        token::token_program = quote_token_program,
    )]
    pub dealer_quote_escrow_token: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Requester destination account for quote currency
    #[account(
        mut,
        token::mint = quote_mint,
        token::token_program = quote_token_program,
    )]
    pub requester_quote_token: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Dealer destination account for asset currency (PT or YT)
    #[account(
        mut,
        token::mint = asset_mint,
        token::token_program = asset_token_program,
    )]
    pub dealer_asset_token: Box<InterfaceAccount<'info, TokenAccount>>,
}

pub fn execute_fill_handler(ctx: Context<ExecuteFill>) -> Result<()> {
    let receipt = &mut ctx.accounts.fill_receipt;

    if receipt.status == FillStatus::Executed as u8 {
        return err!(KalendError::FillAlreadyExecuted);
    }
    if receipt.status != FillStatus::Approved as u8 {
        return err!(KalendError::FillNotApproved);
    }

    let series = &ctx.accounts.series;
    if series.key() != receipt.series {
        return err!(KalendError::SeriesMismatch);
    }
    if series.status != SeriesStatus::Open as u8 {
        return err!(KalendError::SeriesNotOpen);
    }

    if ctx.accounts.requester.key() != receipt.requester {
        return err!(KalendError::PartyMismatch);
    }
    if ctx.accounts.dealer.key() != receipt.dealer {
        return err!(KalendError::PartyMismatch);
    }

    let now = Clock::get()?.unix_timestamp;

    // Validate active roles for requester and dealer
    if !ctx.accounts.allow_entry_requester.has_role(roles::REQUESTER, now) {
        return err!(KalendError::MissingRole);
    }
    if !ctx.accounts.allow_entry_dealer.has_role(roles::DEALER, now) {
        return err!(KalendError::MissingRole);
    }

    let req_escrow = &mut ctx.accounts.requester_asset_escrow;
    let dlr_escrow = &mut ctx.accounts.dealer_quote_escrow;

    if req_escrow.amount < receipt.asset_amount {
        return err!(KalendError::InsufficientEscrowBalance);
    }
    if dlr_escrow.amount < receipt.quote_amount {
        return err!(KalendError::InsufficientEscrowBalance);
    }

    // Deduct amounts from escrows
    req_escrow.amount = req_escrow.amount.checked_sub(receipt.asset_amount).ok_or(error!(KalendError::MathOverflow))?;
    dlr_escrow.amount = dlr_escrow.amount.checked_sub(receipt.quote_amount).ok_or(error!(KalendError::MathOverflow))?;

    // 1. Transfer asset_amount from requester escrow to dealer destination
    let series_key = req_escrow.series;
    let requester_key = req_escrow.owner;
    let asset_mint_key = req_escrow.mint;
    let req_signer_seeds: &[&[&[u8]]] = &[&[
        Escrow::SEED,
        series_key.as_ref(),
        requester_key.as_ref(),
        asset_mint_key.as_ref(),
        &[req_escrow.bump],
    ]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.asset_token_program.key(),
            TransferChecked {
                from: ctx.accounts.requester_asset_escrow_token.to_account_info(),
                mint: ctx.accounts.asset_mint.to_account_info(),
                to: ctx.accounts.dealer_asset_token.to_account_info(),
                authority: req_escrow.to_account_info(),
            },
            req_signer_seeds,
        ),
        receipt.asset_amount,
        ctx.accounts.asset_mint.decimals,
    )?;

    // 2. Transfer quote_amount from dealer escrow to requester destination
    let dealer_key = dlr_escrow.owner;
    let quote_mint_key = dlr_escrow.mint;
    let dlr_signer_seeds: &[&[&[u8]]] = &[&[
        Escrow::SEED,
        series_key.as_ref(),
        dealer_key.as_ref(),
        quote_mint_key.as_ref(),
        &[dlr_escrow.bump],
    ]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.quote_token_program.key(),
            TransferChecked {
                from: ctx.accounts.dealer_quote_escrow_token.to_account_info(),
                mint: ctx.accounts.quote_mint.to_account_info(),
                to: ctx.accounts.requester_quote_token.to_account_info(),
                authority: dlr_escrow.to_account_info(),
            },
            dlr_signer_seeds,
        ),
        receipt.quote_amount,
        ctx.accounts.quote_mint.decimals,
    )?;

    // Transition receipt status to Executed
    receipt.status = FillStatus::Executed as u8;

    emit!(FillExecuted {
        round_id: receipt.round_id,
        series: receipt.series,
        requester: receipt.requester,
        dealer: receipt.dealer,
        asset_amount: receipt.asset_amount,
        quote_amount: receipt.quote_amount,
    });

    Ok(())
}
