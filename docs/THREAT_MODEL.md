# THREAT MODEL & TRUST BOUNDARIES
Kalend Architecture · Version 1.0 · 2026-10-02

This document defines the security guarantees, attack surfaces, and trust assumptions of the Kalend exchange protocol across its physical and cryptographic components.

---

## 1. Actor Capabilities Matrix

| Actor | Can | Cannot |
|---|---|---|
| **Relay Operator** | Delay, drop, or reorder RFQ rounds; observe timing, IP origins, and ciphertext payload sizes; trigger CRE workflows using authorized EVM key | Decrypt RFQ orders; forge trader signatures; manipulate matching outcome; move collateral or escrow tokens |
| **Workflow DON Nodes** | Observe the encrypted HTTP trigger payload; verify consensus signatures; observe signed `FillReport` and `SettleReport` outputs | Read plaintext orders (protected by HPKE inside the AWS Nitro enclave); forge enclave execution without TEE attestation |
| **Kalend Engineering Team** | Possess the master X25519 enclave secret key at deployment/upload time; initiate program upgrades or parameter updates via authority multisig | Move user funds without user transactions (no admin extraction instructions exist in the program); forge user ed25519 wallet signatures |
| **CRE DON (Byzantine Compromise)** | Deliver an invalid or delayed report to the Keystone Forwarder | Mature a series prematurely (the Anchor program verifies onchain `Clock`); bypass sanity caps (`max_rate_bps`, dividend bands); siphon user vault balances |
| **Protocol Authority (Multisig)** | Emergency pause new strips/escrows/fills; update allowlist entries; configure new series parameters; rotate forwarders | Extract vault or escrow collateral; mint PT/YT tokens without depositing matching 1:1 collateral; block redemptions/claims after series maturity |
| **xStocks Issuer (Equities Collateral)** | Pause the tokenized stock mint; seize or burn balances via Token-2022 `PermanentDelegate` | Bypass protocol verification; forge oracle corporate action reports |

---

## 2. Invariants & Enforcement Points

### Invariant 1: Vault Collateral Adequacy (INV1)
- **Statement**: $\text{raw\_vault\_balance} \ge \text{pt\_supply}$ at all times prior to settlement.
- **Enforcement**: Token deposit occurs in `strip` before PT/YT minting. `merge` burns PT and YT before releasing collateral. No instruction allows collateral withdrawal without burning or legitimate redemption.

### Invariant 2: PT/YT Supply Parity (INV2)
- **Statement**: $\text{pt\_supply} == \text{yt\_supply}$ prior to settlement.
- **Enforcement**: `strip` strictly mints equal quantities of PT and YT. `merge` strictly burns equal quantities.

### Invariant 3: Post-Settlement Conservation (INV3)
- **Statement**: $\sum \text{pt\_redemptions} + \sum \text{yt\_claims} \le \text{vault\_balance}_{\text{settle}}$.
- **Enforcement**: Math in `redeem_pt` and `claim_yt` uses integer floor division with $u128$ scaling. Rounding dust permanently remains in the vault, favoring protocol safety.

### Invariant 4: Token Conservation during Fills (INV4)
- **Statement**: Fills do not mint or burn tokens; they execute an atomic, non-custodial exchange between requester and winning dealer escrows.
- **Enforcement**: Escrow balances are strictly verified against fill receipt amounts.

### Invariant 5: Replay Protection (INV5)
- **Statement**: Each `round_id` is processed at most once.
- **Enforcement**: `FillReceipt` PDA uses seed `["fill", round_id]`. Creating the account uses `init`, which fails if the PDA already exists.

### Invariant 6: Temporal Ordering (INV6)
- **Statement**: `strip` occurs only prior to maturity ($T_{\text{now}} < T_{\text{maturity}}$); `settle` occurs only at or after maturity ($T_{\text{now}} \ge T_{\text{maturity}}$); `redeem_pt` and `claim_yt` occur only after `status == Settled`.
- **Enforcement**: Program checks `Clock::get()?.unix_timestamp` directly, refusing any oracle-supplied timestamps for state transitions.

### Invariant 7: Custody Integrity (INV7)
- **Statement**: No administrative or external role can withdraw user escrow or vault funds.
- **Enforcement**: Escrow withdrawal is gated strictly by account owner and `lock_until <= Clock::get()?.unix_timestamp`.

---

## 3. Threat Vectors & Mitigations

### 3.1 Relay Censorship & Front-Running
- **Vector**: The relay operator delays a round or observes order timing to front-run quote submissions.
- **Mitigation**: Orders are sealed client-side using HPKE before submission to the relay. Dealers lock standardized round collateral rather than precise quote sizes, preventing size leakage. Tie-breaking among equivalent quotes is deterministic: $\text{hash}(\text{round\_id} \mathbin{\Vert} \text{dealer\_pubkey})$, eliminating relay arrival timestamp bias.

### 3.2 Enclave Key Custody Transparency
- **Vector**: The team has custody of the enclave private key prior to Vault DON provisioning, enabling potential decryption by insiders.
- **Mitigation**: Disclosed explicitly in the UI and documentation. The enclave public key and SHA-256 hash are published in the onchain `Config` (`enclave_key_hash`).

### 3.3 Byzantine Oracle / DON Report Injection
- **Vector**: A compromised DON signs an arbitrary settlement report with an extreme yield or index jump.
- **Mitigation**: The onchain program validates sanity bounds:
  - Staking: change rate capped per epoch; maximum rate capped at `series.max_rate_bps`.
  - Equities: multiplier growth bounded within $D_T / D_0 \in [1, 1 + \text{dividend\_cap}]$. If breached, status transitions to `Disputed`, requiring multisig intervention.
  - Time verification: `Clock::get()?.unix_timestamp >= series.maturity_ts`.

### 3.4 Token-2022 Malicious Extensions
- **Vector**: A user attempts to create a series with a malicious or predatory Token-2022 mint (e.g. transfer fees, close authority, unexpected freeze).
- **Mitigation**: `open_series` parses mint extensions. Transfer fees, close authority, and non-transferable extensions are strictly rejected. Pausable and permanent delegate require explicit governance override flags.
