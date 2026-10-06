import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
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

/**
 * HPKE (RFC 9180) Base Mode (Mode 0)
 * DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + ChaCha20-Poly1305
 */
export function hpkeSeal(
  recipientPubKey: Uint8Array,
  info: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array,
  ephemeralPrivKey?: Uint8Array
): { enc: Uint8Array; ciphertext: Uint8Array } {
  // If ephemeralPrivKey is provided (e.g. for RFC test vectors), use it, else generate
  let ephPriv = ephemeralPrivKey
  let ephPub: Uint8Array

  if (ephPriv) {
    ephPub = x25519.getPublicKey(ephPriv)
  } else {
    const kp = x25519.keygen()
    ephPriv = kp.secretKey
    ephPub = kp.publicKey
  }

  // 1. Shared secret via X25519 Diffie-Hellman
  const sharedSecret = x25519.getSharedSecret(ephPriv, recipientPubKey)

  // 2. Key derivation via HKDF-SHA256 (32 bytes key + 12 bytes nonce)
  const keyAndNonce = hkdf(sha256, sharedSecret, new Uint8Array(0), info, 32 + 12)
  const key = keyAndNonce.subarray(0, 32)
  const nonce = keyAndNonce.subarray(32, 44)

  // 3. AEAD ChaCha20-Poly1305 encryption
  const cipher = chacha20poly1305(key, nonce, aad)
  const ciphertext = cipher.encrypt(plaintext)

  return { enc: ephPub, ciphertext }
}

export function hpkeOpen(
  recipientPrivKey: Uint8Array,
  enc: Uint8Array,
  info: Uint8Array,
  aad: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  // 1. Shared secret
  const sharedSecret = x25519.getSharedSecret(recipientPrivKey, enc)

  // 2. Key derivation
  const keyAndNonce = hkdf(sha256, sharedSecret, new Uint8Array(0), info, 32 + 12)
  const key = keyAndNonce.subarray(0, 32)
  const nonce = keyAndNonce.subarray(32, 44)

  // 3. AEAD decryption
  const cipher = chacha20poly1305(key, nonce, aad)
  return cipher.decrypt(ciphertext)
}

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

export * from './zk-elgamal.js'
