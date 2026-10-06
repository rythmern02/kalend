# RUNBOOK: MOCK TO LIVE KEYSTONE FORWARDER CUTOVER
Kalend Operations Runbook · Severity: High · Last Updated: 2026-10-03

## 1. Background
Chainlink CRE utilizes two forwarder architectures on Solana:
1. **Mock Forwarder** (Local simulation with `--broadcast`):
   - Program: `7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK`
   - State (Devnet): `5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7`
2. **Live Keystone Forwarder** (Deployed CRE workflows):
   - Program (Devnet): `CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5`
   - State (Devnet): `8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9`
   - Program (Mainnet): `GFrSSvQXaVGkc6Nrr8y2msie6pivJkR1s2EnDk4et294`
   - State (Mainnet): `9FgdPyU28bGMCuJyD34pzw9W7Ys36ziLbT9cbZtsaraV`

On Devnet, the Kalend `Config` account stores both entries (`forwarders[<=2]`) so local simulation tests and live deployed workflow tests can run in parallel.

**Mainnet Gate (Rule R3)**: Mainnet release builds reject and forbid the Mock Forwarder program ID at compile time.

---

## 2. Devnet Verification & Reconfiguration

### Step 1: Inspect Configured Forwarders in Config PDA
```bash
solana account CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX --url devnet
```
Or with script:
```bash
node -e '
const { Connection, PublicKey } = require("@solana/web3.js");
const conn = new Connection("https://api.devnet.solana.com");
async function check() {
  const info = await conn.getAccountInfo(new PublicKey("CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX"));
  console.log("Config account length:", info.data.length);
}
check();
'
```

### Step 2: Update Forwarder Entry via Authority
To update or rotate the allowed workflow ID or forwarder entry on Solana:
```bash
node -e '
// Use set_forwarder_entry instruction:
// Args: index: u8, program: Pubkey, state: Pubkey, allowed_workflow: [u8; 32]
'
```

---

## 3. Mainnet Launch Deployment Steps

1. Verify Anchor Program is compiled in release mode with mainnet feature flag:
   ```bash
   anchor build --verifiable
   ```
2. Verify with grep that Mock Forwarder `7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK` does NOT exist in the binary or mainnet configuration.
3. Deploy program to Solana Mainnet.
4. Execute `initialize_config` on Mainnet setting:
   - `forwarder_program`: `GFrSSvQXaVGkc6Nrr8y2msie6pivJkR1s2EnDk4et294`
   - `forwarder_state`: `9FgdPyU28bGMCuJyD34pzw9W7Ys36ziLbT9cbZtsaraV`
   - `allowed_workflow`: 32-byte sha256 of deployed CRE workflow identity.
5. Fund `RentVault` PDA (`["rent"]`) with at least 1 SOL for rent exemption of incoming `FillReceipt` PDAs.
6. Verify live forwarder CPI test on mainnet.
