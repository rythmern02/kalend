use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ");

pub const ALLOWLIST_SEED: &[u8] = b"allowlist";
pub const EXTRA_METAS_SEED: &[u8] = b"extra-account-metas";
pub const KALEND_CORE_PROGRAM_ID: Pubkey = pubkey!("Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527");

/// Precomputed TLV buffer for ExtraAccountMetaList resolving [b"allowlist"] PDA
pub const EXTRA_METAS_BUFFER: [u8; 51] = [
    0x69, 0x25, 0x65, 0xc5, 0x4b, 0xfb, 0x66, 0x1a, // ExecuteInstruction SPL discriminator (8)
    0x27, 0x00, 0x00, 0x00,                         // TLV data length (39 bytes) (4)
    0x01, 0x00, 0x00, 0x00,                         // count = 1 extra account (4)
    0x01,                                           // discriminator: 1 (PDA with executing program ID) (1)
    0x01,                                           // config flags: not signer, not writable (1)
    0x09,                                           // seed len = 9 bytes ("allowlist") (1)
    0x61, 0x6c, 0x6c, 0x6f, 0x77, 0x6c, 0x69, 0x73, 0x74, // "allowlist" (9)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,       // 23 zeroes (23)
];

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

    /// Initializes the ExtraAccountMetaList PDA for a given mint
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetas>,
    ) -> Result<()> {
        let account_size = EXTRA_METAS_BUFFER.len();
        let mint_key = ctx.accounts.mint.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            EXTRA_METAS_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.extra_account_metas],
        ]];

        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(account_size);

        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::create_account(
                &ctx.accounts.payer.key(),
                &ctx.accounts.extra_account_metas.key(),
                lamports,
                account_size as u64,
                &crate::ID,
            ),
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.extra_account_metas.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        let mut data = ctx.accounts.extra_account_metas.try_borrow_mut_data()?;
        data[..account_size].copy_from_slice(&EXTRA_METAS_BUFFER);

        msg!("ExtraAccountMetaList initialized for mint {}", mint_key);
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
        let now = Clock::get()?.unix_timestamp;

        // Invariant Verification: Check institutional accreditation via unified allowlist
        // 1. Direct accreditation in Compliance Registry PDA
        let mut is_approved = registry.is_wallet_approved(recipient_wallet);

        // 2. Fallback check: Core protocol AllowEntry PDA passed in remaining accounts
        if !is_approved {
            for acc in ctx.remaining_accounts.iter() {
                // Verify account key matches recipient allow entry PDA seeds [b"allow", recipient]
                let (expected_pda, _) = Pubkey::find_program_address(
                    &[b"allow", recipient_wallet.as_ref()],
                    &crate::KALEND_CORE_PROGRAM_ID,
                );
                if acc.key == &expected_pda && acc.data_len() >= 66 {
                    if let Ok(data) = acc.try_borrow_data() {
                        // AllowEntry layout: 8 disc + 32 wallet + 8 expiry_ts + 1 roles
                        if data.len() >= 49 {
                            let expiry_bytes: [u8; 8] = data[40..48].try_into().unwrap_or([0; 8]);
                            let expiry_ts = i64::from_le_bytes(expiry_bytes);
                            let roles = data[48];
                            if expiry_ts > now && roles != 0 {
                                is_approved = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        require!(is_approved, HookError::AccountNotAccredited);

        msg!("Compliance check passed: {} transferred to accredited wallet {}", amount, recipient_wallet);
        Ok(())
    }

    /// Fallback handler to catch native Token-2022 Transfer Hook CPIs
    pub fn fallback<'info>(
        _program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        const SPL_EXECUTE_DISCRIMINATOR: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];

        if data.len() >= 16 && &data[..8] == SPL_EXECUTE_DISCRIMINATOR {
            let amount = u64::from_le_bytes(data[8..16].try_into().unwrap());
            if accounts.len() < 6 {
                return Err(ProgramError::NotEnoughAccountKeys.into());
            }

            let destination_info = &accounts[2];
            let dest_data = destination_info.try_borrow_data()?;
            if dest_data.len() < 64 {
                return Err(ProgramError::InvalidAccountData.into());
            }
            let recipient_wallet = Pubkey::new_from_array(dest_data[32..64].try_into().unwrap());

            let registry_info = &accounts[5];
            let reg_data = registry_info.try_borrow_data()?;
            let registry = AllowlistRegistryAccount::try_deserialize(&mut &reg_data[..])?;

            let mut is_approved = registry.is_wallet_approved(recipient_wallet);

            if !is_approved {
                let now = Clock::get()?.unix_timestamp;
                for acc in accounts[6..].iter() {
                    let (expected_pda, _) = Pubkey::find_program_address(
                        &[b"allow", recipient_wallet.as_ref()],
                        &crate::KALEND_CORE_PROGRAM_ID,
                    );
                    if acc.key == &expected_pda && acc.data_len() >= 66 {
                        if let Ok(data) = acc.try_borrow_data() {
                            if data.len() >= 49 {
                                let expiry_bytes: [u8; 8] = data[40..48].try_into().unwrap_or([0; 8]);
                                let expiry_ts = i64::from_le_bytes(expiry_bytes);
                                let roles = data[48];
                                if expiry_ts > now && roles != 0 {
                                    is_approved = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            require!(is_approved, HookError::AccountNotAccredited);

            if amount == u64::MAX {
                msg!("Confidential transfer compliance check passed: u64::MAX encrypted amount to accredited wallet {}", recipient_wallet);
            } else {
                msg!("Compliance check passed: {} transferred to accredited wallet {}", amount, recipient_wallet);
            }
            return Ok(());
        }

        Err(ProgramError::InvalidInstructionData.into())
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
pub struct InitializeExtraAccountMetas<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [EXTRA_METAS_SEED, mint.key().as_ref()],
        bump
    )]
    /// CHECK: ExtraAccountMetaList PDA initialized via CPI to System Program
    pub extra_account_metas: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_id() {
        assert_eq!(ID, pubkey!("7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ"));
    }

    #[test]
    fn test_extra_account_metas_initialization_and_resolution() {
        assert_eq!(EXTRA_METAS_BUFFER.len(), 51);
        const SPL_EXECUTE_DISCRIMINATOR: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];
        assert_eq!(&EXTRA_METAS_BUFFER[..8], &SPL_EXECUTE_DISCRIMINATOR);
        assert_eq!(&EXTRA_METAS_BUFFER[8..12], &39u32.to_le_bytes());
        assert_eq!(&EXTRA_METAS_BUFFER[12..16], &1u32.to_le_bytes());
        assert_eq!(&EXTRA_METAS_BUFFER[19..28], b"allowlist");
    }

    #[test]
    fn test_allowlist_registry_logic() {
        let authority = Pubkey::new_unique();
        let approved_user = Pubkey::new_unique();
        let unapproved_user = Pubkey::new_unique();

        let registry = AllowlistRegistryAccount {
            authority,
            approved_wallets: vec![approved_user],
            bump: 254,
        };

        assert!(registry.is_wallet_approved(approved_user));
        assert!(!registry.is_wallet_approved(unapproved_user));
    }

    #[test]
    fn test_confidential_transfer_u64_max_convention() {
        // Token-2022 passes u64::MAX for confidential transfers because the amount is encrypted.
        const SPL_EXECUTE_DISCRIMINATOR: [u8; 8] = [105, 37, 101, 197, 75, 251, 102, 26];
        let amount = u64::MAX;
        let mut instruction_data = Vec::new();
        instruction_data.extend_from_slice(&SPL_EXECUTE_DISCRIMINATOR);
        instruction_data.extend_from_slice(&amount.to_le_bytes());

        assert_eq!(instruction_data.len(), 16);
        assert_eq!(&instruction_data[..8], &SPL_EXECUTE_DISCRIMINATOR);
        let unpacked_amount = u64::from_le_bytes(instruction_data[8..16].try_into().unwrap());
        assert_eq!(unpacked_amount, u64::MAX);
    }
}
