# RUNBOOK: RELAY SERVICE OUTAGE & RECOVERY
Kalend Operations Runbook · Severity: High · Last Updated: 2026-10-03

## 1. Role of Relay & Blast Radius
The Kalend Relay is an untrusted coordinator. Per `docs/THREAT_MODEL.md`:
- **The relay CAN**: Delay, drop, or re-order rounds; see ciphertext size and timing.
- **The relay CANNOT**: Decrypt orders, view limit prices, forge fills, or steal collateral.

An outage of the relay service disrupts RFQ discovery and trigger submission, but poses **zero risk to user principal or escrows**. If the relay goes down:
1. No pending matching will execute.
2. Traders' escrowed collateral remains safely locked until `lock_until` expires, after which users call `withdraw_escrow` directly to reclaim their assets.

---

## 2. Detection & Alerts
- Synthetic ping on `GET /health` fails (> 3 consecutive failures).
- UI displays "Relay connection lost. Reconnecting to SSE stream...".
- Open rounds have elapsed past `window_end` without a corresponding `FillReceipt` PDA created on Solana.

---

## 3. Recovery Procedure

### Step 1: Health Inspection & Process Restart
Check the relay logs and system status:
```bash
# If running via systemd or docker:
pm2 status kalend-relay || docker ps | grep relay

# Inspect recent logs for panic, unhandled promise, or memory crash:
pm2 logs kalend-relay --lines 100
```
Restart the service:
```bash
pm2 restart kalend-relay
```

### Step 2: In-Flight Round Reconciliation
Upon restart, the relay's `solana-watcher` automatically scans the chain:
1. Identify all rounds stored with status `open` or `sealed` whose `window_end` has passed.
2. Check on Solana Devnet/Mainnet if a `FillReceipt` exists:
   ```bash
   node -e '
   const { PublicKey } = require("@solana/web3.js");
   // Derive FillReceipt PDA: ["fill", round_id]
   const [fillPda] = PublicKey.findProgramAddressSync(
     [Buffer.from("fill"), Buffer.from(roundIdHex, "hex")],
     new PublicKey("Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527")
   );
   // Fetch account
   '
   ```
3. If `FillReceipt` was already created on-chain, mark round status as `matched` and broadcast over SSE.
4. If no `FillReceipt` exists and the round has expired (`now > not_after`), transition status to `expired`. Traders are notified to withdraw escrowed tokens.

### Step 3: Client Reconnection
- The frontend Next.js application utilizes automatic exponential backoff on SSE disconnects (`/rfq/events`).
- Once restarted, connected clients automatically sync active rounds and ticket states.
