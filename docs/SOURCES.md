# SOURCES OF TRUTH & RECORD OF OFFICIAL DOCUMENTATION
Kalend Engineering · Record initialized: 2026-10-02

Every external fact, API route, address, discriminator, and parameter must be verified against official documentation and chain state before use (Rule R1).

---

## 1. Installed Agent Skills

### Solana Developer Skill
- **Source**: `https://github.com/solana-foundation/solana-dev-skill`
- **Installed at**: `.agents/skills/solana-dev/`
- **Date Checked**: 2026-10-02
- **Key Facts Used**:
  - Anchor 1.0 / 0.32 conventions and security macros: `#![deny(clippy::all, clippy::arithmetic_side_effects)]`.
  - LiteSVM for fast deterministic in-memory integration testing.
  - Surfpool for local cluster testing.
  - Modern client stack: `@solana/kit` and Codama (replacing legacy `@coral-xyz/anchor` and legacy `@solana/web3.js` in frontend/relay applications).
  - PDA and account derivation security patterns.

### Chainlink CRE Skill
- **Source**: `https://github.com/smartcontractkit/chainlink-agent-skills/tree/main/chainlink-cre-skill`
- **Installed at**: `.agents/skills/chainlink-cre/`
- **Date Checked**: 2026-10-02
- **Key Facts Used**:
  - CRE CLI project structure: `project.yaml`, `workflow.yaml`, `secrets.yaml`.
  - Triggers: HTTP trigger, Cron trigger.
  - Capabilities: EVM, Solana write, HTTP client, Confidential HTTP, Consensus, Secrets.
  - Simulation workflow: `cre workflow simulate --limits`.

### Chainlink Data Feeds Skill
- **Source**: `https://github.com/smartcontractkit/chainlink-agent-skills/tree/main/chainlink-data-feeds-skill`
- **Installed at**: `.agents/skills/chainlink-data-feeds/`
- **Date Checked**: 2026-10-02
- **Key Facts Used**:
  - Freshness checking (`updatedAt`), round validation, decimals normalization.
  - Solana-specific reader patterns.

---

## 2. Chainlink CRE Official Documentation & Reference

### CRE Full Plaintext Documentation for Agents
- **URL**: `https://docs.chain.link/cre/ts/llms-full.txt`
- **Date Read**: 2026-10-02
- **Verified Facts**:
  - CLI latest version: v1.36.0 (released September 2026).
  - Solana write capability: `writeReportFrom<Struct>()` generated via `cre generate-bindings solana --language typescript`.
  - Keystone Forwarder onchain write flow: report passes DON consensus, is submitted to Keystone Forwarder, which verifies signatures and invokes `on_report(metadata, report)` on receiver program via CPI.
  - `remainingAccounts` passed to receiver program: index 0 is `forwarderState`, index 1 is `forwarderAuthority`, followed by receiver accounts. The entire list is hashed and signed by the DON; the forwarder strips indices 0 and 1 before the CPI.
  - Keystone Forwarder Addresses:
    - **Live Keystone Forwarder (Devnet)**: Program `CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5`, State `8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9`.
    - **Live Keystone Forwarder (Mainnet)**: Program `GFrSSvQXaVGkc6Nrr8y2msie6pivJkR1s2EnDk4et294`, State `9FgdPyU28bGMCuJyD34pzw9W7Ys36ziLbT9cbZtsaraV`.
    - **Mock Forwarder (Devnet / Simulation)**: Program `7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK`, State `5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7`.
    - **Mock Forwarder (Mainnet / Simulation)**: State `jhCjuD4Z3V7HeSUChMRpkRwpw6B9yC63mxDMv8SdLNX`.
    - **Chain Selectors**: Devnet `16423721717087811551`, Mainnet `124615329519749607`.
  - Confidential Workflows:
    - Enclave execution using `handlerInTee`.
    - AWS Nitro `us-west-2` target in current private beta.
    - Triggers, chain reads, and chain writes run on DON nodes, outside the TEE.
    - Orders MUST be encrypted client-side using HPKE before reaching the trigger.
    - Secrets retrieved via Vault DON with `runtime.getSecrets()`.
    - Consensus-backed operations cross via `runtime.usingTheDons()`.
    - Deployed HTTP triggers require `authorizedKeys` containing EVM addresses; requests submitted to CRE gateway as JSON-RPC with JWT.
  - Resource Quotas & Limits:
    - HTTP trigger: 1 request per 30 seconds, burst 1.
    - Cron minimum interval: 30 seconds.
    - Private registry workflow limit: 3 workflows per organization.
    - Maximum execution response: 100 KB; secrets limit: 2 KB per ciphertext, 27 KB total.
    - Solana transaction size limit: 1232 bytes total.

---

## 3. Solana & Token-2022 Official Documentation

### Solana Token Extensions
- **URLs**:
  - `https://solana.com/docs/tokens/extensions`
  - `https://www.solana-program.com/docs/token-2022/extensions`
  - `https://solana.com/docs/finance/privacy`
- **Date Read**: 2026-10-02
- **Verified Facts**:
  - `ScaledUiAmount`: stores current multiplier, new multiplier, and effective timestamp. Raw token balance remains constant while UI displayed amount adjusts.
  - `TransferHook`: requires additional account resolution via `spl-transfer-hook-interface`.
  - `ConfidentialTransfer`: zero-knowledge ElGamal balance encryption. Operates client-side via ElGamal keypairs; program-owned PDA escrows without ElGamal keys cannot execute confidential settlement.
  - Mutual exclusivity: Transfer hooks and confidential transfers cannot be combined on the same mint.
  - Pausable and Permanent Delegate extensions allow issuer freeze/seizure; governance must explicitly review per mint.

---

## 4. xStocks (Tokenized Equities)

### Developer Multiplier Documentation
- **URL**: `https://docs.xstocks.fi/developers/multipliers`
- **Date Read**: 2026-10-02
- **Verified Facts**:
  - Equity dividends are handled through the `ScaledUiAmount` multiplier, increasing the raw-to-UI ratio.
  - Splits and reverse splits also adjust the multiplier.
  - `ScaledUiAmountConfig` layout: includes `multiplier`, `new_multiplier`, and `new_multiplier_effective_timestamp`.
  - Yield calculation requires factoring out corporate splits: $D(t) = m(t) / S$, where $S = \prod \text{split\_factor}$.

---

## 5. Solana Liquid Staking Stake Pools (Mainnet Ground Truth)

### Jito Stake Pool (SPL Stake Pool Program)
- **Program ID**: `SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy` (Standard SPL Stake Pool)
- **Stake Pool Address**: `Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb` (Verified on Solana Mainnet 2026-10-03)
- **JitoSOL Mint Address**: `J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn`
- **Account Data Length**: 611 bytes
- **Account Layout & Offsets**:
  - `total_lamports`: Offset `258..266` (u64, little-endian)
  - `pool_token_supply`: Offset `266..274` (u64, little-endian)
  - `last_update_epoch`: Offset `274..282` (u64, little-endian)
- **Attested Index Calculation**:
  - $\text{idx\_wad} = \lfloor \text{total\_lamports} \times 10^{18} / \text{pool\_token\_supply} \rfloor$
  - Verified sample value: ~1.3043965 SOL / JitoSOL (`1304396510749700193` WAD).

