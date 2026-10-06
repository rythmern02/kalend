use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};
use crate::errors::KalendError;
use crate::state::{Config, Escrow, Series, AllowEntry, roles};
use crate::events::{EscrowLocked, EscrowWithdrawn};

#[derive(Accounts)]
#[instruction(amount: u64, lock_until: i64)]
pub struct LockEscrow<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    pub series: Account<'info, Series>,

    /// AllowEntry validating the user has Requester, Dealer, or Strip permissions
    #[account(
        seeds = [AllowEntry::SEED, owner.key().as_ref()],
        bump = allow_entry.bump
    )]
    pub allow_entry: Account<'info, AllowEntry>,

    #[account(
        init_if_needed,
        payer = owner,
        space = Escrow::LEN,
        seeds = [
            Escrow::SEED,
            series.key().as_ref(),
            owner.key().as_ref(),
            mint.key().as_ref()
        ],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// Escrow token account owned by Escrow PDA (canonical ATA)
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub escrow_token: InterfaceAccount<'info, TokenAccount>,

    /// Owner token source account
    #[account(mut)]
    pub owner_token: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct WithdrawEscrow<'info> {
    pub series: Account<'info, Series>,

    #[account(
        mut,
        seeds = [
            Escrow::SEED,
            series.key().as_ref(),
            owner.key().as_ref(),
            mint.key().as_ref()
        ],
        bump = escrow.bump,
        has_one = owner @ KalendError::Unauthorized,
        has_one = mint @ KalendError::TokenMismatch,
    )]
    pub escrow: Account<'info, Escrow>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// Escrow token account owned by Escrow PDA (canonical ATA)
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub escrow_token: InterfaceAccount<'info, TokenAccount>,

    /// Owner destination token account
    #[account(mut)]
    pub owner_token: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn lock_escrow(
    ctx: Context<LockEscrow>,
    amount: u64,
    lock_until: i64,
) -> Result<()> {
    if amount == 0 {
        return err!(KalendError::ZeroAmount);
    }
    if ctx.accounts.config.paused {
        return err!(KalendError::ProtocolPaused);
    }

    let now = Clock::get()?.unix_timestamp;
    if !ctx.accounts.allow_entry.has_role(roles::REQUESTER | roles::DEALER | roles::STRIP, now) {
        return err!(KalendError::MissingRole);
    }

    let escrow = &mut ctx.accounts.escrow;
    escrow.owner = ctx.accounts.owner.key();
    escrow.series = ctx.accounts.series.key();
    escrow.mint = ctx.accounts.mint.key();
    escrow.lock_until = std::cmp::max(escrow.lock_until, lock_until);
    escrow.amount = escrow.amount.checked_add(amount).ok_or(error!(KalendError::MathOverflow))?;
    escrow.bump = ctx.bumps.escrow;

    // Transfer tokens into escrow account
    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.owner_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.escrow_token.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(EscrowLocked {
        series: escrow.series,
        owner: escrow.owner,
        mint: escrow.mint,
        amount,
        lock_until: escrow.lock_until,
    });

    Ok(())
}

pub fn withdraw_escrow(ctx: Context<WithdrawEscrow>, amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(KalendError::ZeroAmount);
    }

    let now = Clock::get()?.unix_timestamp;
    let escrow = &mut ctx.accounts.escrow;

    // Strict front-running protection: Cannot withdraw before lock_until expires
    if now < escrow.lock_until {
        return err!(KalendError::EscrowLocked);
    }

    if escrow.amount < amount {
        return err!(KalendError::InsufficientEscrowBalance);
    }

    escrow.amount = escrow.amount.checked_sub(amount).ok_or(error!(KalendError::MathOverflow))?;

    // Prepare Escrow PDA signer seeds
    let series_key = escrow.series;
    let owner_key = escrow.owner;
    let mint_key = escrow.mint;
    let signer_seeds: &[&[&[u8]]] = &[&[
        Escrow::SEED,
        series_key.as_ref(),
        owner_key.as_ref(),
        mint_key.as_ref(),
        &[escrow.bump],
    ]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.escrow_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.owner_token.to_account_info(),
                authority: escrow.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(EscrowWithdrawn {
        series: escrow.series,
        owner: escrow.owner,
        mint: escrow.mint,
        amount,
    });

    Ok(())
}
