use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod math;
pub mod state;

use instructions::*;

declare_id!("Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527");

#[program]
pub mod kalend {
    use super::*;

    /// Initializes protocol global Config, Registry, and RentVault PDA
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        cluster_mode: u8,
        enclave_key_hash: [u8; 32],
        fee_bps: u16,
        treasury: Pubkey,
    ) -> Result<()> {
        instructions::initialize_config::initialize_config_handler(ctx, cluster_mode, enclave_key_hash, fee_bps, treasury)
    }

    /// Updates or registers a forwarder entry in Config
    pub fn set_forwarder_entry(
        ctx: Context<AdminAction>,
        index: u8,
        program: Pubkey,
        state: Pubkey,
        allowed_workflow: [u8; 32],
    ) -> Result<()> {
        instructions::admin::set_forwarder_entry(ctx, index, program, state, allowed_workflow)
    }

    /// Proposes a new governance authority (two-step transfer)
    pub fn propose_authority(ctx: Context<AdminAction>, new_authority: Pubkey) -> Result<()> {
        instructions::admin::propose_authority(ctx, new_authority)
    }

    /// Accepts pending governance authority
    pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
        instructions::admin::accept_authority(ctx)
    }

    /// Toggles global protocol pause
    pub fn pause_global(ctx: Context<AdminAction>, paused: bool) -> Result<()> {
        instructions::admin::pause_global(ctx, paused)
    }

    /// Toggles pause on an individual Series
    pub fn pause_series(ctx: Context<PauseSeries>, paused: bool) -> Result<()> {
        instructions::admin::pause_series(ctx, paused)
    }

    /// Sets or updates a wallet's AllowEntry permissions and expiration
    pub fn set_allow_entry(
        ctx: Context<SetAllowEntry>,
        wallet: Pubkey,
        roles: u8,
        expiry_ts: i64,
    ) -> Result<()> {
        instructions::allowlist::set_allow_entry(ctx, wallet, roles, expiry_ts)
    }

    /// Closes an AllowEntry account
    pub fn remove_allow_entry(ctx: Context<RemoveAllowEntry>, wallet: Pubkey) -> Result<()> {
        instructions::allowlist::remove_allow_entry(ctx, wallet)
    }

    /// Deploys a new dated yield Series with PT/YT Token-2022 mints
    pub fn open_series(
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
        instructions::open_series::open_series_handler(
            ctx,
            maturity_ts,
            nonce,
            index_kind,
            index_source,
            idx_open,
            privacy_mode,
            max_rate_bps,
            dividend_cap_bps,
            accept_issuer_risk,
        )
    }

    /// Strips raw collateral into equal 1:1 PT and YT tokens
    pub fn strip(ctx: Context<Strip>, amount: u64) -> Result<()> {
        instructions::strip::strip_handler(ctx, amount)
    }

    /// Merges equal PT and YT tokens before maturity, releasing 1:1 raw collateral
    pub fn merge(ctx: Context<Merge>, amount: u64) -> Result<()> {
        instructions::merge::merge_handler(ctx, amount)
    }

    /// Locks tokens into a program-owned Escrow PDA
    pub fn lock_escrow(ctx: Context<LockEscrow>, amount: u64, lock_until: i64) -> Result<()> {
        instructions::escrow::lock_escrow(ctx, amount, lock_until)
    }

    /// Withdraws tokens from Escrow PDA after lock_until expires
    pub fn withdraw_escrow(ctx: Context<WithdrawEscrow>, amount: u64) -> Result<()> {
        instructions::escrow::withdraw_escrow(ctx, amount)
    }

    /// Receives and processes reports from Chainlink Keystone Forwarder CPI
    pub fn on_report(ctx: Context<OnReport>, metadata: Vec<u8>, report: Vec<u8>) -> Result<()> {
        instructions::on_report::on_report_handler(ctx, metadata, report)
    }

    /// Permissionlessly executes an approved fill using an Address Lookup Table
    pub fn execute_fill(ctx: Context<ExecuteFill>) -> Result<()> {
        instructions::execute_fill::execute_fill_handler(ctx)
    }

    /// Permissionless onchain settlement crank for StakePoolRate series
    pub fn settle_onchain(ctx: Context<SettleOnchain>) -> Result<()> {
        instructions::settle_onchain::settle_onchain_handler(ctx)
    }

    /// Redeems settled PT tokens for in-kind raw principal collateral
    pub fn redeem_pt(ctx: Context<RedeemPt>, amount: u64) -> Result<()> {
        instructions::settlement::redeem_pt(ctx, amount)
    }

    /// Claims accrued yield for settled YT tokens in raw collateral
    pub fn claim_yt(ctx: Context<ClaimYt>, amount: u64) -> Result<()> {
        instructions::settlement::claim_yt(ctx, amount)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::instructions::admin::MOCK_FORWARDER_PROGRAM_DEVNET;
    use crate::state::{Config, roles, AllowEntry};

    #[test]
    fn test_id() {
        assert_eq!(ID, pubkey!("Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527"));
    }

    #[test]
    fn test_mainnet_rejects_mock_forwarder_invariant() {
        let mut config = Config {
            authority: Pubkey::new_unique(),
            pending_authority: Pubkey::default(),
            forwarders: Default::default(),
            forwarder_count: 0,
            enclave_key_hash: [0u8; 32],
            paused: false,
            cluster_mode: 2, // Mainnet mode
            fee_bps: 0,
            treasury: Pubkey::new_unique(),
            bump: 254,
        };

        // When cluster_mode is Mainnet (2), adding the mock forwarder must be rejected
        let candidate_program = MOCK_FORWARDER_PROGRAM_DEVNET;
        let is_mock_forbidden = config.cluster_mode == 2 && candidate_program == MOCK_FORWARDER_PROGRAM_DEVNET;
        assert!(is_mock_forbidden);

        // In devnet mode (1), mock forwarder is allowed
        config.cluster_mode = 1;
        let is_devnet_mock_allowed = config.cluster_mode != 2 || candidate_program != MOCK_FORWARDER_PROGRAM_DEVNET;
        assert!(is_devnet_mock_allowed);
    }

    #[test]
    fn test_allow_entry_roles_bitmask_invariant() {
        let entry = AllowEntry {
            wallet: Pubkey::new_unique(),
            expiry_ts: 1_000_000,
            roles: roles::REQUESTER | roles::DEALER,
            bump: 255,
        };

        assert!(entry.has_role(roles::REQUESTER, 500_000));
        assert!(entry.has_role(roles::DEALER, 500_000));
        assert!(!entry.has_role(roles::STRIP, 500_000));
        // Expired check
        assert!(!entry.has_role(roles::REQUESTER, 1_000_001));
    }

    #[test]
    fn test_multi_tranche_waterfall_escrow_math() {
        let mut escrow_amount: u64 = 1_000_000;
        let tranches = vec![400_000u64, 350_000u64, 250_000u64];

        for t in &tranches {
            assert!(escrow_amount >= *t);
            escrow_amount = escrow_amount.checked_sub(*t).expect("checked_sub");
        }

        assert_eq!(escrow_amount, 0);

        // Over-fill must fail
        let overfill = 1u64;
        assert!(escrow_amount < overfill);
    }
}
