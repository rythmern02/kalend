# RUNBOOK: COMPROMISED RELAY EVM KEY
Kalend Operations Runbook · Severity: Critical · Last Updated: 2026-10-03

## 1. Context & Impact
The Relay holds an EVM keypair (`RELAY_EVM_PRIVATE_KEY`) registered in the Chainlink CRE Confidential Workflow under `authorizedKeys`:
```yaml
# cre/workflows/kalend-rfq/workflow.yaml
triggers:
  - type: http
    authorizedKeys:
      - "0xRelayAuthorizedEvmAddress..."
```
This key authorizes the relay to submit trigger payloads (round bundles) to the Chainlink CRE Gateway via JSON-RPC.

### What an attacker with this key CAN do:
- Spam the CRE Gateway, consuming CRE compute quotas (1 trigger per 30s per workflow).
- Submit arbitrary round bundles to the workflow enclave.
  - **However**: The enclave verifies the requester's and dealer's Ed25519 signatures inside the decrypted payload! The attacker cannot forge user signatures, cannot invent valid orders, and cannot steal funds.

### What an attacker CANNOT do:
- Move user collateral or escrow balances.
- Decrypt user orders (the EVM key is NOT the enclave decryption key).
- Forge Solana state transitions.

---

## 2. Emergency Rotation Procedure

### Step 1: Generate New Relay EVM Keypair
```bash
node -e '
const { ethers } = require("ethers");
const wallet = ethers.Wallet.createRandom();
console.log("NEW_RELAY_ADDRESS:", wallet.address);
console.log("NEW_RELAY_PRIVATE_KEY:", wallet.privateKey);
'
```

### Step 2: Update Workflow Configuration
Edit `cre/workflows/kalend-rfq/workflow.yaml`:
```yaml
triggers:
  - type: http
    authorizedKeys:
      - "0x<NEW_RELAY_ADDRESS>"
```
And update `config.staging.json` / `config.production.json` with the new address.

### Step 3: Redeploy the Workflow to Chainlink CRE
Deploy the updated workflow definition:
```bash
cre workflow deploy kalend-rfq
```
The Chainlink CRE Gateway immediately revokes trigger authorization for the old compromised EVM address and admits only requests signed by the new key.

### Step 4: Update Relay Service Environment
1. Update `RELAY_EVM_PRIVATE_KEY` in `relay/.env`.
2. Restart relay service:
   ```bash
   pm2 restart kalend-relay
   ```
3. Test authorized submission with a test round to verify gateway acceptance.
