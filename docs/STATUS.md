# KALEND PROJECT STATUS
Last Updated: 2026-10-02

## Current Phase: Phase 0 Complete -> Entering Phase 1 (Program Core T0)

### Phase 0 Accomplishments:
- [x] Installed official agent skills: `solana-dev` (`.agents/skills/solana-dev`), `chainlink-cre` (`.agents/skills/chainlink-cre`), `chainlink-data-feeds` (`.agents/skills/chainlink-data-feeds`).
- [x] Pinned and verified CRE CLI v1.36.0 in `bin/cre`.
- [x] Verified full CRE TypeScript plain-text documentation (28,754 lines) and starter templates (`hello-confidential-workflows-ts`, `solana-read-write-ts`).
- [x] Locked project brand via `brand.json`.
- [x] Created `AGENTS.md` and `CLAUDE.md` incorporating Sections 1–19.
- [x] Initialized architecture records: `docs/SOURCES.md`, `docs/DECISIONS.md`, `docs/THREAT_MODEL.md`, `docs/REPORT_ACCOUNTS.md`.
- [x] Spike S1 (Confidential HTTP trigger + TEE handler): verified payload sizes, trigger quotas (120 KB quota vs ~6.1 KB payload), and `handlerInTee` configuration.
- [x] Spike S2 (Solana transaction limits & Two-Phase Fill): verified that Phase 1 `on_report` fits within ~661 bytes (under 1232-byte limit); confirmed two-phase fill is mandatory.
- [x] Spike S3 (`on_report` metadata layout & RentVault PDA): verified metadata structure (`workflow_id`, `workflow_name`, `workflow_owner`), discriminator `[214, 173, 18, 221, 173, 148, 151, 208]`, and PDA-funded account creation via `invoke_signed`.
- [x] Spike S4 (Pure JS HPKE & Ed25519 verification): passed all tests in `packages/crypto/test_hpke.js` with zero Node built-in dependencies using `@noble/*`.
- [x] Spike S5 (Token-2022 & Privacy Modes): verified PDA escrow limitation (must use plain transfers), mutual exclusivity of TransferHook and ConfidentialTransfer, and privacy mode architecture.
- [x] Spike S6 (xStocks Multiplier Math & ScaledUiAmountConfig): passed all tests in `scripts/spikes/s6_xstocks_math.py` verifying `live_multiplier(now)` boundary conditions and stock split invariance ($D = m/S$).
- [x] Spike S7 (CRE CLI status & forwarder pair): confirmed unauthenticated state, applied Default Decision 5, and configured forwarder pair for devnet simulation and live deployments.
- [x] Verified Anchor 1.0.2 / 0.32 compilation offline with zero warnings.
- [x] Completed `docs/PHASE0_REPORT.md`.

### Next Actions (Phase 1):
- Implement Anchor program core in `programs/kalend`:
  - `Config`, `RentVault`, `Registry`, `Series`, `AllowEntry`, `Escrow`, `FillReceipt` accounts and seed constraints.
  - State transitions and math modules (fixed point WAD arithmetic, floor division).
  - Instructions: `initialize_config`, `open_series`, `strip`, `merge`, `lock_escrow`, `withdraw_escrow`, `on_report` (with full security checklist), `execute_fill`, `settle_onchain`, `redeem_pt`, `claim_yt`, allowlist and pause administration.
  - Property and invariant tests (INV1 to INV7).
