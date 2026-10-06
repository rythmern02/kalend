use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ");

pub const ALLOWLIST_SEED: &[u8] = b"allowlist";
pub const EXTRA_METAS_SEED: &[u8] = b"extra-account-metas";

#[program]
pub mod kalend_transfer_hook {
    use super::*;

    /// Initializes the compliance registry PDA for institutional accredited wallets
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.allowlist_registry;
        registry.authority = ctx.accounts.authority.key();
        registry.approved_wallets = Vec::new();
        registry.bump = ctx.bumps.allowlist_registry;
        Ok(())
    }

    /// Adds an accredited institutional investor wallet to the approved registry
    pub fn add_accredited_wallet(
        ctx: Context<UpdateRegistry>,
        wallet: Pubkey,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.allowlist_registry;
        if !registry.approved_wallets.contains(&wallet) {
            registry.approved_wallets.push(wallet);
        }
        emit!(WalletAccredited { wallet, timestamp: Clock::get()?.unix_timestamp });
        Ok(())
    }

    /// Removes a wallet from the approved registry upon KYC expiry or sanction
    pub fn remove_accredited_wallet(
        ctx: Context<UpdateRegistry>,
        wallet: Pubkey,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.allowlist_registry;
        if let Some(pos) = registry.approved_wallets.iter().position(|w| *w == wallet) {
            registry.approved_wallets.swap_remove(pos);
        }
        emit!(WalletRevoked { wallet, timestamp: Clock::get()?.unix_timestamp });
        Ok(())
    }

    /// SPL Transfer Hook entrypoint executed automatically by Token-2022 on every token transfer
    /// SPL Transfer Hook discriminator: [105, 37, 101, 197, 75, 251, 102, 26]
    pub fn execute(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        let registry = &ctx.accounts.allowlist_registry;
        let recipient_wallet = ctx.accounts.destination_token.owner;

        // Invariant Verification: Explicitly validate the institutional accreditation of recipient
        // Prevents RWA tokens from being transacted to unverified or toxic counterparty wallets
        require!(
            registry.is_wallet_approved(recipient_wallet),
            HookError::AccountNotAccredited
        );

        msg!("Compliance check passed: {} transferred to accredited wallet {}", amount, recipient_wallet);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = AllowlistRegistryAccount::LEN,
        seeds = [ALLOWLIST_SEED],
        bump
    )]
    pub allowlist_registry: Account<'info, AllowlistRegistryAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRegistry<'info> {
    #[account(
        mut,
        seeds = [ALLOWLIST_SEED],
        bump = allowlist_registry.bump,
        has_one = authority @ HookError::Unauthorized
    )]
    pub allowlist_registry: Account<'info, AllowlistRegistryAccount>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct TransferHook<'info> {
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Token owner authority
    pub owner: UncheckedAccount<'info>,
    /// CHECK: ExtraAccountMetaList PDA derived from ["extra-account-metas", mint]
    pub extra_account_metas: UncheckedAccount<'info>,
    #[account(
        seeds = [ALLOWLIST_SEED],
        bump = allowlist_registry.bump
    )]
    pub allowlist_registry: Account<'info, AllowlistRegistryAccount>,
}

#[account]
#[derive(Default)]
pub struct AllowlistRegistryAccount {
    pub authority: Pubkey,
    pub approved_wallets: Vec<Pubkey>,
    pub bump: u8,
}

impl AllowlistRegistryAccount {
    // 8 (discriminator) + 32 (authority) + 4 + (32 * 64 wallets max for v1) + 1 (bump) + 64 (padding)
    pub const LEN: usize = 8 + 32 + 4 + (32 * 64) + 1 + 64;

    pub fn is_wallet_approved(&self, wallet: Pubkey) -> bool {
        self.approved_wallets.contains(&wallet)
    }
}

#[error_code]
pub enum HookError {
    #[msg("The target destination wallet is not present in the institutional KYC registry.")]
    AccountNotAccredited,
    #[msg("Unauthorized: Caller is not the compliance authority.")]
    Unauthorized,
}

#[event]
pub struct WalletAccredited {
    pub wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct WalletRevoked {
    pub wallet: Pubkey,
    pub timestamp: i64,
}
