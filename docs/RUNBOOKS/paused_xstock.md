# RUNBOOK: PAUSED OR SEIZED XSTOCK COLLATERAL
Kalend Operations Runbook · Severity: High · Last Updated: 2026-10-03

## 1. Context & Threat Model
Tokenized equities (xStocks) on Solana are Token-2022 mints that carry:
1. **Pausable Extension**: The issuer retains the power to pause all mint and transfer operations at the token level without warning.
2. **Permanent Delegate Extension**: The issuer retains the power to seize, transfer, or burn tokens from any account, including PDA vaults.
3. **Default Account State (Frozen)**: Some issuers require explicit KYC approval before accounts can transact.

These are centralized counterparty risks inherent to tokenized traditional securities. Kalend discloses these risks transparently in `docs/THREAT_MODEL.md` and in the user interface (`HonestyBanner.tsx` and `TransparencyTab.tsx`). Kalend cannot unilaterally bypass issuer-level freezes.

---

## 2. Detection & Symptoms
- User attempts to `strip` or `merge` and transaction fails with Solana error `0x11` (AccountFrozen) or `TokenProgramError::MintPaused`.
- Settlement fails during collateral payout transfer CPI (`redeem_pt` or `claim_yt`).
- On-chain inspection of the collateral mint shows `is_paused = true`:
  ```bash
  solana account <XSTOCK_MINT> --url mainnet-beta
  ```

---

## 3. Operational Response

### Step 1: Global or Series-Level Circuit Breaker
If the issuer has paused the collateral mint:
1. Authority invokes `pause_series` for the affected series:
   ```bash
   node scripts/admin_action.js --action pause_series --series <SERIES_PUBKEY>
   ```
2. This stops any user from locking quote tokens into new RFQs for an un-transferable asset.
3. Does **not** block `withdraw_escrow` of quote tokens (USDC/wSOL) by dealers once `lock_until` expires.

### Step 2: Surface Clear Disclosures to Users
1. The frontend automatically polls the mint's extension state via JSON-RPC.
2. If `Pausable` is triggered, the UI renders an urgent alert:
   > ⚠️ **Underlying Issuer Halt**: The Token-2022 issuer for this collateral has paused transfers on Solana. Strip, merge, and collateral claims are temporarily paused by the issuer. Your escrowed quote tokens can be safely withdrawn once your lock period ends.

### Step 3: Issuer Communications & Settlement Extension
1. Monitor issuer status page and corporate communications (`api.xstocks.fi`).
2. If the freeze is temporary (e.g., standard trading halt or corporate action reorganization):
   - Await issuer unpause.
   - Once unpaused, verify a test transfer on devnet/mainnet.
   - Authority unpauses the series (`unpause_series`).
3. If the issuer permanently delists or seizes tokens:
   - Authority multisig declares the series `Disputed`.
   - Calculate fair cash restitution or asset replacement based on the issuer's cash-out redemption terms.
   - No funds from unaffected vaults can be used (strict isolation per `INV3`).
