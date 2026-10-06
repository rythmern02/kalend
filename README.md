# KALEND: Private Request-for-Quote Exchange for Dated Yield on Solana

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet%20Verified-blue?logo=solana)](https://explorer.solana.com/address/Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527?cluster=devnet)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE%20Confidential%20Workflow-375BD2?logo=chainlink)](https://docs.chain.link/cre)
[![Anchor 1.0](https://img.shields.io/badge/Anchor-1.0.2-black)](https://anchor-lang.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org)
[![RFC 9180 HPKE](https://img.shields.io/badge/Crypto-HPKE%20RFC%209180-success)]()

> **Kalend** is a production-grade private Request-for-Quote (RFQ) exchange for dated yield (Principal Tokens / Yield Tokens) on Solana, settled through Chainlink CRE (Chainlink Runtime Environment).
>
> Core design guarantees:
> 1. **Base Layer Sovereign Funds**: Strip, merge, escrow, redeem, and claim execute on Solana base layer with zero admin fund extraction paths.
> 2. **Confidential RFQ in TEE**: Order sizes and limit prices are encrypted client-side via HPKE (RFC 9180) and matched inside a Chainlink CRE confidential enclave (AWS Nitro `us-west-2`).
> 3. **Minimal On-Chain Footprint**: Only the cryptographic fill receipt and the final attested maturity touch the public chain.
> 4. **No Simulated Yield**: Yield and settlement are driven exclusively by real attested data (SPL Liquid Stake Pools and Token-2022 multipliers).

---

## Architecture Overview

```
Requester ─┐  sealed (HPKE RFC 9180)             ┌────────────────────── Chainlink CRE ────────────────────────┐
Dealers   ─┼─► Relay (Hono / SSE) ─ JWT(EVM) ───►│ CRE Gateway ──► Workflow DON ──► TEE ENCLAVE (AWS Nitro)   │
           │   (Sees ciphertext only,            │                                   - Decrypt HPKE secret     │
           │    zero plaintext logged)           │                                   - Verify Ed25519 signature│
           │                                     │                                   - Confidential JSON-RPC   │
           │                                     │                                   - Match best price        │
           │                                     │                                     │ FillReport            │
           │                                     │ Keystone Forwarder (Solana) ◄───────┴───────────────────────┤
Oracle Workflow (Cron): Reads Series, queries    └─────────────────────────────────────────────────────────────┘
SPL Stake Pool, derives SettleReport & RateReport                                    │ CPI on_report
                                                                                     ▼
Solana Base Layer: Kalend Program (`Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527`)
  ├── Config PDA (`CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX`)
  ├── Registry PDA (`HcxnGSttZkeDszCY8fpGangn3UL4dCPQ9p8dXHsV6Bt3`)
  ├── RentVault PDA (`2P71W4MCiMCUyFzsgHi9UD7DWyj4ypF2uDY5xRDnwDKR`)
  ├── Series PDAs (Maturity, Vault ATA, PT Mint, YT Mint)
  ├── Escrow PDAs (Time-locked tokens preventing front-running)
  └── FillReceipt PDAs (Replay-protected two-phase fill execution)
```

---

## Live Deployed Addresses (Solana Devnet)

| Component | Account / Address | Notes |
|---|---|---|
| **Kalend Program ID** | [`Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527`](https://explorer.solana.com/address/Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527?cluster=devnet) | Anchor 1.0.2 / SBF Binary |
| **Config PDA** | `CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX` | Seeds: `["config"]` |
| **Registry PDA** | `HcxnGSttZkeDszCY8fpGangn3UL4dCPQ9p8dXHsV6Bt3` | Seeds: `["registry"]` |
| **RentVault PDA** | `2P71W4MCiMCUyFzsgHi9UD7DWyj4ypF2uDY5xRDnwDKR` | Seeds: `["rent"]`, funds `FillReceipt` PDAs |
| **Keystone Forwarder (Live)** | `CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5` | State: `8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9` |
| **Keystone Forwarder (Mock)** | `7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK` | State: `5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7` |
| **Attested Yield Source** | `Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb` | Live Jito Stake Pool (Mainnet & Devnet) |
| **Enclave Key Hash** | `fb02c5c99dcf5b2cbbeea5d8d42ad4a5009f7831d044f509e51fa70b6d213426` | SHA256 of Enclave X25519 Public Key |

---

## Core Security Invariants (`INV1`–`INV7`)

All seven invariants are strictly enforced in on-chain Rust code and verified by continuous automated monitoring:

- **`INV1` (Conservation of Funds)**:
  $$\text{Vault Collateral} \ge \text{PT Redemptions} + \text{YT Claims}$$
  *Verified on devnet down to 1 dust unit: 946,172 PT + 53,827 YT = 999,999 units from 1,000,000 deposit; vault retains exactly 1 unit.*
- **`INV2` (PT / YT Supply Symmetry)**:
  $$\text{Supply}_{\text{PT}} = \text{Supply}_{\text{YT}} \quad (\forall t < \text{maturity})$$
  *Verified across all active series on devnet.*
- **`INV3` (Non-Extractive Admin)**:
  Zero instructions permit admin or protocol authority to transfer user collateral, escrowed assets, or vault balances. Fail-closed.
- **`INV4` (Replay Protection)**:
  Every `FillReceipt` PDA is derived from `["fill", round_id]` with the `init` constraint. Replayed rounds are impossible.
- **`INV5` (Clock Enforcement for Maturity)**:
  Settlement requires `Clock::get()?.unix_timestamp >= series.maturity_ts`. Early settlement reports fail closed.
- **`INV6` (Time-Locked Escrow Protection Against Front-Running)**:
  `withdraw_escrow` is rejected with `EscrowLocked` until `lock_until` passes. A trader cannot pull escrow to front-run an in-flight fill.
- **`INV7` (Zero Plaintext Exposure on RFQ Path)**:
  Orders are encrypted client-side using HPKE (RFC 9180) to the enclave key before leaving the browser. The relay stores only ciphertext.

---

## Repository Structure

```
kalend/
├── programs/kalend/              # Anchor 1.0 Solana program
│   ├── src/instructions/         # strip, merge, escrow, on_report, execute_fill, settle, redeem, claim
│   ├── src/state/                # Config, Registry, Series, Escrow, FillReceipt, RateRecord
│   └── src/math/                 # 128-bit WAD math and dividend-split formulas
├── cre/                          # Chainlink Runtime Environment (CRE)
│   ├── project.yaml              # CRE project specification
│   ├── contracts/solana/         # Generated TypeScript bindings (Kalend.ts)
│   └── workflows/
│       ├── kalend-oracle/        # Cron-triggered settlement scanner & rate reporter
│       └── kalend-rfq/           # Confidential HTTP trigger matching engine (handlerInTee)
├── relay/                        # Hono TypeScript service with SSE & ciphertext store
├── app/                          # Next.js 14 App Router frontend
│   ├── src/components/           # HonestyBanner, RfqExchange, StripMerge, Maturity, PythPriceTicker
│   └── src/lib/solana.ts         # Pure Web3.js / Anchor client helpers
├── packages/
│   ├── crypto/                   # Audited pure-JS HPKE (RFC 9180) and Ed25519 signing
│   └── protocol/                 # Shared Zod schemas and Borsh definitions
├── scripts/                      # Verification and monitoring suites
└── docs/                         # Formal specs, threat model, runbooks, launch gate
    ├── THREAT_MODEL.md           # Trust matrix and failure boundaries
    ├── DECISIONS.md              # Architectural decisions (ADR-001 to ADR-012)
    ├── LAUNCH_GATE.md            # Section 16 launch verification checklist
    ├── PRIVACY.md                # Token-2022 extension privacy audit
    └── RUNBOOKS/                 # Operational incident playbooks
```

---

## Quickstart & Verification Commands

### 1. Test Pure-JS Cryptography (RFC 9180 HPKE)
```bash
node packages/crypto/test/test_rfc9180.js
```
*Validates X25519-HKDF-SHA256 + ChaCha20-Poly1305 encryption, Poly1305 MAC tamper rejection, and domain-separated Ed25519 signature checks.*

### 2. Test End-to-End Sealed RFQ Flow
```bash
./node_modules/.bin/tsx scripts/test_rfq_flow.js
```
*Simulates client-side order sealing, relay intake, TEE confidential quote matching, and `FillReceipt` PDA construction.*

### 3. Test Benchmark Rate Engine (TWAY Tier 1)
```bash
node scripts/test_benchmark_rate.js
```
*Calculates Time-Weighted Average Yield across independent stake pools and validates `RateReport` serialization.*

### 4. Monitor Live Protocol & Invariants on Devnet
```bash
node scripts/monitor_protocol.js
```
*Inspects all live series on Solana Devnet, verifies RentVault funding, and checks invariant `INV1`/`INV2` balance symmetry.*

### 5. Run the Relay Service
```bash
pnpm --filter kalend-relay dev
```
*Starts Hono service on `http://localhost:3001` with SSE stream on `/rfq/events`.*

### 6. Run the Next.js Frontend
```bash
pnpm --filter kalend-app dev
```
*Starts frontend on `http://localhost:3000`.*

---

## Honesty & Transparency Disclosures (Prime Directive 2)

1. **Hardware Enclave vs Simulator**:
   Confidential Workflows are in private beta. The current deployment operates in the verified local enclave simulator (AWS Nitro `us-west-2` constraint schema). The UI prominently marks execution as `CRE: Simulator` until production enclave enrollment is completed.
2. **Key Custody**:
   The enclave's X25519 decryption key is held as a secret in the Chainlink CRE Vault DON. Because the deployment team uploads this secret, the protocol protects orders against node operators, the relay, and the public, **not against the team**. Attestation cannot yet be validated independently by end-users.
3. **No Mock Yield**:
   All devnet and demo yields are calculated from **real attested data**: live Solana Mainnet Jito Stake Pool exchange rates (`Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb`).
4. **Display Oracles**:
   Pyth price feeds in the user interface are labeled **Display Price Only** and are strictly prohibited from feeding into settlement math.

---

## License
Apache-2.0. Built for the Chainlink & Solana ecosystems.
