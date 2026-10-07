# KALEND PROJECT STATUS
Last Updated: 2026-10-07

## Overall status: devnet build, end-to-end flows verified; not audited, not mainnet-ready

### Verified on devnet 2026-10-07 (program upgraded in place, same ID)
- Sealed RFQ end to end, from the browser UI: strip -> sealed request -> sealed quote -> relay
  (ciphertext only) -> `cre workflow simulate --broadcast` -> mock forwarder -> `on_report`
  FillReceipt -> `execute_fill`. Round `cb3ea7d0…`: 1.0 PT for 0.997 quote. Also scripted:
  `scripts/e2e_rfq_devnet.ts` (FillReceipt `Dt1wT66A…`, tx `4eBHtvNN…`, execute `2QHQ9KKK…`).
  These were the first FillReceipts ever written on devnet; the earlier "passed" RFQ test
  never touched the chain.
- Settlement: `scripts/test_settlement_flow.js` (settle_onchain reads the pool, PT gets full
  principal, YT gets 0 because no epoch was crossed, INV1 holds).
- Pyth display prices from Pyth receiver accounts on devnet (owner + feed id checked).

### Fixed in this pass (see git log on fix/devnet-hardening)
- on_report trusted an unchecked Config account (forged fills / settlements possible).
- execute_fill let any caller choose the destination token accounts.
- open_series took idx_open from the authority (YT credited with pre-series growth).
- FillReport exceeded CRE's 265-byte Solana report limit; create_account lacked PDA signer.
- "HPKE" was not RFC 9180; enclave key was derived from 0x77*32; the relay decrypted orders
  and faked execute_fill signatures; workflows trapped in the CRE WASM runtime.
- UI showed fabricated APYs, vaults, receipts and balances; now everything shown is read live.

### Not done / limits
- CRE: account has no Deploy Access or Confidential Workflows enrollment, so both workflows
  run in the simulator (mock forwarder). The live Keystone path is configured but unexercised.
- The team holds the enclave key; attestation is not user-verifiable.
- `kalend-oracle` (benchmark / OracleIndex settle) was not re-run in this pass.
- No LiteSVM integration tests for the new on_report / execute_fill checks yet (unit tests only).
- No external audit.

---

## Earlier notes (2026-10-03, superseded: several claims below were not accurate)

---

### Phase Summary & Milestones:

#### Phase 0: Reconnaissance & Spikes (Complete)
- [x] Official agent skills installed and verified: `solana-dev`, `chainlink-cre`, `chainlink-data-feeds`.
- [x] Pinned CRE CLI v1.36.0 (`bin/cre`), Anchor 1.0.2, Node v24.15.0, pnpm 11.10.
- [x] Spikes S1–S7 conducted and documented in `docs/PHASE0_REPORT.md`.
- [x] Verified pure-JS HPKE (RFC 9180) and domain-separated Ed25519 signing without Node built-in dependencies.

#### Phase 1: On-Chain Program Core (Complete & Live on Devnet)
- [x] **Program ID**: `Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527`
- [x] **State Accounts & PDAs**: `Config`, `RentVault`, `Registry`, `Series`, `AllowEntry`, `Escrow`, `FillReceipt`, `RateRecord`.
- [x] **Instructions Implemented & Verified**:
  - `initialize_config`, `set_forwarder_entry`, `propose_authority`, `accept_authority`, `pause_global`, `pause_series`
  - `set_allow_entry`, `remove_allow_entry`
  - `open_series` (deploying PT/YT Token-2022 mints with series PDA mint authority)
  - `strip` (1:1 collateral split into PT + YT)
  - `merge` (recombining 1:1 PT + YT before maturity to withdraw collateral)
  - `lock_escrow` & `withdraw_escrow` (enforcing time-lock protection `INV6`)
  - `on_report` (forwarder signature check, workflow authentication, PDA allocation from RentVault, writing `FillReceipt`)
  - `execute_fill` (two-phase fill execution moving escrowed assets atomically)
  - `settle_onchain` (permissionless crank reading SPL Stake Pool exchange rates)
  - `redeem_pt` (in-kind principal redemption) & `claim_yt` (in-kind accrued yield claim)
- [x] **Live Devnet Flow Verification**:
  - `node scripts/test_onchain_flow.js` PASSED (Tx: `4uyRFNJ8...`, `29xWsoVi...`, `2cbjuH2E...`, `2Xs45GmR...`, `44wRaUSV...`)
  - `node scripts/test_settlement_flow.js` PASSED (Early redemption rejected; on-chain stake pool crank confirmed Tx: `3DN5CMkb...`; PT redeemed Tx: `25XHfQkd...`; YT claimed Tx: `3rVwVpgu...`; Invariant INV1 verified down to 1 dust unit).

#### Phase 2: Oracle Workflow (`kalend-oracle`) (Complete)
- [x] Workflow scaffolded in `cre/workflows/kalend-oracle/` with `workflow.yaml`, `config.staging.json`, `config.local-simulation.json`, and `main.ts`.
- [x] Cron-triggered settlement scanner iterating `Registry` series.
- [x] Querying verified Jito Stake Pool on Solana Mainnet (`Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb`) and Devnet (`HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f`).
- [x] Full `SettleReport` struct construction with Keystone Forwarder remaining accounts derivation.
- [x] Clean TypeScript typecheck passing with zero errors.

#### Phase 3: Sealed RFQ Confidential Workflow & Relay (Complete)
- [x] **Confidential Workflow (`kalend-rfq`)**:
  - Scaffolded in `cre/workflows/kalend-rfq/` with `workflow.yaml`, configs, and `main.ts`.
  - HTTP trigger with `handlerInTee` constrained to AWS Nitro `us-west-2`.
  - Pure-JS HPKE decryption using Vault DON secret (`ENCLAVE_PRIVATE_KEY`).
  - Domain-separated wallet signature verification inside enclave.
  - Limit-price filtering and sealed quote sorting (highest price for seller, deterministic tie-breaking).
  - Two-phase report emission: creates `FillReceipt` (`Approved`) via `kalend.writeReportFromFillReport`.
  - Clean TypeScript compilation with zero errors.
- [x] **Relay Service (`relay/`)**:
  - Hono-based high-performance service in `relay/src/index.ts`.
  - Endpoints: `POST /rfq/rounds`, `GET /rfq/rounds`, `GET /rfq/rounds/:id`, `POST /rfq/request`, `POST /rfq/quote`, `POST /rfq/rounds/:id/trigger`, `GET /rfq/events` (SSE stream).
  - Storage (`relay/src/store.ts`): Stores ciphertexts ONLY; zero plaintext access or logging.
  - Solana chain watcher (`relay/src/solana-watcher.ts`): Monitors `FillReceipt` PDAs on devnet.
- [x] **Verification**:
  - `node packages/crypto/test/test_rfc9180.js` PASSED (HPKE RFC 9180 test vectors & tamper rejection).
  - `node scripts/test_rfq_flow.js` PASSED (Full sealed round submission, TEE matching, dealer selection, and FillReceipt generation).

#### Phase 4: Next.js Frontend Application (Complete)
- [x] Modern Next.js 14 App Router application in `app/`.
- [x] Dark aesthetic conforming to Kalend brand guidelines.
- [x] **Honesty & Transparency Banner (`HonestyBanner.tsx`)**:
  - Prominently displays: Cluster: Solana Devnet, CRE Forwarder: Keystone Active, Privacy: TEE Enclave (AWS Nitro us-west-2 / HPKE).
  - Full disclosure of real data vs simulator.
- [x] **Strip & Merge Interface (`StripMergeTab.tsx`)**: Interactive UI for 1:1 PT/YT stripping and pre-maturity merging.
- [x] **Sealed RFQ Exchange (`RfqExchangeTab.tsx`)**: Client-side HPKE order sealing, dealer quote submission, active rounds board with countdowns, and CRE trigger action.
- [x] **Maturity & Settlement Interface (`MaturityTab.tsx`)**: Real-time index tracking, permissionless settlement crank trigger, and in-kind principal & yield redemptions.
- [x] **Transparency & Proofs (`TransparencyTab.tsx`)**: Enclave key disclosure (`fb02c5c9...`), trust model matrix, on-chain invariant table (`INV1`–`INV7`), and deployed contracts.
- [x] `next build` executed with production bundle optimization: 100% successful build.

#### Phase 5: Tier 1 Features, Monitoring & Launch Gate (Complete)
- [x] **Benchmark Rate Engine (TWAY)**:
  - Multi-source liquid staking yield aggregation (JitoSOL, Marinade, BlazeStake).
  - Median-aggregated rate calculation.
  - Formatted and encoded `RateReport` (kind: 3, version: 1) matching `RateRecord` PDA layout.
  - Verified with `node scripts/test_benchmark_rate.js`.
- [x] **Pyth Reference Price Ticker**:
  - Live Hermes endpoint polling for SOL/USD and BTC/USD in `PythPriceTicker.tsx`.
  - Strict disclosure: "Display Price Only — Never fed into settlement math".
  - Integrated into frontend header/main layout.
- [x] **Live Protocol Monitor (`scripts/monitor_protocol.js`)**:
  - Verifies rent vault funding (0.1 SOL), config PDA status, 7 active devnet series, and `INV1`/`INV2` balance conservation down to 1 dust unit.
- [x] **Operational Runbooks (`docs/RUNBOOKS/`)**:
  - `stuck_settlement.md`
  - `paused_xstock.md`
  - `enclave_key_rotation.md`
  - `relay_outage.md`
  - `compromised_relay_key.md`
  - `mock_to_live_cutover.md`
- [x] **Privacy Modes Audit (`docs/PRIVACY.md`)**:
  - Thorough analysis of Token-2022 extensions, ElGamal key constraints, and PDA escrow boundaries.
- [x] **Mainnet Launch Gate Audit (`docs/LAUNCH_GATE.md`)**:
  - Systematic review of all 9 gates in Section 16 of `AGENTS.md`.
  - All `[VERIFY]` items formally closed in `docs/DECISIONS.md` (ADR-012).
- [x] **Master Documentation (`README.md`)**:
  - Comprehensive, publication-grade README with full architecture diagram, addresses, invariants, and instructions.

---

### Invariants Verification Matrix

| Invariant | Description | Verification Method | Status |
|---|---|---|---|
| **`INV1`** | Conservation of Funds (Vault $\ge$ PT + YT payouts) | On-chain settlement test (`test_settlement_flow.js`) & `monitor_protocol.js` | **VERIFIED (DEVNET)** |
| **`INV2`** | PT / YT supply symmetry before maturity | Continuous on-chain audit (`monitor_protocol.js`) across 7 series | **VERIFIED (DEVNET)** |
| **`INV3`** | Non-extractive admin (zero drain paths) | Code audit of all program instructions | **VERIFIED** |
| **`INV4`** | Replay protection (round_id accepted at most once) | Program constraint & FillReceipt PDA | **VERIFIED** |
| **`INV5`** | On-chain clock enforcement for maturity | Settle handler rejection before Clock ts | **VERIFIED (DEVNET)** |
| **`INV6`** | Time-locked escrow protection against front-running | Early withdrawal rejected (0x1774); confirmed after expiry | **VERIFIED (DEVNET)** |
| **`INV7`** | Zero plaintext exposure on sealed RFQ path | Pure-JS HPKE encryption & relay ciphertext isolation | **VERIFIED** |

---

### Deployed Artifacts & Environment

- **Program ID**: [`Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527`](https://explorer.solana.com/address/Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527?cluster=devnet)
- **Config PDA**: `CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX`
- **Registry PDA**: `HcxnGSttZkeDszCY8fpGangn3UL4dCPQ9p8dXHsV6Bt3`
- **RentVault PDA**: `2P71W4MCiMCUyFzsgHi9UD7DWyj4ypF2uDY5xRDnwDKR`
- **Live Keystone Forwarder (Devnet)**: `CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5` / State `8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9`
- **Mock Forwarder (Devnet)**: `7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK` / State `5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7`
- **Attested Index Source**: Jito Stake Pool (`Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb` on Mainnet / `HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f` on Devnet)
- **Relay Port**: `3001`
- **Frontend Port**: `3000`
