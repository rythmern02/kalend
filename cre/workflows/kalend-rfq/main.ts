import {
  HTTPCapability,
  Runner,
  SolanaClient,
  handlerInTee,
  solanaAccountMeta,
  type HTTPPayload,
  type SolanaAccountMeta,
  type TeeRuntime,
} from '@chainlink/cre-sdk'
import { PublicKey } from '@solana/web3.js'
import { address } from '@solana/addresses'
import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'
import { Kalend } from '../../../contracts/solana/ts/generated/Kalend.js'

export interface RfqConfig {
  mode: string
  authorizedKeys: string[]
  solanaRpcUrl: string
  programId: string
  configPda: string
  rentVaultPda: string
  forwarderState: string
  forwarderProgram: string
  chainSelector: string
  secretId: string
}

export interface SealedEnvelope {
  enc: string // hex
  ciphertext: string // hex
  kid: string
}

export interface RoundBundle {
  kid: string
  round_id: string
  series: string
  requests: SealedEnvelope[]
  quotes: SealedEnvelope[]
}

interface RequestOrder {
  v: number
  round_id: string
  series: string
  side: 'SellPT' | 'SellYT'
  size: string
  limit_price: string
  quote_mint: string
  requester: string
  nonce: number
  not_after: number
}

interface QuoteOrder {
  v: number
  round_id: string
  dealer: string
  price: string
  max_size: string
  nonce: number
  not_after: number
}

interface SignedEnvelope<T> {
  payload: T
  sig: string
  pubkey: string
}

/**
 * Pure JS HPKE Open (RFC 9180 Base Mode) inside TEE
 */
function hpkeOpen(
  privKey: Uint8Array,
  enc: Uint8Array,
  info: Uint8Array,
  aad: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  const sharedSecret = x25519.getSharedSecret(privKey, enc)
  const keyAndNonce = hkdf(sha256, sharedSecret, new Uint8Array(0), info, 44)
  const key = keyAndNonce.subarray(0, 32)
  const nonce = keyAndNonce.subarray(32, 44)
  const cipher = chacha20poly1305(key, nonce, aad)
  return cipher.decrypt(ciphertext)
}

/**
 * Derives the forwarder authority PDA: ["forwarder", forwarderState, receiverProgram]
 */
function deriveForwarderAuthority(
  forwarderProgram: string,
  forwarderState: string,
  receiverProgram: string
): string {
  const [authority] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('forwarder'),
      new PublicKey(forwarderState).toBuffer(),
      new PublicKey(receiverProgram).toBuffer(),
    ],
    new PublicKey(forwarderProgram)
  )
  return authority.toBase58()
}

/**
 * Derives FillReceipt PDA: ["fill", round_id]
 */
function deriveFillReceiptPda(roundIdBytes: Uint8Array, programId: string): string {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('fill'), roundIdBytes],
    new PublicKey(programId)
  )
  return pda.toBase58()
}

export const onHttpTriggerInTee = (
  runtime: TeeRuntime<RfqConfig>,
  event: HTTPPayload
): string => {
  const config = runtime.config
  const now = Math.floor(runtime.now().getTime() / 1000)

  // 1. Fetch enclave decryption key from Vault DON secret
  const secretHex = runtime.getSecret({ id: config.secretId }).result().value
  const enclavePrivKey = hexToBytes(secretHex.trim())

  // 2. Parse Trigger Payload containing RoundBundle
  const bodyText = event.input ? new TextDecoder().decode(event.input) : ''
  const bundle = JSON.parse(bodyText) as RoundBundle

  const roundIdBytes = hexToBytes(bundle.round_id)
  const kidBytes = utf8ToBytes(bundle.kid)
  const info = concatBytes(utf8ToBytes('kalend/v1/rfq'), roundIdBytes, kidBytes)
  const aad = concatBytes(new Uint8Array([1, 1]), roundIdBytes, kidBytes)

  // 3. Decrypt and verify Requester orders
  const validRequests: RequestOrder[] = []
  for (const encReq of bundle.requests) {
    try {
      const plaintext = hpkeOpen(
        enclavePrivKey,
        hexToBytes(encReq.enc),
        info,
        aad,
        hexToBytes(encReq.ciphertext)
      )
      const signed = JSON.parse(new TextDecoder().decode(plaintext)) as SignedEnvelope<RequestOrder>
      const payloadStr = JSON.stringify(signed.payload)
      const domainTag = utf8ToBytes('KALEND/v1/request')
      const digest = sha256(concatBytes(domainTag, utf8ToBytes(payloadStr)))
      const isSigValid = ed25519.verify(hexToBytes(signed.sig), digest, hexToBytes(signed.pubkey))

      if (
        isSigValid &&
        signed.payload.round_id === bundle.round_id &&
        signed.payload.series === bundle.series &&
        signed.payload.not_after > now
      ) {
        validRequests.push(signed.payload)
      }
    } catch {
      // Fail closed on invalid ciphertext or signature; do not log plaintext
    }
  }

  // 4. Decrypt and verify Dealer orders
  const validQuotes: QuoteOrder[] = []
  for (const encQuote of bundle.quotes) {
    try {
      const plaintext = hpkeOpen(
        enclavePrivKey,
        hexToBytes(encQuote.enc),
        info,
        aad,
        hexToBytes(encQuote.ciphertext)
      )
      const signed = JSON.parse(new TextDecoder().decode(plaintext)) as SignedEnvelope<QuoteOrder>
      const payloadStr = JSON.stringify(signed.payload)
      const domainTag = utf8ToBytes('KALEND/v1/quote')
      const digest = sha256(concatBytes(domainTag, utf8ToBytes(payloadStr)))
      const isSigValid = ed25519.verify(hexToBytes(signed.sig), digest, hexToBytes(signed.pubkey))

      if (
        isSigValid &&
        signed.payload.round_id === bundle.round_id &&
        signed.payload.not_after > now
      ) {
        validQuotes.push(signed.payload)
      }
    } catch {
      // Fail closed on invalid ciphertext or signature
    }
  }

  if (validRequests.length === 0 || validQuotes.length === 0) {
    return JSON.stringify({ status: 'no_match', reason: 'insufficient_valid_orders' })
  }

  // 5. Sealed Matching Engine
  // Match single request with best dealer quote (highest price for PT/YT seller)
  const req = validRequests[0]
  const reqLimitPrice = BigInt(Math.floor(parseFloat(req.limit_price) * 1_000_000))

  // Filter quotes meeting limit price
  const eligibleQuotes = validQuotes.filter((q) => {
    const qPrice = BigInt(Math.floor(parseFloat(q.price) * 1_000_000))
    return qPrice >= reqLimitPrice
  })

  if (eligibleQuotes.length === 0) {
    return JSON.stringify({ status: 'no_match', reason: 'no_quotes_meet_limit_price' })
  }

  // Sort descending by price; tie-break deterministically by hash(round_id || dealer)
  eligibleQuotes.sort((a, b) => {
    const priceA = BigInt(Math.floor(parseFloat(a.price) * 1_000_000))
    const priceB = BigInt(Math.floor(parseFloat(b.price) * 1_000_000))
    if (priceB !== priceA) {
      return priceB > priceA ? 1 : -1
    }
    const hashA = bytesToHex(sha256(concatBytes(roundIdBytes, hexToBytes(a.dealer))))
    const hashB = bytesToHex(sha256(concatBytes(roundIdBytes, hexToBytes(b.dealer))))
    return hashA.localeCompare(hashB)
  })

  const bestQuote = eligibleQuotes[0]
  const matchedPrice = BigInt(Math.floor(parseFloat(bestQuote.price) * 1_000_000))
  const reqSize = BigInt(req.size)
  const dealerMaxSize = BigInt(bestQuote.max_size)
  const assetAmount = reqSize < dealerMaxSize ? reqSize : dealerMaxSize
  const quoteAmount = (assetAmount * matchedPrice) / 1_000_000n

  const notAfter = Math.min(req.not_after, bestQuote.not_after)
  const sideByte = req.side === 'SellPT' ? 0 : 1

  // 6. Build FillReport Struct
  const fillReport = {
    kind: 1,
    version: 1,
    roundId: Array.from(roundIdBytes),
    series: address(req.series),
    side: sideByte,
    requester: address(req.requester),
    dealer: address(bestQuote.dealer),
    assetAmount: assetAmount,
    quoteAmount: quoteAmount,
    quoteMint: address(req.quote_mint),
    notAfter: BigInt(notAfter),
  }

  // 7. Derive Accounts for Keystone Forwarder -> on_report
  const forwarderAuthority = deriveForwarderAuthority(
    config.forwarderProgram,
    config.forwarderState,
    config.programId
  )
  const fillReceiptPda = deriveFillReceiptPda(roundIdBytes, config.programId)

  // Remaining accounts layout:
  // [0]: forwarderState
  // [1]: forwarderAuthority
  // [2]: configPda
  // [3]: seriesPda
  // [4]: fillReceiptPda
  // [5]: rentVaultPda
  // [6]: systemProgram
  const remainingAccounts: SolanaAccountMeta[] = [
    solanaAccountMeta(config.forwarderState, false),
    solanaAccountMeta(forwarderAuthority, false),
    solanaAccountMeta(config.configPda, false),
    solanaAccountMeta(req.series, false),
    solanaAccountMeta(fillReceiptPda, true),
    solanaAccountMeta(config.rentVaultPda, true),
    solanaAccountMeta('11111111111111111111111111111111', false),
  ]

  // 8. Cross back to DON for Solana on-chain write
  const don = runtime.usingTheDons()

  if (config.mode === 'local-simulation') {
    return JSON.stringify({
      status: 'matched_simulation',
      round_id: bundle.round_id,
      series: req.series,
      asset_amount: assetAmount.toString(),
      quote_amount: quoteAmount.toString(),
      fill_receipt: fillReceiptPda,
    })
  }

  const solanaClient = new SolanaClient(BigInt(config.chainSelector))
  const kalend = new Kalend(solanaClient, config.programId)

  const writeResult = kalend.writeReportFromFillReport(
    don,
    fillReport,
    remainingAccounts,
    { computeLimit: 350_000 }
  )

  return JSON.stringify({
    status: 'filled',
    round_id: bundle.round_id,
    series: req.series,
    fill_receipt: fillReceiptPda,
    txResult: writeResult ? JSON.stringify(writeResult) : undefined,
  })
}

export const initWorkflow = (config: RfqConfig) => [
  handlerInTee(
    new HTTPCapability().trigger({
      authorizedKeys: config.authorizedKeys.map((k) => ({
        type: 'KEY_TYPE_ECDSA_EVM' as const,
        publicKey: k,
      })),
    }),
    onHttpTriggerInTee,
    [{ tee: 'nitro', regions: ['us-west-2'] }]
  ),
]

export async function main() {
  const runner = await Runner.newRunner<RfqConfig>()
  await runner.run(initWorkflow)
}

if (process.argv[1] && process.argv[1].endsWith('main.ts')) {
  main()
}
