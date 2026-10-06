# RUNBOOK: STUCK OR DISPUTED SETTLEMENT
Kalend Operations Runbook · Severity: High · Last Updated: 2026-10-03

## 1. Overview & Triggers
A series enters the `Disputed` state (`status = 2`) or becomes stuck when:
1. **Dividend Band Violation**: For an equity series (`ScaledUiDividendAdjusted`), the reported dividend growth exceeds the configured `dividend_cap_bps` (see `programs/kalend/src/instructions/on_report.rs`).
2. **Oracle Multiplier Mismatch**: The reported index `index_wad` does not match the on-chain mint's `ScaledUiAmountConfig` multiplier within acceptable bounds.
3. **Split Factor Abuse**: The split ratio `split_num / split_den` deviates from approved corporate action ratios.
4. **Relay or Oracle Liveness Outage**: The automated CRE oracle fails to trigger or Don consensus fails to reach quorum after `maturity_ts`.

In the `Disputed` state:
- New `strip`, `merge`, and `lock_escrow` operations for the affected series fail closed.
- Automatic redemption is suspended to prevent draining collateral until truth is established.
- User escrowed funds remain safe and can be withdrawn after `lock_until`.

---

## 2. Diagnostic Procedure

### Step 1: Query On-Chain Series State
Run the diagnostic script or inspect via Solana CLI:
```bash
solana account <SERIES_PUBKEY> --url devnet
```
Or with Node.js:
```javascript
const series = await program.account.series.fetch(seriesPubkey);
console.log({
  status: series.status, // 0 = Open, 1 = Settled, 2 = Disputed, 3 = Paused
  idxOpen: series.idxOpen.toString(),
  idxSettle: series.idxSettle.toString(),
  splitNum: series.splitNum,
  splitDen: series.splitDen,
  maturityTs: series.maturityTs.toNumber(),
  now: Math.floor(Date.now() / 1000)
});
```

### Step 2: Query Real Underlyings
- **For Staking Series (`StakePoolRate`)**:
  Query the SPL Liquid Stake Pool directly on Solana Mainnet:
  ```bash
  solana account Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb --url mainnet-beta
  ```
  Compute ground truth:
  $$\text{index\_wad} = \frac{\text{total\_lamports} \times 10^{18}}{\text{pool\_token\_supply}}$$
- **For Equities Series (`ScaledUiDividendAdjusted`)**:
  Fetch the Token-2022 mint `ScaledUiAmountConfig` on mainnet and query the issuer corporate actions API:
  ```bash
  curl -s "https://api.xstocks.fi/api/v2/public/corporate-actions/upcoming" | jq .
  ```

---

## 3. Resolution Runbook

### Case A: Oracle Failed to Submit (Series Stuck in `Open` After Maturity)
If `now >= maturity_ts` and the series is still `Open`:
1. **Permissionless Fallback Crank**:
   For `StakePoolRate` series, anyone can invoke `settle_onchain`:
   ```bash
   node scripts/test_settlement_flow.js --crank-only --series <SERIES_PUBKEY>
   ```
   This reads the SPL Stake Pool directly on-chain without any dependency on CRE.
2. **Manual CRE Trigger**:
   If CRE Cron trigger was interrupted, execute manual simulation with broadcast:
   ```bash
   cd cre/workflows/kalend-oracle
   pnpm exec cre workflow simulate --limits --broadcast
   ```

### Case B: Legitimate Corporate Action Exceeded Cap (Status: `Disputed`)
If a corporate action (e.g., special dividend) legitimately exceeded `dividend_cap_bps`:
1. Multisig authority convenes (3-of-5).
2. Multisig verifies external custodian/issuer filings.
3. Multisig executes an authority override instruction or submits a signed administrative settlement with exact WAD index:
   ```bash
   # From secure multisig runner:
   npm run cli -- resolve-dispute --series <SERIES_PUBKEY> --index-wad <VERIFIED_WAD> --split-num <NUM> --split-den <DEN>
   ```
4. Emit on-chain dispute resolution audit event.

### Case C: Erroneous / Malicious Report Rejected
If a fraudulent report triggered the dispute:
1. The on-chain program has already failed closed and protected all collateral (`INV1` & `INV3`).
2. Identify the offending forwarder or compromised workflow key.
3. Authority executes `set_forwarder_entry` to deactivate the compromised forwarder or rotate `allowed_workflow` bytes.
4. Resubmit correct attested settlement through verified forwarder.

---

## 4. Post-Mortem & Transparency
1. Publish post-mortem incident report within 24 hours to `docs/INCIDENTS/`.
2. Update `TransparencyTab.tsx` in UI with the root-cause analysis and on-chain transaction hash.
