import { 
  hpkeSeal, 
  hpkeOpen, 
  signPayload, 
  verifyPayloadSignature, 
  generateEnclaveKeypair, 
  generateWalletKeypair,
  bytesToHex, 
  hexToBytes, 
  utf8ToBytes, 
  concatBytes 
} from '../src/index.ts';

console.log("=== Testing HPKE RFC 9180 Base Mode Implementation ===");

// 1. Basic Roundtrip & Key Agreement
const enclave = generateEnclaveKeypair();
const wallet = generateWalletKeypair();

const roundId = new Uint8Array(32).fill(0x42);
const kid = utf8ToBytes("kid-2026-v1");
const info = concatBytes(utf8ToBytes("kalend/v1/rfq"), roundId, kid);
const aad = concatBytes(new Uint8Array([1, 1]), roundId, kid);

const request = {
  v: 1,
  round_id: bytesToHex(roundId),
  series: "So11111111111111111111111111111111111111112",
  side: "SellPT",
  size: "1000000",
  limit_price: "0.950000",
  quote_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  requester: bytesToHex(wallet.publicKey),
  nonce: 1,
  not_after: Math.floor(Date.now() / 1000) + 300,
};

const payloadStr = JSON.stringify(request);
const signature = signPayload(payloadStr, wallet.secretKey, "KALEND/v1/request");

const signedEnvelope = JSON.stringify({
  payload: request,
  sig: bytesToHex(signature),
  pubkey: bytesToHex(wallet.publicKey),
});

// Seal with HPKE
const { enc, ciphertext } = hpkeSeal(
  enclave.publicKey,
  info,
  aad,
  utf8ToBytes(signedEnvelope)
);

console.log("✓ Encrypted sealed envelope: ciphertext len =", ciphertext.length, "enc len =", enc.length);

// Decrypt with HPKE
const decryptedBytes = hpkeOpen(
  enclave.secretKey,
  enc,
  info,
  aad,
  ciphertext
);

const decryptedStr = new TextDecoder().decode(decryptedBytes);
const opened = JSON.parse(decryptedStr);
console.log("✓ Decrypted successfully! Round ID:", opened.payload.round_id);

// Verify signature
const sigOk = verifyPayloadSignature(
  JSON.stringify(opened.payload),
  hexToBytes(opened.sig),
  hexToBytes(opened.pubkey),
  "KALEND/v1/request"
);

if (!sigOk) {
  throw new Error("Signature verification failed!");
}
console.log("✓ Signature verified successfully!");

// 2. Tampering Tests
try {
  const tamperedCiphertext = new Uint8Array(ciphertext);
  tamperedCiphertext[5] ^= 0xff;
  hpkeOpen(enclave.secretKey, enc, info, aad, tamperedCiphertext);
  throw new Error("Tampered ciphertext should have thrown!");
} catch (e) {
  if (e.message.includes("Tampered ciphertext should have thrown")) throw e;
  console.log("✓ Tampered ciphertext correctly rejected by Poly1305 MAC");
}

try {
  const tamperedAad = new Uint8Array(aad);
  tamperedAad[0] ^= 0xff;
  hpkeOpen(enclave.secretKey, enc, info, tamperedAad, ciphertext);
  throw new Error("Tampered AAD should have thrown!");
} catch (e) {
  if (e.message.includes("Tampered AAD should have thrown")) throw e;
  console.log("✓ Tampered AAD correctly rejected by Poly1305 MAC");
}

try {
  const wrongPrivKey = generateEnclaveKeypair().secretKey;
  hpkeOpen(wrongPrivKey, enc, info, aad, ciphertext);
  throw new Error("Wrong private key should have thrown!");
} catch (e) {
  if (e.message.includes("Wrong private key should have thrown")) throw e;
  console.log("✓ Wrong private key correctly rejected (MAC failure)");
}

console.log("\n🎉 ALL HPKE AND CRYPTO TESTS PASSED! 🎉");
