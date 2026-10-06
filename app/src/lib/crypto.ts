import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'

export function hpkeSeal(
  recipientPubKey: Uint8Array,
  info: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array
): { enc: Uint8Array; ciphertext: Uint8Array } {
  const { secretKey: ephPriv, publicKey: ephPub } = x25519.keygen()
  const sharedSecret = x25519.getSharedSecret(ephPriv, recipientPubKey)
  const keyAndNonce = hkdf(sha256, sharedSecret, new Uint8Array(0), info, 44)
  const key = keyAndNonce.subarray(0, 32)
  const nonce = keyAndNonce.subarray(32, 44)
  const cipher = chacha20poly1305(key, nonce, aad)
  const ciphertext = cipher.encrypt(plaintext)
  return { enc: ephPub, ciphertext }
}

export function signPayload(payloadStr: string, secretKey: Uint8Array, domainTag: string): Uint8Array {
  const digest = sha256(concatBytes(utf8ToBytes(domainTag), utf8ToBytes(payloadStr)))
  return ed25519.sign(digest, secretKey)
}

export function sealOrderEnvelope(
  enclavePubKeyHex: string,
  roundIdHex: string,
  kid: string,
  domainTag: 'KALEND/v1/request' | 'KALEND/v1/quote',
  orderPayload: any,
  traderSecretKey: Uint8Array,
  traderPubKeyBytes: Uint8Array
): { enc: string; ciphertext: string; kid: string } {
  const payloadStr = JSON.stringify(orderPayload)
  const signature = signPayload(payloadStr, traderSecretKey, domainTag)

  const signedEnvelope = JSON.stringify({
    payload: orderPayload,
    sig: bytesToHex(signature),
    pubkey: bytesToHex(traderPubKeyBytes),
  })

  const roundIdBytes = hexToBytes(roundIdHex)
  const kidBytes = utf8ToBytes(kid)
  const info = concatBytes(utf8ToBytes('kalend/v1/rfq'), roundIdBytes, kidBytes)
  const aad = concatBytes(new Uint8Array([1, 1]), roundIdBytes, kidBytes)

  const { enc, ciphertext } = hpkeSeal(
    hexToBytes(enclavePubKeyHex),
    info,
    aad,
    utf8ToBytes(signedEnvelope)
  )

  return {
    enc: bytesToHex(enc),
    ciphertext: bytesToHex(ciphertext),
    kid,
  }
}
