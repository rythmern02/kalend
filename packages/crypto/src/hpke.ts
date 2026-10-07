/**
 * HPKE, RFC 9180, base mode (mode_base = 0x00), single-shot seal/open (sequence number 0).
 * Suite: DHKEM(X25519, HKDF-SHA256) 0x0020 · HKDF-SHA256 0x0001 · ChaCha20-Poly1305 0x0003.
 *
 * Pure JS on audited @noble primitives (no Node built-ins), so the same file runs in the
 * browser, in Node and in the CRE TypeScript/WASM runtime.
 *
 * Canonical copy: packages/crypto/src/hpke.ts. app/src/lib/hpke.ts and
 * cre/workflows/kalend-rfq/hpke.ts are byte-identical copies (checked by
 * packages/crypto/test/test_hpke_rfc9180.ts).
 */
import { x25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { extract, expand } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils.js'

const KEM_ID = 0x0020
const KDF_ID = 0x0001
const AEAD_ID = 0x0003
const N_SECRET = 32
const N_K = 32
const N_N = 12

function i2osp(n: number, len: number): Uint8Array {
  const out = new Uint8Array(len)
  for (let i = len - 1; i >= 0; i--) {
    out[i] = n & 0xff
    n >>>= 8
  }
  return out
}

const HPKE_V1 = utf8ToBytes('HPKE-v1')
const SUITE_KEM = concatBytes(utf8ToBytes('KEM'), i2osp(KEM_ID, 2))
const SUITE_HPKE = concatBytes(utf8ToBytes('HPKE'), i2osp(KEM_ID, 2), i2osp(KDF_ID, 2), i2osp(AEAD_ID, 2))
const EMPTY = new Uint8Array(0)

function labeledExtract(suite: Uint8Array, salt: Uint8Array, label: string, ikm: Uint8Array): Uint8Array {
  return extract(sha256, concatBytes(HPKE_V1, suite, utf8ToBytes(label), ikm), salt)
}

function labeledExpand(suite: Uint8Array, prk: Uint8Array, label: string, info: Uint8Array, len: number): Uint8Array {
  return expand(sha256, prk, concatBytes(i2osp(len, 2), HPKE_V1, suite, utf8ToBytes(label), info), len)
}

function extractAndExpand(dh: Uint8Array, kemContext: Uint8Array): Uint8Array {
  const eaePrk = labeledExtract(SUITE_KEM, EMPTY, 'eae_prk', dh)
  return labeledExpand(SUITE_KEM, eaePrk, 'shared_secret', kemContext, N_SECRET)
}

function keySchedule(sharedSecret: Uint8Array, info: Uint8Array): { key: Uint8Array; baseNonce: Uint8Array } {
  const pskIdHash = labeledExtract(SUITE_HPKE, EMPTY, 'psk_id_hash', EMPTY)
  const infoHash = labeledExtract(SUITE_HPKE, EMPTY, 'info_hash', info)
  const context = concatBytes(new Uint8Array([0x00]), pskIdHash, infoHash)
  const secret = labeledExtract(SUITE_HPKE, sharedSecret, 'secret', EMPTY)
  return {
    key: labeledExpand(SUITE_HPKE, secret, 'key', context, N_K),
    baseNonce: labeledExpand(SUITE_HPKE, secret, 'base_nonce', context, N_N),
  }
}

/** SetupBaseS + Seal (seq 0). `ephemeralSecret` is only for deterministic test vectors. */
export function hpkeSeal(
  recipientPublicKey: Uint8Array,
  info: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array,
  ephemeralSecret?: Uint8Array
): { enc: Uint8Array; ciphertext: Uint8Array } {
  const skE = ephemeralSecret ?? x25519.utils.randomSecretKey()
  const enc = x25519.getPublicKey(skE)
  const dh = x25519.getSharedSecret(skE, recipientPublicKey)
  const sharedSecret = extractAndExpand(dh, concatBytes(enc, recipientPublicKey))
  const { key, baseNonce } = keySchedule(sharedSecret, info)
  return { enc, ciphertext: chacha20poly1305(key, baseNonce, aad).encrypt(plaintext) }
}

/** SetupBaseR + Open (seq 0). Throws on any authentication failure. */
export function hpkeOpen(
  recipientSecretKey: Uint8Array,
  enc: Uint8Array,
  info: Uint8Array,
  aad: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const pkR = x25519.getPublicKey(recipientSecretKey)
  const dh = x25519.getSharedSecret(recipientSecretKey, enc)
  const sharedSecret = extractAndExpand(dh, concatBytes(enc, pkR))
  const { key, baseNonce } = keySchedule(sharedSecret, info)
  return chacha20poly1305(key, baseNonce, aad).decrypt(ciphertext)
}
