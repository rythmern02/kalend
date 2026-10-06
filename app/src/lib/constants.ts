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

// Published Enclave Public Key & Hash (transparently published per specification)
// Derivation: priv = 32 bytes 0x77 -> pub = 1cf579aba45a10ba1d1ef06d91fca2aa9ed0a1150515653155405d0b18cb9a67
export const ENCLAVE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_ENCLAVE_PUBKEY ||
  '1cf579aba45a10ba1d1ef06d91fca2aa9ed0a1150515653155405d0b18cb9a67'
export const ENCLAVE_KEY_HASH =
  process.env.NEXT_PUBLIC_ENCLAVE_KEY_HASH ||
  'a1ec4ad5c6a287e156ae4260c1602ffed192df3fd89c7b6376a268289bb7e703'
export const CURRENT_KID = 'kid-2026-v1'

// Pyth Network Hermes Oracle Integration
export const PYTH_FEED_SOL_USD =
  '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
export const PYTH_FEED_BTC_USD =
  '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
export const PYTH_HERMES_URL = 'https://hermes.pyth.network'
export const PYTH_API_KEY = process.env.NEXT_PUBLIC_PYTH_API_KEY || '3YPnj6f4uqyTnDwBkcMiQbL1wLbnz3Cvq4KxxceDpkZh'
