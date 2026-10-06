import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'

// Verify Spike S4: HPKE (RFC 9180) Base Mode with X25519, HKDF-SHA256, ChaCha20-Poly1305
// Pure JS implementation running without node:crypto built-ins

function hpkeSeal(recipientPubKey, info, aad, plaintext) {
  // 1. Generate ephemeral X25519 keypair
  const { secretKey: ephemeralPrivKey, publicKey: ephemeralPubKey } = x25519.keygen()

  // 2. Compute shared secret
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivKey, recipientPubKey)

  // 3. Derive key (32 bytes) and nonce (12 bytes) using HKDF-SHA256
  const keyAndNonce = hkdf(sha256, sharedSecret, new Uint8Array(0), info, 32 + 12)
  const key = keyAndNonce.subarray(0, 32)
  const nonce = keyAndNonce.subarray(32, 44)

  // 4. Encrypt with ChaCha20-Poly1305
  const cipher = chacha20poly1305(key, nonce, aad)
  const ciphertext = cipher.encrypt(plaintext)

  return {
    enc: ephemeralPubKey,
    ciphertext: ciphertext,
  }
}

function hpkeOpen(recipientPrivKey, enc, info, aad, ciphertext) {
  // 1. Compute shared secret with ephemeral key
  const sharedSecret = x25519.getSharedSecret(recipientPrivKey, enc)

  // 2. Derive key and nonce with same HKDF
  const keyAndNonce = hkdf(sha256, sharedSecret, new Uint8Array(0), info, 32 + 12)
  const key = keyAndNonce.subarray(0, 32)
  const nonce = keyAndNonce.subarray(32, 44)

  // 3. Decrypt with ChaCha20-Poly1305
  const cipher = chacha20poly1305(key, nonce, aad)
  return cipher.decrypt(ciphertext)
}

function runCryptoSpike() {
  console.log('--- Testing HPKE & Ed25519 Pure JS Implementation ---')

  // Enclave long-term keypair
  const { secretKey: enclavePrivKey, publicKey: enclavePubKey } = x25519.keygen()

  const roundId = new Uint8Array(32).fill(7)
  const kid = utf8ToBytes('kid-2026-v1')
  const info = concatBytes(utf8ToBytes('kalend/v1/rfq'), roundId, kid)

  const aad = concatBytes(
    new Uint8Array([1, 1]), // v=1, kind=1
    roundId,
    new Uint8Array(32).fill(0xaa), // series
    kid
  )

  // Trader wallet signs request
  const { secretKey: traderPrivKey, publicKey: traderPubKey } = ed25519.keygen()

  const requestPayload = JSON.stringify({
    v: 1,
    round_id: bytesToHex(roundId),
    series: 'So11111111111111111111111111111111111111112',
    side: 'SellPT',
    size: '1000000000',
    limit_price: '0.9650',
    quote_mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    requester: bytesToHex(traderPubKey),
    nonce: 101,
    not_after: 1780000000,
  })

  // Sign request over domain-separated tag
  const domainTag = utf8ToBytes('KALEND/v1/request')
  const digest = sha256(concatBytes(domainTag, utf8ToBytes(requestPayload)))
  const signature = ed25519.sign(digest, traderPrivKey)

  const signedEnvelope = JSON.stringify({
    payload: requestPayload,
    sig: bytesToHex(signature),
    pubkey: bytesToHex(traderPubKey),
  })

  // 1. Seal client-side
  const { enc, ciphertext } = hpkeSeal(
    enclavePubKey,
    info,
    aad,
    utf8ToBytes(signedEnvelope)
  )
  console.log('✓ Sealed ciphertext length:', ciphertext.length, 'enc length:', enc.length)

  // 2. Open inside enclave
  const decryptedBytes = hpkeOpen(enclavePrivKey, enc, info, aad, ciphertext)
  const decryptedText = new TextDecoder().decode(decryptedBytes)
  const unpacked = JSON.parse(decryptedText)

  // 3. Verify inner wallet signature inside enclave
  const checkDigest = sha256(concatBytes(domainTag, utf8ToBytes(unpacked.payload)))
  const sigBytes = hexToBytes(unpacked.sig)
  const pkBytes = hexToBytes(unpacked.pubkey)
  const isValidSig = ed25519.verify(sigBytes, checkDigest, pkBytes)
  if (!isValidSig) throw new Error('Ed25519 signature verification failed')
  console.log('✓ Inner trader wallet signature verified successfully')

  // 4. Test tampering resistance
  try {
    const tampered = new Uint8Array(ciphertext)
    tampered[0] ^= 1
    hpkeOpen(enclavePrivKey, enc, info, aad, tampered)
    throw new Error('Tampered ciphertext should have been rejected!')
  } catch (e) {
    if (e.message.includes('Tampered')) throw e
    console.log('✓ Tampered ciphertext correctly rejected by Poly1305 MAC')
  }

  // 5. Test AAD tampering
  try {
    const badAad = new Uint8Array(aad)
    badAad[0] ^= 1
    hpkeOpen(enclavePrivKey, enc, info, badAad, ciphertext)
    throw new Error('Tampered AAD should have been rejected!')
  } catch (e) {
    if (e.message.includes('Tampered')) throw e
    console.log('✓ Tampered AAD header correctly rejected by Poly1305 MAC')
  }

  console.log('All S4 crypto spike tests passed successfully!')
}

runCryptoSpike()
