# PHASE 0 RECONNAISSANCE & SPIKE EXECUTION PLAN
Kalend Protocol Engineering · Date: 2026-10-02

This document establishes the reconnaissance findings, documentation cross-checks, discrepancies identified against official sources, and the precise execution plan for Spikes S1 through S7 as required by Section 18 of the Kalend Build Specification.

---

## 1. Skills Installed & Documentation Reviewed

### 1.1 Installed Agent Skills
- **Solana Developer Skill (`solana-dev`)**:
  - Source: `https://github.com/solana-foundation/solana-dev-skill`
  - Installed location: `.agents/skills/solana-dev/`
  - Date installed/verified: 2026-10-02
  - Core guidance: Anchor 1.0 patterns, LiteSVM integration tests, Codama client generation, PDA safety, Token-2022 extension rules.
- **Chainlink CRE Skill (`chainlink-cre`)**:
  - Source: `https://github.com/smartcontractkit/chainlink-agent-skills/tree/main/chainlink-cre-skill`
  - Installed location: `.agents/skills/chainlink-cre/`
  - Date installed/verified: 2026-10-02
  - Core guidance: CRE CLI project layout (`project.yaml`, `workflow.yaml`), HTTP/Cron trigger configurations, TEE handler conventions, simulation mechanics.
- **Chainlink Data Feeds Skill (`chainlink-data-feeds`)**:
  - Source: `https://github.com/smartcontractkit/chainlink-agent-skills/tree/main/chainlink-data-feeds-skill`
  - Installed location: `.agents/skills/chainlink-data-feeds/`
  - Date installed/verified: 2026-10-02
  - Core guidance: Price feed validation, freshness checks, decimals scaling, and fallback handling.

### 1.2 Official Documentation Reviewed
1. **Chainlink CRE Plaintext LLM Documentation (`/cre/ts/llms-full.txt`)**:
   - URL: `https://docs.chain.link/cre/ts/llms-full.txt` (Fetched 2026-10-02, 28,754 lines).
   - Read & analyzed: CLI v1.36.0, `SolanaClient`, `handlerInTee`, forwarder addresses, PDA derivation rules, simulation vs production limits.
2. **Chainlink CRE Starter Templates**:
   - `hello-confidential-workflows-ts` (AWS Nitro TEE handler, Vault DON secrets, `usingTheDons()` bridge).
   - `solana-read-write-ts` (`SolanaClient`, `writeReportFrom<Struct>`, `remainingAccounts` layout).
3. **Solana Token-2022 & Token Extensions**:
   - URLs: `https://solana.com/docs/tokens/extensions`, `https://www.solana-program.com/docs/token-2022/extensions`.
   - Extensions reviewed: `ScaledUiAmountConfig`, `TransferHook`, `ConfidentialTransfer`, `PermanentDelegate`, `Pausable`.
4. **xStocks Developer Documentation**:
   - URL: `https://docs.xstocks.fi/developers/multipliers` (Fetched 2026-10-02).
   - Multiplier mechanics, corporate actions, upcoming actions API, and dividend reinvestment.
5. **Prior Art (COUPON)**:
   - URL: `https://github.com/xElvolution/coupon` (Fetched 2026-10-02).
   - SPYx Mainnet mint verified: `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W`.

---

## 2. Discrepancies Between Official Documentation & Initial Specification

| Topic | Initial Prompt / Legacy Note | Official Documentation (2026-10-02) | Action / Resolution |
|---|---|---|---|
| **CRE CLI Version** | Whitepaper: v1.24.0; Prompt: v1.29.0+ | Official releases: **v1.36.0** (September 2026) | Installed v1.36.0 locally in `bin/cre`. |
| **HTTP in Enclave** | Use `ConfidentialHTTPClient` inside TEE | In TEE handlers (`TeeRuntime`), `HTTPClient.sendRequest()` has a `TeeRuntime` overload. `ConfidentialHTTPClient` has NO `TeeRuntime` overload and must not be used in TEE. | Use `new cre.capabilities.HTTPClient().sendRequest(runtime, ...)` inside `handlerInTee`. |
| **Solana ALT in CRE** | Spec investigated if `writeReport` supports Address Lookup Tables | `SolanaClient.writeReport` and generated bindings accept only `remainingAccounts` and `computeConfig`. No ALT parameter exists in the SDK. | Confirmed default: Two-phase fill. Phase 1 (`on_report`) uses bare minimal accounts; Phase 2 (`execute_fill`) uses client-assembled versioned transaction with ALT. |
| **Borsh Enums in IDL** | Generator handling of top-level Borsh enums for multi-payload dispatch | IDL generators map structs in `types` to `writeReportFrom<StructName>`. Top-level Rust enums with data variants often produce complex or non-idiomatic TS bindings in CLI codegen. | Use explicit `kind: u8, version: u8` header fields in bare structs (`FillReport`, `SettleReport`, `RateReport`), referenced in Anchor events. |
| **Forwarder Addresses** | Single forwarder assumption | Simulation routes through Mock Forwarder (`7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK`); deployed workflows route through Keystone Forwarder (`CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5`). | Store `forwarders[<=2]` in `Config` so devnet supports both simulator and live forwarder runs seamlessly. |
| **Token-2022 hook vs confidential** | Incompatible on same mint | Verified: `TransferHook` requires reading plaintext amount; `ConfidentialTransfer` encrypts amount. They cannot co-exist. | Equities series uses `TransferHook` (allowlist enforcement); Staking series uses `ConfidentialTransfer` (privacy mode T1) with no hook. |

---

## 3. Spike Execution Matrix (S1 – S7)

### Spike S1: Confidential HTTP Trigger & Enclave Matching in Simulation
- **Objective**: Verify HTTP trigger + `handlerInTee` in simulation, payload size limits, request authentication, and relay result polling.
- **Verification Commands & Actions**:
  1. Scaffold minimal confidential workflow with HTTP trigger and `handlerInTee` constrained to Nitro `us-west-2`.
  2. Test payload size limits (target: ≤100 KB payload, standard RFQ bundle < 20 KB).
  3. Validate simulation behavior with `HOME=/tmp ./bin/cre workflow simulate --limits`.

### Spike S2: Solana Report Size & Account Limit Budget
- **Objective**: Measure bytes of `FillReport`, `remainingAccounts` hash overhead, forwarder signatures vs 1232-byte transaction cap. Confirm two-phase fill safety.
- **Verification Commands & Actions**:
  1. Calculate Borsh byte size of `FillReport` (32 + 32 + 1 + 32 + 32 + 8 + 8 + 32 + 8 + 2 = 196 bytes).
  2. Compute account list size for `on_report` (5 accounts = 160 bytes).
  3. Verify total transaction size budget (well under 600 bytes, safe margin under 1232 bytes).

### Spike S3: `on_report` Metadata Layout & RentVault PDA Account Allocation
- **Objective**: Confirm metadata structure passed by the forwarder, discriminator dispatch, and whether `on_report` can fund `FillReceipt` PDA using `RentVault`.
- **Verification Commands & Actions**:
  1. Verify metadata byte offsets: `workflow_id` (32 bytes), `workflow_name` (10 bytes), `workflow_owner` (20 bytes).
  2. Write Rust CPI spike testing `invoke_signed` from `RentVault` PDA to `system_instruction::create_account` for `FillReceipt`.

### Spike S4: Cryptography & Runtime Compatibility
- **Objective**: Validate pure-JS HPKE (RFC 9180: X25519-HKDF-SHA256 + ChaCha20-Poly1305) in WASM/V8 environment without Node built-in dependencies.
- **Verification Commands & Actions**:
  1. Benchmark `@noble/ciphers` and `@noble/curves` in standard JS environment.
  2. Execute RFC 9180 official test vectors.
  3. Confirm zero Node.js `crypto` or native addon dependencies.

### Spike S5: Devnet Token-2022 Capabilities & Feature Gate Status
- **Objective**: Verify Token-2022 confidential transfer and transfer hook availability on Devnet.
- **Verification Commands & Actions**:
  1. Query Devnet feature gate status for ZK ElGamal proof program (`Zk11111111111111111111111111111111111111111`).
  2. Confirm PDA escrow transfer model (plain transfers for program escrows, confidential mode reserved for wallet-to-wallet).

### Spike S6: Real Mainnet xStock Multiplier & Corporate Action Inspection
- **Objective**: Inspect live mainnet xStock mint (`SPYx`: `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W`), decode `ScaledUiAmountConfig`, and verify corporate action API schema.
- **Verification Commands & Actions**:
  1. Query mainnet RPC for `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W`.
  2. Decode offset for `multiplier`, `new_multiplier`, `new_multiplier_effective_timestamp`.
  3. Verify `live_multiplier(now)` logic across boundaries.

### Spike S7: CRE Environment & Account Preflight
- **Objective**: Determine authentication, deploy access, private registry quota, and devnet forwarder state.
- **Verification Commands & Actions**:
  1. Run `HOME=/tmp ./bin/cre whoami` and `HOME=/tmp ./bin/cre registry list`.
  2. Determine deployment tier automatically per ADR-005 and Section 8.1.

---

## 4. Immediate Phase 0 Execution Sequence
Phase 0 will execute sequentially through scripts and isolated test harnesses in `scripts/spikes/`. Findings will be compiled into `docs/PHASE0_REPORT.md` immediately upon completion.
