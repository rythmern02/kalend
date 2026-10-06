# KALEND PRIVACY MODES SPECIFICATION & AUDIT (TIER 1)
Kalend Protocol · Version 1.1 · Updated: 2026-10-03

## 1. Core Principle: Truthfulness Over Marketing Claims
Per Prime Directive 2 (Truthfulness), Kalend explicitly defines what is private and what is public:
- **Client-Side Sealed RFQ**: Quotes and order quantities are encrypted client-side using HPKE (RFC 9180) to the enclave's X25519 key. Neither the relay, nor node operators, nor other dealers ever see plaintext orders or limit prices.
- **On-Chain Settlement**: The final fill transaction emits `FillReceipt` with the agreed fill price and size. Settlement occurs on the public Solana ledger.
- **Token Balances**: Token-2022 Confidential Transfers hide amounts and balances during wallet-to-wallet transfers, but **cannot** hide transfers into or out of PDA program escrows.

---

## 2. Token-2022 Privacy Extension Architecture

### 2.1 The Two Privacy Modes (Immutable Per-Series)
Every series opened via `open_series` specifies an immutable `privacy_mode: u8`:
1. **Plain Mode (`privacy_mode = 0`)** [Default & Kill-Switch]:
   - Standard Token-2022 mints for PT and YT.
   - All balances and transfers are transparent on-chain.
   - Lowest compute overhead; 100% interoperable across all Solana AMMs and wallets.
2. **Confidential Mode (`privacy_mode = 1`)** [Tier 1]:
   - PT and YT Token-2022 mints deployed with the `ConfidentialTransferMint` extension.
   - Token holders generate ElGamal zero-knowledge range proofs client-side to execute confidential transfers between user wallets.
   - Wallet-to-wallet balances and transferred amounts are ciphertext on-chain.

---

## 3. PDA Escrow Constraint & Boundary (G15 / ADR-009)

### Why Escrow Settlements Cannot Be Confidential
- In Solana Token-2022, confidential transfers require the account owner to possess an ElGamal private key to decrypt balances and generate ZK range proofs.
- Program Derived Addresses (PDAs) like Kalend's `Escrow` (`["escrow", series, owner, mint]`) and `Vault` are controlled by program seeds, not by an off-chain ElGamal keyholder.
- Consequently, on-chain smart contracts cannot generate ElGamal ZK proofs during CPI execution without exposing private keys publicly.
- **Conclusion**: Escrow deposits, two-phase fills, strip, merge, and maturity redemptions move standard amounts. Only peer-to-peer secondary market holding of PT/YT can be confidential.

---

## 4. Extension Mutual Exclusivity (G16)
Solana Token-2022 enforces a fundamental technical incompatibility:
- **Transfer Hook** requires inspecting the transferred token amount in plaintext to evaluate compliance or fee rules.
- **Confidential Transfer** encrypts the token amount, preventing the Transfer Hook program from reading it.

Therefore:
- **Equities Series (xStocks)**: Requires a Transfer Hook to enforce allowlisted regulatory transfers. Must run in **Plain Mode**.
- **Staking Series (SOL/LST)**: Has no Transfer Hook requirement. Can optionally run in **Confidential Mode**.

---

## 5. ZK ElGamal Proof Program Status (G14)
- The Solana ZK ElGamal proof program (`ZkTokenProof1111111111111111111111111111111`) was re-enabled on mainnet around epoch 982 (mid-2026).
- Devnet supports basic Token-2022 extension deployment.
- Kalend checks the cluster feature gate before opening a series in Confidential Mode. If the feature gate is disabled on a cluster, the program fails closed with `InvalidPrivacyMode`.
