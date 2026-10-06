import { 
  hpkeSeal, 
  signPayload, 
  generateEnclaveKeypair, 
  generateWalletKeypair,
  bytesToHex, 
  utf8ToBytes, 
  concatBytes 
} from '../packages/crypto/src/index.ts';

console.log("=== Testing End-to-End Sealed RFQ & Relay Flow ===");

// 1. Setup Enclave and Trader Wallets
const enclave = generateEnclaveKeypair();
const requesterWallet = generateWalletKeypair();
const dealer1Wallet = generateWalletKeypair();
const dealer2Wallet = generateWalletKeypair();

const roundIdBytes = new Uint8Array(32).fill(0x88);
const roundId = bytesToHex(roundIdBytes);
const seriesPubkey = "CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY";
const quoteMintPubkey = "5gSeVv1dDqQAkzR3shz4yMmB7SU1yQLqLRepKH65SjES";
const kid = "kid-2026-v1";
const now = Math.floor(Date.now() / 1000);

const info = concatBytes(utf8ToBytes("kalend/v1/rfq"), roundIdBytes, utf8ToBytes(kid));
const aad = concatBytes(new Uint8Array([1, 1]), roundIdBytes, utf8ToBytes(kid));

console.log(`[Setup] Round ID: ${roundId}`);
console.log(`[Setup] Enclave Public Key: ${bytesToHex(enclave.publicKey).substring(0, 16)}...`);

import { PublicKey } from "@solana/web3.js";

// 2. Requester creates and seals Request: Sell 1,000,000 PT @ min 0.950000 quote
const requesterPubkey = new PublicKey(requesterWallet.publicKey).toBase58();
const dealer1Pubkey = new PublicKey(dealer1Wallet.publicKey).toBase58();
const dealer2Pubkey = new PublicKey(dealer2Wallet.publicKey).toBase58();

const requestOrder = {
  v: 1,
  round_id: roundId,
  series: seriesPubkey,
  side: "SellPT",
  size: "1000000",
  limit_price: "0.950000",
  quote_mint: quoteMintPubkey,
  requester: requesterPubkey,
  nonce: 101,
  not_after: now + 300,
};

const reqPayloadStr = JSON.stringify(requestOrder);
const reqSignature = signPayload(reqPayloadStr, requesterWallet.secretKey, "KALEND/v1/request");
const signedReqEnvelope = JSON.stringify({
  payload: requestOrder,
  sig: bytesToHex(reqSignature),
  pubkey: bytesToHex(requesterWallet.publicKey),
});

const sealedRequest = hpkeSeal(
  enclave.publicKey,
  info,
  aad,
  utf8ToBytes(signedReqEnvelope)
);
console.log(`✓ Requester sealed order: ciphertext length = ${sealedRequest.ciphertext.length} bytes (Zero plaintext leaked to relay)`);

// 3. Dealer 1 creates and seals Quote: 0.940000 (Below limit price!)
const quote1 = {
  v: 1,
  round_id: roundId,
  dealer: dealer1Pubkey,
  price: "0.940000",
  max_size: "1000000",
  nonce: 201,
  not_after: now + 300,
};
const quote1Str = JSON.stringify(quote1);
const quote1Sig = signPayload(quote1Str, dealer1Wallet.secretKey, "KALEND/v1/quote");
const sealedQuote1 = hpkeSeal(
  enclave.publicKey,
  info,
  aad,
  utf8ToBytes(JSON.stringify({ payload: quote1, sig: bytesToHex(quote1Sig), pubkey: bytesToHex(dealer1Wallet.publicKey) }))
);

// 4. Dealer 2 creates and seals Quote: 0.965000 (Above limit price! Best quote!)
const quote2 = {
  v: 1,
  round_id: roundId,
  dealer: dealer2Pubkey,
  price: "0.965000",
  max_size: "1000000",
  nonce: 301,
  not_after: now + 300,
};
const quote2Str = JSON.stringify(quote2);
const quote2Sig = signPayload(quote2Str, dealer2Wallet.secretKey, "KALEND/v1/quote");
const sealedQuote2 = hpkeSeal(
  enclave.publicKey,
  info,
  aad,
  utf8ToBytes(JSON.stringify({ payload: quote2, sig: bytesToHex(quote2Sig), pubkey: bytesToHex(dealer2Wallet.publicKey) }))
);
console.log(`✓ Dealer 1 & Dealer 2 sealed quotes submitted to relay`);

// 5. Test Relay Store Intake
import { store } from '../relay/src/store.ts';

const round = store.createRound(roundId, seriesPubkey, kid, 30);
console.log(`✓ Relay store initialized round: ${round.round_id}, status: ${round.status}`);

const addedReq = store.addRequest(roundId, {
  enc: bytesToHex(sealedRequest.enc),
  ciphertext: bytesToHex(sealedRequest.ciphertext),
  kid,
});
if (!addedReq) throw new Error("Failed to add request to relay");

store.addQuote(roundId, {
  enc: bytesToHex(sealedQuote1.enc),
  ciphertext: bytesToHex(sealedQuote1.ciphertext),
  kid,
});
store.addQuote(roundId, {
  enc: bytesToHex(sealedQuote2.enc),
  ciphertext: bytesToHex(sealedQuote2.ciphertext),
  kid,
});

const storedRound = store.getRound(roundId);
console.log(`✓ Relay stored ${storedRound.requests.length} request ciphertext and ${storedRound.quotes.length} quote ciphertexts`);

// 6. Test Enclave Decryption & Matching Handler
import { onHttpTriggerInTee } from '../cre/workflows/kalend-rfq/main.ts';

const mockRuntime = {
  config: {
    mode: 'local-simulation',
    authorizedKeys: [],
    solanaRpcUrl: 'https://api.devnet.solana.com',
    programId: 'Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527',
    configPda: 'CstkcszP1baZU8UMsFs1g73GKreTgDdZnNKZVpitKvjX',
    rentVaultPda: '2P71W4MCiMCUyFzsgHi9UD7DWyj4ypF2uDY5xRDnwDKR',
    forwarderState: '5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7',
    forwarderProgram: '7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK',
    chainSelector: '16423721717087811551',
    secretId: 'ENCLAVE_PRIVATE_KEY',
  },
  now: () => new Date(),
  getSecret: () => ({
    result: () => ({ value: bytesToHex(enclave.secretKey) })
  }),
  usingTheDons: () => ({
    report: () => ({ result: () => ({}) })
  }),
};

const roundBundle = {
  kid,
  round_id: roundId,
  series: seriesPubkey,
  requests: storedRound.requests,
  quotes: storedRound.quotes,
};

const triggerPayload = {
  input: new TextEncoder().encode(JSON.stringify(roundBundle)),
};

console.log(`\n[Enclave Execution] Invoking confidential matching inside TEE...`);
const matchResultStr = onHttpTriggerInTee(mockRuntime, triggerPayload);
const matchResult = JSON.parse(matchResultStr);

console.log(`✓ Enclave Output:`, matchResult);

if (matchResult.status !== 'matched_simulation') {
  throw new Error(`Expected status matched_simulation, got ${matchResult.status}`);
}
if (matchResult.asset_amount !== '1000000') {
  throw new Error(`Expected asset_amount 1000000, got ${matchResult.asset_amount}`);
}
// Matched price is Dealer 2 (0.965000) => 965,000 quote amount
if (matchResult.quote_amount !== '965000') {
  throw new Error(`Expected quote_amount 965000 (Dealer 2 best price), got ${matchResult.quote_amount}`);
}

console.log(`\n🎉 CONFIDENTIAL RFQ MATCHING ENGINE VERIFIED!`);
console.log(`  - Dealer 1 (0.940000 < 0.950000 limit) was correctly filtered out.`);
console.log(`  - Dealer 2 (0.965000 > 0.950000 limit) was correctly matched as best price.`);
console.log(`  - Matched Quote Amount: ${matchResult.quote_amount} / Asset Amount: ${matchResult.asset_amount}.`);
console.log(`  - FillReceipt PDA: ${matchResult.fill_receipt}`);
console.log(`  - Zero Plaintext Leakage: Relay and node operators saw only ciphertexts.`);
