# Decision Record 0001: Token-2022 Privacy, Dual Extensions & Devnet Rate Sources

**Date:** 2026-10-06  
**Status:** PROPOSED / SPIKE COMPLETE (Awaiting Operator Decision on G3)  
**Branch:** `wp0-proof-spikes`  

---

## 1. Context & Problem Statement

Kalend provides a private RFQ exchange for dated yield (PT/YT) on Solana, with order matching inside an attested Chainlink CRE enclave. To ensure zero-mock production compliance on Solana Devnet, three proof spikes were conducted under Work Package 0 (WP0):

1. **Spike A:** Test whether a Token-2022 mint can simultaneously initialize both `ExtensionType.ConfidentialTransferMint` and `ExtensionType.TransferHook`, and verify transfer interception.
2. **Spike B (G3):** Evaluate whether a Solana Program-Derived Address (PDA) escrow can execute confidential transfers and construct zero-knowledge ElGamal equality proofs.
3. **Spike C:** Formally audit live rate sources, oracle feeds, and asset mints on Solana Devnet.

---

## 2. Empirical Spike Results (Solana Devnet)

### Spike A: Dual-Extension Mint Initialization
- **Result:** **PASS**
- **Mint Address:** `Gb3DrC2SYzG3aM8dWvWwU8JHMTX2V9xREJoJ4zqqJ3DR` (Token-2022 on Solana Devnet)
- **Transaction Signature:** `58S5fZrUnAwMe3qfejtLgtucpM2HUgXKjEyEa9TjfKGYMscWkHzN3nrbgCKEgyUNApKrNPv6uMMeQ6UmjRVZDw5j`
- **Verified Configuration:**
  - `ExtensionType.ConfidentialTransferMint` (Authority: `Pga9...SoLnX`, Auto-approve: true)
  - `ExtensionType.TransferHook` (Authority: `Pga9...SoLnX`, Hook Program: `7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ`)
- **Transfer Behavior:**
  - Token-2022 requires the `ExtraAccountMetaList` PDA (`["extra-account-metas", mint]`) for the transfer hook program. Without this account or when transferring to an unaccredited wallet, transfers fail closed (`AccountNotFound` / rejection).
  - The native ZK proof program invoked on Devnet is `ZkE1Gama1Proof11111111111111111111111111111` (with `1`s).

### Spike B: The Escrow PDA Constraint (G3)
- **Result:** **Cryptographic Proof Limitation Confirmed**
- **Finding:** A Program-Derived Address (PDA) on Solana has no discrete-log private key scalar ($sk \in \mathbb{Z}_q$). Proof verification in the native proof program (`ZkE1Gama1Proof11111111111111111111111111111`) requires knowledge of the secret key to generate the ElGamal ciphertext equality proof ($C_1 = r \cdot G, C_2 = r \cdot P + m \cdot H$).
- **Consequence:** An escrow PDA owned by the program **cannot** construct confidential transfer proofs to move funds out of escrow.

### Spike C: Audit of Devnet Rate Sources
| Source | Address / Endpoint | Status on Devnet | Consequence |
|---|---|---|---|
| **SPL Stake Pool** | `HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f` | **ACTIVE** (611 bytes, owned by Stake Pool program) | Real on-chain rate indexing verified for LST vault. |
| **Pyth Devnet Oracles** | `J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix` (`SOL/USD`), `HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J` (`BTC/USD`) | **ACTIVE** | Active on Devnet. Pyth does not publish individual on-chain U.S. Treasury price accounts on Solana Devnet. |
| **Ondo USDY** | `A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6` | **NOT DEPLOYED ON DEVNET** | Mainnet-beta only. On Devnet (Stage A), a dedicated Token-2022 collateral test mint must represent USDY. |
| **Backpack Securities** | `https://api.backpack.exchange/api/v1/assets` | **REACHABLE (HTTP 200)** | Public API lists 7,269 assets. No separate sandbox API; read-only ticker calls to the live endpoint supported. |

---

## 3. Decision Points for Lead Operator Approval

Per section 5 of the specification, the agent must stop and present the following decisions:

### Decision 1: The Fix for G3 (Confidential Escrow)
- **Option A (Recommended): Plain Escrow with Wallet-Level Confidential Mode.**
  - Escrow accounts lock tokens in standard balance mode for programmatic settlement (`execute_fill`).
  - Peer-to-peer transfers and user wallet balances use Token-2022 `ConfidentialTransferMint`.
  - RFQ orders remain 100% confidential via HPKE (RFC 9180) to the Chainlink CRE enclave.
  - UI Mode Bar explicitly states: *"Privacy mode: On (enclave matching) · Plain escrow fallback for settlement"*.
- **Option B: Two-Step Signed Settlement.**
  - Requester and winning dealer each sign a client-side ElGamal proof after the enclave publishes the fill receipt, authorizing the release of encrypted funds.
  - Adds a round-trip latency and introduces counterparty griefing risk if a dealer refuses to submit the second signature.
- **Option C: Direct Atomic Swap (No Escrow PDA).**
  - Orders are matched in the enclave without upfront escrow lock. Wallets execute atomic swaps directly.
  - Disadvantage: Requesters and dealers can renege on winning quotes before the swap lands, eliminating trade execution guarantees.

### Decision 2: Default Privacy Mode Fallback
- Whether the privacy fallback to plain tokens in the UI is **On** or **Off** by default for new wallets.

### Decision 3: Treasury Product for U.S. vs Non-U.S. Counterparties
- Ondo USDY is restricted under Reg S to non-U.S. persons.
- For U.S. counterparties, Ondo OUSG requires Qualified Purchaser status ($100K+ minimum).
- Proposed UI: Display USDY as primary for Stage A Devnet, with an explicit jurisdiction badge ("Non-U.S. Persons Only") and an OUSG disclosure for U.S. funds.

### Decision 4: Backpack Equities Vault Scope
- Include Backpack tokenized equities in read-only ticker mode on Devnet, with corporate dividend yield indexing.
