# RUNBOOK: ENCLAVE X25519 KEY ROTATION
Kalend Operations Runbook · Severity: Medium · Last Updated: 2026-10-03

## 1. Overview
In Kalend's Confidential RFQ protocol, user orders and dealer quotes are encrypted client-side using HPKE (RFC 9180) to the enclave's X25519 public key. The corresponding private key is held as a Vault DON secret and only released to the attested TEE enclave (AWS Nitro `us-west-2`).

To uphold forward secrecy and operational hygiene, the enclave keypair is rotated:
- Every 90 days as standard maintenance.
- Immediately upon suspected compromise of the deployment environment or secret provisioning pipeline.

---

## 2. Key Generation & Enclave Preparation

### Step 1: Generate New X25519 Keypair
Using Kalend's verified pure-JS cryptographic tooling:
```bash
node -e '
const { x25519 } = require("@noble/curves/ed25519");
const { sha256 } = require("@noble/hashes/sha256");

const priv = x25519.utils.randomPrivateKey();
const pub = x25519.getPublicKey(priv);
const hash = sha256(pub);

console.log("NEW_ENCLAVE_PRIVATE_KEY_HEX:", Buffer.from(priv).toString("hex"));
console.log("NEW_ENCLAVE_PUBLIC_KEY_HEX:", Buffer.from(pub).toString("hex"));
console.log("NEW_KEY_HASH_HEX:", Buffer.from(hash).toString("hex"));
'
```

### Step 2: Upload Secret to Vault DON
Upload the new secret to the Chainlink CRE Vault DON:
```bash
cre secrets set ENCLAVE_PRIVATE_KEY <NEW_ENCLAVE_PRIVATE_KEY_HEX> --workflow kalend-rfq
```

---

## 3. On-Chain Config & Frontend Cutover

### Step 3: Publish Hash to Solana Config
The on-chain `Config` account records `enclave_key_hash` for public transparency.
Execute the authority update instruction:
```bash
node scripts/admin_action.js --action set_enclave_key_hash --hash <NEW_KEY_HASH_HEX>
```
Verify the hash matches on-chain:
```bash
solana account <CONFIG_PDA> --url devnet
```

### Step 4: Update Frontend & Relay Configuration
1. Update `ENCLAVE_PUBLIC_KEY` in:
   - `relay/.env`
   - `app/.env.local`
2. Update `packages/crypto/src/index.ts` constants if pinned for fallback.
3. Redeploy Relay and Frontend.
4. Active rounds in flight encrypted to the prior key continue for up to their `not_after` window (maximum 5 minutes), after which the old key is decommissioned.

---

## 4. Verification Post-Rotation
1. Run sealed order test:
   ```bash
   node scripts/test_rfq_flow.js
   ```
2. Verify decryption succeeds inside the enclave.
3. Verify `HonestyBanner.tsx` and `TransparencyTab.tsx` reflect the updated key hash.
