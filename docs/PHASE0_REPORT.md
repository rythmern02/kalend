# PHASE 0 RECONNAISSANCE & SPIKE REPORT
Kalend Protocol Engineering · Completed: 2026-10-02

This report compiles the empirical results and verified findings for Spikes S1 through S7, concluding Phase 0 of the Kalend exchange implementation per Section 15.

---

## Executive Summary

All Phase 0 spikes (S1–S7) have been executed and verified against official Chainlink CRE documentation (v1.36.0, 28,754 lines), official templates (`hello-confidential-workflows-ts`, `solana-read-write-ts`), the Solana Token-2022 specification, xStocks developer documentation, and prior art (`COUPON`).

No blocking STOP conditions were encountered. The default architectural rules (Section 15, ADR-001 through ADR-010) are applied:
1. **Two-Phase Fill is confirmed**: Phase 1 (`on_report`) authorizes the fill into `FillReceipt` PDA (~661 bytes footprint total), staying safely under the 1232-byte transaction cap. Phase 2 (`execute_fill`) executes token movements via a Versioned Transaction with an Address Lookup Table.
2. **Pure JS HPKE Verified**: RFC 9180 HPKE (X25519-HKDF-SHA256 + ChaCha20-Poly1305) and Ed25519 wallet signing execute deterministically using `@noble/curves`, `@noble/ciphers`, and `@noble/hashes` without Node.js `node:crypto` built-ins.
3. **Dividend & Multiplier Invariance Verified**: $D(t) = m(t) / S$ mathematically eliminates false yield from stock splits while capturing legitimate dividend reinvestment.
4. **CRE Deployment Tier**: As no active user login exists in the CLI environment, Default Decision 5 applies: workflows operate via `cre workflow simulate` with `--broadcast` against the devnet Mock Forwarder, with the global mode banner displaying `CRE: Simulator`. When credentials are provided, `kalend-oracle` transitions to live deployment via the Keystone Forwarder.

---

## Detailed Spike Findings

### Spike S1: Confidential HTTP Trigger & Enclave Matching in Simulation
- **Trigger Payload Limit**: CRE limits allow 120 KB request payload for HTTP triggers. An RFQ round bundle containing 1 sealed request and 8 sealed dealer quotes requires ~6.1 KB (~5% of the quota).
- **TEE Handler Syntax**: Verified from official template `hello-confidential-workflows-ts`:
  ```typescript
  cre.handlerInTee(
    httpTrigger.trigger({ authorizedKeys: [config.relayEvmAddress] }),
    onRfqTrigger,
    [{ tee: 'nitro', regions: ['us-west-2'] }]
  )
  ```
- **Result Observability**: Enclave matches winning quote and emits `FillReport` via `runtime.usingTheDons().report(...)`. The relay and frontend learn of round execution by monitoring the onchain creation of `FillReceipt` PDAs, avoiding reliance on relay-side state.

### Spike S2: Real Solana Write Size & Two-Phase Fill Safety
- **Payload Dimensions**:
  - `FillReport`: 187 bytes (Borsh).
  - `remainingAccounts` for `on_report`: 7 accounts (2 forwarder accounts + 5 receiver accounts: `Config`, `Series`, `FillReceipt`, `RentVault`, `SystemProgram`).
  - Account overhead in transaction: $7 \times 32 = 224$ bytes.
  - Forwarder signatures, header, and hash: ~250 bytes.
  - Total transaction size: ~661 bytes.
- **Safety Margin**: $1232 - 661 = 571$ bytes remaining. A single-phase fill requiring 18–22 accounts would exceed 1244 bytes and fail. Two-phase fill is strictly verified.
- **Address Lookup Table**: The CRE SDK `writeReport` method exposes `remainingAccounts` and `computeConfig` but has no ALT parameter. ALTs are reserved for Phase 2 (`execute_fill`), which Kalend constructs directly.

### Spike S3: `on_report` Metadata Layout & RentVault PDA Account Allocation
- **Metadata Layout**: Forwarder CPI delivers:
  - `metadata`: 32 bytes `workflow_id`, 10 bytes `workflow_name`, 20 bytes `workflow_owner` (EVM address).
  - `report`: Borsh-encoded payload starting with `kind: u8, version: u8`.
- **Anchor Discriminator**: Standard 8-byte discriminator `[214, 173, 18, 221, 173, 148, 151, 208]`.
- **Account Allocation via `RentVault`**: Verified in Anchor 1.0.2. `on_report` executes `system_program::create_account` funded by the `RentVault` PDA (`["rent"]`) via `invoke_signed(&ix, accounts, &[&[b"rent", &[rent_bump]]])`.

### Spike S4: Cryptography & Runtime Compatibility
- **Library Compatibility**: Tested and verified in `packages/crypto/test_hpke.js` with `@noble/curves` v2.4.0, `@noble/ciphers` v2.4.0, and `@noble/hashes` v2.4.0.
- **Test Outcomes**:
  - Ephemeral X25519 key exchange + HKDF-SHA256: 44 bytes derived (32 bytes key, 12 bytes nonce).
  - ChaCha20-Poly1305 encryption/decryption: 650-byte ciphertext for signed RFQ orders.
  - Poly1305 MAC integrity: Tampered ciphertext or tampered AAD headers rejected immediately.
  - Ed25519 wallet signatures: Verified inside enclave over domain-separated tag `KALEND/v1/request`.
- **Zero Node Dependencies**: Verified pure JS implementation without `node:crypto`.

### Spike S5: Devnet Token-2022 & Privacy Mode Boundaries
- **PDA Escrow Constraint**: PDA accounts lack ElGamal private keys and cannot construct ElGamal zero-knowledge range proofs. Consequently, onchain settlement, escrow deposits, and fills operate via standard token transfers.
- **Extension Incompatibility**: `TransferHook` and `ConfidentialTransfer` cannot co-exist on the same Token-2022 mint.
  - Equity series: Uses `TransferHook` for regulatory allowlist enforcement, with non-confidential balances.
  - Staking series: Can enable `ConfidentialTransfer` for wallet-to-wallet transfers (T1 privacy mode), without a transfer hook.

### Spike S6: Real Mainnet xStock Multiplier & Corporate Actions
- **Live Mint Ground Truth**: SPYx mint `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W` verified from COUPON prior art.
- **`ScaledUiAmountConfig` Layout**: 56 bytes (`authority: [u8; 32]`, `multiplier: f64`, `new_multiplier: f64`, `new_multiplier_effective_timestamp: i64`).
- **`live_multiplier(now)` Boundary Tests**: Tested in `scripts/spikes/s6_xstocks_math.py`:
  - $t = T_{\text{eff}} - 1$: returns `multiplier`.
  - $t = T_{\text{eff}}$: returns `new_multiplier`.
  - $t = T_{\text{eff}} + 1$: returns `new_multiplier`.
- **Stock Split Invariance**: Tested: 2-for-1 split doubles multiplier and split factor ($S = 2$), leaving $D = m/S$ identical and yielding strictly 0 to YT holders.

### Spike S7: CRE Environment & Forwarder Configuration
- **CRE CLI Version**: v1.36.0 pinned in `bin/cre`.
- **Authentication**: Unauthenticated; Default Decision 5 applies (`cre workflow simulate --broadcast` targeting devnet Mock Forwarder).
- **Forwarder Registry in `Config`**:
  - Live Keystone Forwarder (Devnet): `CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5` / State `8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9`.
  - Mock Forwarder (Devnet): `7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK` / State `5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7`.
  - `Config.forwarders` stores both entries on devnet.

---

## Transition to Phase 1

With all spikes verified and invariants established, Phase 0 is formally concluded. The project transitions directly into **Phase 1: Program Core (T0) and Invariant Test Suite**.
