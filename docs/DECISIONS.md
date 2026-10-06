# ARCHITECTURAL DECISIONS LOG (ADR)
Kalend Engineering · Record initialized: 2026-10-02

All decisions diverging from or clarifying the initial specification are logged here per Rule R8.

---

## ADR-001: Centralized Brand Identity and Name Lock
- **Date**: 2026-10-02
- **Context**: Working codename "Kalend" has a known namespace collision with an external project. A future rename must be achievable via a single atomic commit without code refactors.
- **Decision**: Define `brand.json` in the repository root. All program names, Cargo crate names, npm scopes, environment variables, UI headers, and documentation headers derive from `brand.json` and workspace metadata.
- **Status**: Implemented.

## ADR-002: RFQ Trading Semantics & Asset Flow
- **Date**: 2026-10-02
- **Context**: Clarification of requester vs dealer roles and token escrow mechanisms (Section 19.1).
- **Decision**:
  - The **Requester** sells PT (`SellPT`) or YT (`SellYT`). The requester locks the exact asset amount into a program-owned escrow with a `lock_until` timestamp.
  - The **Dealers** buy PT or YT. Dealers lock a standardized round quote amount into their own program-owned escrow. This prevents revealing quote size via onchain escrow balances before matching.
  - On fill, `asset_amount` moves from requester escrow to the winning dealer, and `quote_amount` moves from dealer escrow to the requester.
- **Status**: Accepted.

## ADR-003: Quote Currency Selection
- **Date**: 2026-10-02
- **Context**: Denomination of fixed-yield exchange quotes (Section 19.2).
- **Decision**:
  - Staking Series: Quoted in wrapped SOL (`wSOL`), ensuring PT pricing directly yields the implied fixed SOL rate $(1/p - 1) \times 365 / \text{days\_left}$.
  - Equities Series: Quoted in `USDC`.
- **Status**: Accepted.

## ADR-004: Two-Phase Fill Settlement
- **Date**: 2026-10-02
- **Context**: Solana transaction size limit is 1232 bytes. Chainlink Keystone Forwarder transactions carry DON node BLS/ECDSA signatures and account public keys (32 bytes per account), leaving restricted space for the CPI invocation.
- **Decision**:
  - Phase 1 (`on_report`): Forwarder CPI verifies the report and initializes the `FillReceipt` PDA in `Approved` status. Requires minimal accounts: `Config`, `Series`, `FillReceipt`, `RentVault`, and `SystemProgram` (~5 accounts total).
  - Phase 2 (`execute_fill`): Permissionless instruction callable by anyone (relay, trader, crank) using an Address Lookup Table (ALT). Transfers tokens from escrows, validates constraints, and marks `FillReceipt` as `Executed`.
- **Status**: Accepted.

## ADR-005: CRE Forwarder Pair on Devnet
- **Date**: 2026-10-02
- **Context**: Local simulation with `--broadcast` routes through the Mock Forwarder, whereas live deployed workflows route through the Keystone Forwarder.
- **Decision**: `Config` holds up to 2 forwarder entries (`forwarders[<=2]`). On Devnet, both the Live Keystone Forwarder (`CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5`) and Mock Forwarder (`7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK`) are configured. On Mainnet, compilation enforces removal and rejection of the Mock Forwarder ID.
- **Status**: Accepted.

## ADR-006: Devnet Attested Staking Yield Source
- **Date**: 2026-10-02
- **Context**: Rule R3 prohibits dummy or simulated yield indexes on shipped paths. Devnet has no liquid staking pool with authentic accrued yield.
- **Decision**: For the Devnet Staking Series, create a labeled test mint backed by real mainnet stake pool data. The CRE Oracle workflow queries live Solana Mainnet liquid staking pool accounts (e.g. JitoSOL stake pool `Jito2Xugd7HzgrPQtRpqqJbuh8FmPAtWmA2vghrE2RN` with token `Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P81AFtgQ`) via consensus-aggregated JSON-RPC. The index calculation $idx = \text{total\_lamports} / \text{pool\_token\_supply}$ is attested by the DON.
- **Status**: Accepted.

## ADR-007: Account Funding for on_report (`RentVault` PDA)
- **Date**: 2026-10-02
- **Context**: The Keystone Forwarder CPI is invoked by the forwarder program without a user wallet signer that can pay lamports for account allocation.
- **Decision**: Establish a dedicated system-owned PDA `RentVault` (`["rent"]`) funded with lamports. `on_report` transfers lamports from `RentVault` to fund rent-exempt balance for the new `FillReceipt` PDA via `invoke_signed`.
- **Status**: Accepted.

## ADR-008: Fee Policy for v1
- **Date**: 2026-10-02
- **Context**: Protocol fee parameterization (Section 19.3).
- **Decision**: Set `fee_bps = 0` for v1 launch. Treasury and fee configurations remain present in `Config` for forward compatibility.
- **Status**: Accepted.

## ADR-009: Privacy Modes and Token Extensions
- **Date**: 2026-10-02
- **Context**: Token-2022 extension combinations and PDA escrow limitations.
- **Decision**:
  - PDA escrows cannot hold ElGamal secret keys; therefore, program-mediated transfers (escrow lock, fill execution, strip, redeem) operate in plain mode.
  - Confidential mode (T1) is supported exclusively for wallet-to-wallet transfers of PT/YT mints created with `ConfidentialTransferMint`.
  - Transfer hook and confidential transfer extensions are mutually exclusive per Token-2022 design; Equities series uses transfer hooks (compliance allowlist enforcement), while Staking series may use confidential transfers.
- **Status**: Accepted.

## ADR-010: CRE CLI Tooling Version Pinning
- **Date**: 2026-10-02
- **Context**: Specification requires CLI v1.29.0 or later; earlier docs mentioned v1.24.0.
- **Decision**: Pin CRE CLI v1.36.0 (released September 2026). Stored in `bin/cre` with local directory isolation.
- **Status**: Implemented.
