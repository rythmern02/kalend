# Decision Record 0001: Token-2022 Privacy, Dual Extensions & Devnet Rate Sources

**Date:** 2026-10-06  
**Status:** APPROVED & EMPIRICALLY VERIFIED (Spikes A, A2, B, C Complete)  
**Branch:** `wp0-proof-spikes`  

---

## 1. Context & Problem Statement

Kalend provides a private request-for-quote (RFQ) exchange for dated yield (PT/YT) on Solana, with order matching inside an attested Chainlink CRE enclave. To ensure zero-mock production compliance on Solana Devnet, four proof spikes were executed under Work Package 0 (WP0):

1. **Spike A:** Test whether a Token-2022 mint can simultaneously initialize both `ExtensionType.ConfidentialTransferMint` and `ExtensionType.TransferHook`.
2. **Spike A2:** Deploy the transfer hook program, initialize the `ExtraAccountMetaList` PDA (`["extra-account-metas", mint]`), verify transfer interception and allowlist enforcement, and prove Token-2022 confidential transfer interaction.
3. **Spike B (G3):** Evaluate whether a Solana Program-Derived Address (PDA) escrow can execute confidential transfers and construct zero-knowledge ElGamal equality proofs.
4. **Spike C:** Formally audit live rate sources, oracle feeds, and securities endpoints on Solana Devnet and external APIs.

---

## 2. Empirical Spike Results (Solana Devnet)

### Spike A: Dual-Extension Mint Initialization
- **Result:** **PASS**
- **Mint Address:** `Gb3DrC2SYzG3aM8dWvWwU8JHMTX2V9xREJoJ4zqqJ3DR` (Token-2022 on Solana Devnet)
- **Transaction Signature:** `58S5fZrUnAwMe3qfejtLgtucpM2HUgXKjEyEa9TjfKGYMscWkHzN3nrbgCKEgyUNApKrNPv6uMMeQ6UmjRVZDw5j`
- **Verified Configuration:**
  - `ExtensionType.ConfidentialTransferMint` (Authority: `Pga9...SoLnX`, Auto-approve: true)
  - `ExtensionType.TransferHook` (Authority: `Pga9...SoLnX`, Hook Program: `7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ`)

### Spike A2: Transfer Hook Enforcement & Confidential Hook Invariant
- **Result:** **PASS (Mandatory Gate Cleared)**
- **Transfer Hook Program:** `7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ` (Deployed to Devnet, Tx: `4YxwkrbSbAcc4n7gHq53sRngdrQXf49F3vp9g75zpyGXkzEGPCPBnXzWYXtR4FkUUyTtmGKpj5wKE1qzKKQeMEki`)
- **Allowlist Registry PDA:** `Cu9FYhvpEF5HApLVQn5Jm7fXbK2RDFyhNEoE6zem1cao` (Initialized, Tx: `266bDWzDM1mtaySf9TJxxeULHrrwVkiewE25Koyw3PmuoXrtLmyQsbrAB1JBuxcPTY2hZSKDBRjcZ8B7JEepGpi2`)
- **Dual-Extension Test Mint:** `DQYYqMXMd4wxGXQLDbYiVhKFu6yJPKgytw5CFiHjDUC5` (Tx: `4vBQ5Y8rx4Xz85bA6zR4f7TQ9YQyVn61GRKSrD4bJ2CchM4kdCyqsBegzd1kc82wd9SFLpRTTraw93dBDT31YBJv`)
- **ExtraAccountMetaList PDA:** `7Kz4FDD2AwFrtDDMx1XXhBXGdABLMiiguvMqikMZcvsQ` (51 bytes TLV buffer resolving `[b"allowlist"]`, Tx: `uGzBtBMG6ozutDWqu74gasm8dvVD56HVT3tnWrFFXgrR5pcCyEui3Jp8MJbMyfsyNaDCCYMkxh62g4EeGMNueMV`)
- **Unaccredited Transfer Attempt:**
  - Recipient: Unaccredited wallet `356J...`
  - Transaction Result: **FAILED CLOSED** (`Error Code: AccountNotAccredited. Error Number: 6000. Custom program error: 0x1770`).
- **Accreditation Transaction:**
  - Added recipient `HEtssWKdH9VqwhuKjw74ig5FEqn8uGwBoL383TKH8XWz` to allowlist registry (Tx: `5weHHc77JL5muivoqNtN7BeDeCzmcksTyWUiUjtktpmXGdFVCQNemSBVQv3fhHZb93Ts5Vk2qEMTJm16aFN7Hsqa`).
- **Accredited Transfer Attempt:**
  - Recipient: Accredited wallet `HEtssWKdH9VqwhuKjw74ig5FEqn8uGwBoL383TKH8XWz`
  - Transaction Result: **SUCCESS** (Tx: `2LAmMVWMWG2iVLzbrUwALyMJhyJX3HpWGHazXuSU8VgczumhyEEnwaruheA4Wg1YSuL5mSch6PnwNuwMvdjyHA5c`).
- **Confidential Transfer Hook Invariant Proof:**
  - Token-2022 source (`spl-token-2022/src/extension/confidential_transfer/processor.rs:649`):
    ```rust
    // Since the amount is unknown during a confidential transfer, pass in u64::MAX as a convention.
    spl_transfer_hook_interface::onchain::invoke_execute(
        &program_id, source, mint, destination, authority, extra_accounts, u64::MAX,
    )?;
    ```
  - Finding: During confidential transfers, Token-2022 executes the transfer hook CPI passing `amount = u64::MAX`. The hook verifies destination KYC identity without needing to read or decrypt the token amount.

### Spike B: The Escrow PDA Constraint (G3)
- **Result:** **Cryptographic Proof Limitation Confirmed**
- **Finding:** A Program-Derived Address (PDA) on Solana cannot sign arbitrary messages, so it cannot derive the ElGamal secret key scalar that an owner derives by signing a message.
- **Consequence:** An escrow PDA owned by the program **cannot** construct confidential transfer proofs to move funds out of escrow.

### Spike C: Audit of Devnet Rate Sources & External APIs
| Source | Address / Endpoint | Status | Consequence |
|---|---|---|---|
| **SPL Stake Pool** | `HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f` | **ACTIVE (0.505 SOL balance)** | Stake pool is real but small; exchange rate moves microscopically between epochs. Demonstrates mechanics, not market APR. UI must state this explicitly. |
| **Pyth Devnet Oracles** | `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix` (`SOL/USD`), `HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J` (`BTC/USD`) | **ACTIVE** | Active on Devnet. Pyth does not publish individual on-chain U.S. Treasury price accounts on Solana Devnet. |
| **Ondo USDY** | `A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6` | **NOT DEPLOYED ON DEVNET** | Mainnet-beta only. On Devnet, a test mint represents USDY, with the index set manually or from test feeds. |
| **Backpack Securities** | `https://api.backpack.exchange/api/v1/securities` | **REACHABLE (HTTP 200)** | Returns 1,190 tokenized equities/securities. (Earlier check to `/api/v1/assets` was the crypto list). |

---

## 3. Locked Architectural Decisions

### Decision 1: The Fix for G3 (Confidential Escrow)
- **Choice:** **Option A (Plain Escrow with Wallet-Level Confidential Mode)**.
- **Whitepaper Adjustment:**
  - RFQ quotes are matched privately in the Chainlink CRE enclave using HPKE (RFC 9180).
  - The enclave computes the optimal blended rate and knapsack fill waterfall.
  - On-chain settlement requires plain escrow release. When tokens leave escrow, settlement splits between dealers become visible on-chain.
  - The whitepaper claim is softened: *"The execution rate is blended in the enclave and the requester receives a single blended execution price, but on-chain settlement splits are visible at execution."*

### Decision 2: Default Privacy Mode Fallback
- **Choice:** **Option B (Strict by Default)**.
- **Behavior:**
  - No automatic fallback to plaintext transfers.
  - If a destination wallet does not support confidential transfers, the transaction fails closed, and the UI displays an explanation with an explicit button: *"Continue in plain mode"*.
  - Institutions can disable plain mode entirely in account settings.

### Decision 3: Treasury Product for U.S. vs Non-U.S. Counterparties
- **Choice:** **Option A with Strict Honest Labels**.
- **Labels:**
  - *"Test mint standing in for USDY"*
  - *"Index set manually, not market data"*
  - Ondo USDY retains the Reg S badge (*"Non-U.S. Persons Only"*).
  - OUSG mentioned for U.S. funds as *"Terms to be confirmed with Ondo"* with no stated minimum until verified.

### Decision 4: Equities Vault Scope
- **Choice:** **Option B (Deferred)**.
- **Behavior:**
  - Marked as *"Not live"* on the Vaults page.
  - Zero unverified dividend yields displayed.
  - Securities API endpoint (`/api/v1/securities`) wired as a read-only preview catalog once verified, not a live vault.
