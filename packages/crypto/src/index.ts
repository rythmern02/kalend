import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'

export { bytesToHex, hexToBytes, utf8ToBytes, concatBytes }

export interface SealedEnvelope {
  enc: string // hex
  ciphertext: string // hex
  kid: string
}

export interface RequestPayload {
  v: number
  round_id: string
  series: string
  side: 'SellPT' | 'SellYT'
  size: string // decimal string
  limit_price: string // decimal string
  quote_mint: string
  requester: string // base58 or hex
  nonce: number
  not_after: number
}

export interface QuotePayload {
  v: number
  round_id: string
  dealer: string // base58 or hex
  price: string // decimal string
  max_size: string // decimal string
  nonce: number
  not_after: number
}

export interface SignedEnvelope<T> {
  payload: T
  sig: string // hex
  pubkey: string // hex
}

export interface RoundBundle {
  kid: string
  round_id: string
  series: string
  requests: SealedEnvelope[]
  quotes: SealedEnvelope[]
}

export { hpkeSeal, hpkeOpen } from './hpke.js'

/**
 * Domain-separated Ed25519 signing
 */
export function signPayload(
  payloadString: string,
  privKey: Uint8Array,
  domainTag: string
): Uint8Array {
  const digest = sha256(concatBytes(utf8ToBytes(domainTag), utf8ToBytes(payloadString)))
  return ed25519.sign(digest, privKey)
}

/**
 * Domain-separated Ed25519 verification
 */
export function verifyPayloadSignature(
  payloadString: string,
  sig: Uint8Array,
  pubKey: Uint8Array,
  domainTag: string
): boolean {
  const digest = sha256(concatBytes(utf8ToBytes(domainTag), utf8ToBytes(payloadString)))
  return ed25519.verify(sig, digest, pubKey)
}

export function generateEnclaveKeypair() {
  return x25519.keygen()
}

export function generateWalletKeypair() {
  return ed25519.keygen()
}
