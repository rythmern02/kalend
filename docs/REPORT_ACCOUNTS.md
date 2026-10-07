# REPORT ACCOUNTS SPECIFICATION & ENCODING RULES
Kalend Architecture · Version 1.0 · 2026-10-02

This document defines the exact Borsh report structures, account derivation rules, and `remainingAccounts` layout for Chainlink CRE Keystone Forwarder transactions invoking `on_report(metadata, report)`.

---

## 1. Global Forwarder Contract Invariants

Every report submission from a CRE workflow to the Keystone Forwarder on Solana must supply a deterministic `remainingAccounts` array:
- **Index 0**: `forwarderState` (read-only). Provided by Chainlink deployment.
- **Index 1**: `forwarderAuthority` (signer). Program Derived Address derived as `["forwarder", forwarderState, receiverProgram]` under `forwarderProgramId`.
- **Index 2+**: Receiver accounts specific to the report `kind`.

The forwarder hashes the **entire** list into the report digest and re-verifies it against DON threshold signatures. Upon successful verification, the forwarder strips indices 0 and 1, invoking `on_report` on the Kalend receiver program with indices 2+ forwarded via CPI.

---

## 2. Report Payloads & Receiver Account Layouts

### 2.1 Kind 1: `FillReport` (Two-Phase Fill Authorization)

#### Payload Structure (59 bytes Borsh)
```rust
pub struct FillReport {
    pub kind: u8,            // 1
    pub version: u8,         // 1
    pub round_id: [u8; 32],  // replay guard: FillReceipt PDA ["fill", round_id]
    pub side: u8,            // 0 = SellPT, 1 = SellYT
    pub asset_amount: u64,   // raw PT/YT units
    pub quote_amount: u64,   // raw quote units
    pub not_after: i64,      // upper bound only; on-chain Clock decides
}
```

Why this small: the CRE simulator enforces a 265-byte Solana report limit that mirrors production
(`solana_report=265b`), and the forwarder wraps the payload in ~145 bytes of metadata plus the
account hash. A 187-byte payload produced a 332-byte report and was rejected (2026-10-07). Series,
requester and dealer therefore travel as receiver accounts: the forwarder hashes the whole account
list into the DON-signed report, so they are authenticated exactly as payload fields would be. The
quote mint is read from the Series.

#### Forwarder Account Array (`remainingAccounts`)
| Index | Account | Writable | Signer | Seed / Derivation |
|---|---|---|---|---|
| 0 | `forwarderState` | No | No | Chainlink forwarder state (stripped before CPI) |
| 1 | `forwarderAuthority` | No | Yes (CPI) | `["forwarder", forwarderState, kalendProgram]` under `forwarderProgram` (stripped) |
| 2 | `config` | No | No | `["config"]`; on_report checks address, owner, discriminator |
| 3 | `series` | No | No | Series PDA; owner + discriminator checked, must be Open and unmatured |
| 4 | `fill_receipt` | Yes | No | `["fill", round_id]`; created with RentVault + PDA seeds |
| 5 | `rent_vault` | Yes | No | `["rent"]` |
| 6 | `system_program` | No | No | `11111111111111111111111111111111` |
| 7 | `requester` | No | No | requester wallet |
| 8 | `dealer` | No | No | dealer wallet |

Verified on devnet 2026-10-07: FillReceipt `Dt1wT66Ay2Xdz81VftMy9PHT4835nkZtYU6pewLEMbg3` written via
the CRE mock forwarder (tx `4eBHtvNN1TMBEkR36yRCwqb9jNEsqmx8RYDu5DrM7Nm9rvBtWyEbABw2fwGz7jntZ6AzWiSsyeme2ocj6VDUMd5z`),
executed by `2QHQ9KKK4mLdxjAT2GCRJZpxPX2YUmySteceoz4ZvLYxzoc4jQpLpcMVfirfgMMd6SWFcsPEUKGKejSKPs6Uiatb`.

---

### 2.2 Kind 2: `SettleReport` (Series Maturity Settlement)

#### Payload Structure (66 bytes Borsh)
```rust
pub struct SettleReport {
    pub kind: u8,            // Value = 2
    pub version: u8,         // Value = 1
    pub series: Pubkey,      // Target series PDA
    pub observed_ts: i64,    // Observation timestamp
    pub index_wad: u128,     // Index value scaled by WAD (1e18)
    pub split_num: u32,      // Corporate action split numerator (1 if no split)
    pub split_den: u32,      // Corporate action split denominator (1 if no split)
}
```

#### Forwarder Account Array (`remainingAccounts`)
| Index | Account | Writable | Signer | Seed / Derivation |
|---|---|---|---|---|
| 0 | `forwarderState` | No | No | Chainlink Forwarder State |
| 1 | `forwarderAuthority` | No | Yes (CPI) | `["forwarder", forwarderState, kalendProgram]` under `forwarderProgram` |
| 2 | `config` | No | No | `["config"]` |
| 3 | `series` | Yes | No | `series` pubkey (from payload) |

---

### 2.3 Kind 3: `RateReport` (Benchmark / TWAY Display Index)

#### Payload Structure (26 bytes Borsh)
```rust
pub struct RateReport {
    pub kind: u8,                // Value = 3
    pub version: u8,             // Value = 1
    pub benchmark_id: [u8; 8],   // e.g. "SOL-STK1"
    pub rate_bps: i64,           // Rate in basis points (can be negative in extreme regimes)
    pub window_end: i64,         // Window timestamp
}
```

#### Forwarder Account Array (`remainingAccounts`)
| Index | Account | Writable | Signer | Seed / Derivation |
|---|---|---|---|---|
| 0 | `forwarderState` | No | No | Chainlink Forwarder State |
| 1 | `forwarderAuthority` | No | Yes (CPI) | `["forwarder", forwarderState, kalendProgram]` under `forwarderProgram` |
| 2 | `config` | No | No | `["config"]` |
| 3 | `rate_record` | Yes | No | `["rate", benchmark_id]` |
| 4 | `rent_vault` | Yes | No | `["rent"]` |
| 5 | `system_program` | No | No | `11111111111111111111111111111111` |

---

## 3. Two-Phase Fill Phase 2: `execute_fill` (Address Lookup Table)

Phase 2 executes token transfers directly without forwarder CPI overhead. It is submitted by the relay, winning dealer, or public crank:

#### Accounts for `execute_fill(round_id)`
1. `caller` (signer, pays transaction fee)
2. `config` (read-only)
3. `series` (read-only)
4. `fill_receipt` (writable, verified `status == Approved`, transitions to `Executed`)
5. `requester` (read-only wallet address)
6. `dealer` (read-only wallet address)
7. `requester_allow` (read-only, validates active `Requester` role)
8. `dealer_allow` (read-only, validates active `Dealer` role)
9. `requester_asset_escrow` (writable, PDA `["escrow", series, requester, asset_mint]`)
10. `requester_asset_escrow_token` (writable, ATA of requester escrow)
11. `dealer_quote_escrow` (writable, PDA `["escrow", series, dealer, quote_mint]`)
12. `dealer_quote_escrow_token` (writable, ATA of dealer escrow)
13. `requester_quote_token` (writable, requester destination token account)
14. `dealer_asset_token` (writable, dealer destination token account)
15. `asset_mint` (read-only)
16. `quote_mint` (read-only)
17. `asset_token_program` (read-only, Token or Token-2022)
18. `quote_token_program` (read-only, Token or Token-2022)
19. *(Optional)* Extra accounts resolved via `spl-transfer-hook-interface` if transfer hook is active.

This transaction uses a Versioned Transaction (v0) with an Address Lookup Table (ALT) storing the static program IDs, mints, and config accounts.
