// Order sealing: HPKE RFC 9180 base mode (./hpke.ts) + domain-separated ed25519 wallet signature.
import { ed25519 } from '@noble/curves/ed25519.js'
import { hpkeSeal } from './hpke'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'

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

export async function sealOrderEnvelopeWithSigner(
  enclavePubKeyHex: string,
  roundIdHex: string,
  kid: string,
  domainTag: 'KALEND/v1/request' | 'KALEND/v1/quote',
  orderPayload: any,
  traderPubKeyBytes: Uint8Array,
  signMessageFn: (message: Uint8Array) => Promise<Uint8Array>
): Promise<{ enc: string; ciphertext: string; kid: string }> {
  const payloadStr = JSON.stringify(orderPayload)
  const digest = sha256(concatBytes(utf8ToBytes(domainTag), utf8ToBytes(payloadStr)))
  const signature = await signMessageFn(digest)

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

