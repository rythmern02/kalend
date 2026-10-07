import { PublicKey } from '@solana/web3.js'

export const PROGRAM_ID = new PublicKey('Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527')
export const CONFIG_PDA = new PublicKey('CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX')
export const REGISTRY_PDA = new PublicKey('HcxnGSttZkeDszCY8fpGangn3UL4dCPQ9p8dXHsV6Bt3')
export const RENT_VAULT_PDA = new PublicKey('2P71W4MCiMCUyFzsgHi9UD7DWyj4ypF2uDY5xRDnwDKR')

export const KEYSTONE_FORWARDER_PROGRAM = new PublicKey('CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5')
export const KEYSTONE_FORWARDER_STATE = new PublicKey('8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9')

export const MOCK_FORWARDER_PROGRAM = new PublicKey('7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK')
export const MOCK_FORWARDER_STATE = new PublicKey('5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7')

export const MAINNET_JITO_STAKE_POOL = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'
export const DEVNET_STAKE_POOL = 'HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f'

export const RELAY_API_URL = process.env.NEXT_PUBLIC_RELAY_URL || 'http://localhost:3001'
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

// Published enclave HPKE public key (X25519) and its sha256, committed on-chain in
// Config.enclave_key_hash via set_enclave_key_hash. Source: cre/enclave-public.json.
// The matching secret lives only in the CRE secrets store (Vault DON when deployed; the
// simulator's gitignored cre/.env on devnet). The team holds it, so the team can read orders.
export const ENCLAVE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_ENCLAVE_PUBKEY || '13780a391aacd9150125980ec19860e5ee6ba19736c0f39d1ed3ba0fb470df7d'
export const ENCLAVE_KEY_HASH =
  process.env.NEXT_PUBLIC_ENCLAVE_KEY_HASH || '67a4cdc66105d57fa748e4e05a1782e07b7496a4b2d4140438f32fe389a5694f'
export const CURRENT_KID = 'kid-2026-10-07'

// Pyth display feeds live in ./pyth.ts (on-chain receiver accounts; optional Hermes key via env).
