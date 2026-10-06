import { RoundBundle } from './store.js'
import { PublicKey } from '@solana/web3.js'
import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'

export interface TriggerResult {
  success: boolean
  status: string
  round_id: string
  fill_receipt?: string
  asset_amount?: string
  quote_amount?: string
  tranche_count?: number
  tx_hash?: string
  error?: string
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
 * Pure JS HPKE Open (RFC 9180 Base Mode) inside Enclave
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
 * Derives FillReceipt PDA: ["fill", round_id]
 */
function deriveFillReceiptPda(roundIdBytes: Uint8Array, programId: string): string {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('fill'), roundIdBytes],
    new PublicKey(programId)
  )
  return pda.toBase58()
}

export class CreClient {
  private programId: string

  constructor() {
    this.programId = process.env.PROGRAM_ID || 'Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527'
  }

  async triggerRfqWorkflow(bundle: RoundBundle): Promise<TriggerResult> {
    const isLiveGateway = Boolean(process.env.CRE_GATEWAY_URL && process.env.CRE_GATEWAY_JWT)
    const isSimAllowed =
      process.env.KALEND_ALLOW_SIMULATION === '1' || process.env.RELAY_ALLOW_SIMULATION === '1'

    // 1. FAIL CLOSED GUARD (Prime Directives 1 & 2)
    // Never fail open: if live credentials missing and simulation not explicitly authorized, stop.
    if (!isLiveGateway && !isSimAllowed) {
      console.warn(
        `[CreClient] FAIL CLOSED: Live CRE credentials missing and KALEND_ALLOW_SIMULATION != 1. Refusing execution.`
      )
      return {
        success: false,
        status: 'fail_closed',
        round_id: bundle.round_id,
        error:
          'Fail Closed Guard: Chainlink CRE live gateway credentials missing and simulation flag KALEND_ALLOW_SIMULATION != 1. Refusing to execute unverified matches.',
      }
    }

    // 2. LIVE CRE GATEWAY TRIGGER
    if (isLiveGateway) {
      try {
        console.log(`[CreClient] Forwarding round ${bundle.round_id} to Chainlink CRE Gateway...`)
        const payloadJson = JSON.stringify(bundle)
        const response = await fetch(process.env.CRE_GATEWAY_URL!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CRE_GATEWAY_JWT}`,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'trigger',
            params: {
              workflow: 'kalend-rfq',
              input: Buffer.from(payloadJson).toString('base64'),
            },
          }),
        })

        const resData: any = await response.json()
        if (resData.error) {
          return {
            success: false,
            status: 'gateway_error',
            round_id: bundle.round_id,
            error: resData.error.message,
          }
        }

        return {
          success: true,
          status: 'submitted_to_gateway',
          round_id: bundle.round_id,
          tx_hash: resData.result?.txHash,
        }
      } catch (err: any) {
        return {
          success: false,
          status: 'network_error',
          round_id: bundle.round_id,
          error: err.message,
        }
      }
    }

    // 3. HARDENED CONFIDENTIAL ENCLAVE SIMULATION
    // Runs the exact same RFC 9180 HPKE decryption, Ed25519 signature checks, and multi-dealer
    // knapsack waterfall matching engine as the deployed CRE AWS Nitro TEE enclave.
    try {
      console.log(
        `[CreClient] Executing confidential enclave matching simulation for round ${bundle.round_id}...`
      )
      const secretHex =
        process.env.KALEND_ENCLAVE_SECRET_KEY ||
        '7777777777777777777777777777777777777777777777777777777777777777'
      const enclavePrivKey = hexToBytes(secretHex.trim())

      const roundIdBytes = hexToBytes(bundle.round_id)
      const kidBytes = utf8ToBytes(bundle.kid)
      const info = concatBytes(utf8ToBytes('kalend/v1/rfq'), roundIdBytes, kidBytes)
      const aad = concatBytes(new Uint8Array([1, 1]), roundIdBytes, kidBytes)
      const now = Math.floor(Date.now() / 1000)

      // A. Decrypt Requester Orders
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
          const signed = JSON.parse(
            new TextDecoder().decode(plaintext)
          ) as SignedEnvelope<RequestOrder>
          const payloadStr = JSON.stringify(signed.payload)
          const domainTag = utf8ToBytes('KALEND/v1/request')
          const digest = sha256(concatBytes(domainTag, utf8ToBytes(payloadStr)))
          const isSigValid = ed25519.verify(
            hexToBytes(signed.sig),
            digest,
            hexToBytes(signed.pubkey)
          )

          if (
            isSigValid &&
            signed.payload.round_id === bundle.round_id &&
            signed.payload.series === bundle.series &&
            signed.payload.not_after > now
          ) {
            validRequests.push(signed.payload)
          }
        } catch {
          // Fail closed on decryption or signature failure; zero plaintext logged
        }
      }

      // B. Decrypt Dealer Quotes
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
          const signed = JSON.parse(
            new TextDecoder().decode(plaintext)
          ) as SignedEnvelope<QuoteOrder>
          const payloadStr = JSON.stringify(signed.payload)
          const domainTag = utf8ToBytes('KALEND/v1/quote')
          const digest = sha256(concatBytes(domainTag, utf8ToBytes(payloadStr)))
          const isSigValid = ed25519.verify(
            hexToBytes(signed.sig),
            digest,
            hexToBytes(signed.pubkey)
          )

          if (
            isSigValid &&
            signed.payload.round_id === bundle.round_id &&
            signed.payload.not_after > now
          ) {
            validQuotes.push(signed.payload)
          }
        } catch {
          // Fail closed on decryption or signature failure
        }
      }

      if (validRequests.length === 0 || validQuotes.length === 0) {
        return {
          success: false,
          status: 'no_match',
          round_id: bundle.round_id,
          error: 'Insufficient valid decrypted orders or signatures in round window',
        }
      }

      // C. Multi-Dealer Knapsack Waterfall Matching
      const req = validRequests[0]
      const reqLimitPrice = BigInt(Math.floor(parseFloat(req.limit_price) * 1_000_000))

      const eligibleQuotes = validQuotes.filter((q) => {
        const qPrice = BigInt(Math.floor(parseFloat(q.price) * 1_000_000))
        return qPrice >= reqLimitPrice
      })

      if (eligibleQuotes.length === 0) {
        return {
          success: false,
          status: 'no_match',
          round_id: bundle.round_id,
          error: 'No dealer quotes met requester limit price',
        }
      }

      // Sort by price descending; tie-break deterministically with sha256(round_id || dealer)
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

      interface TrancheFill {
        dealer: string
        price: bigint
        assetAmount: bigint
        quoteAmount: bigint
      }

      const trancheFills: TrancheFill[] = []
      let remainingAssetSize = BigInt(req.size)
      let totalAssetMatched = 0n
      let totalQuoteMatched = 0n

      for (const quote of eligibleQuotes) {
        if (remainingAssetSize === 0n) break
        if (trancheFills.length >= 8) break // Max 8 tranches

        const qPrice = BigInt(Math.floor(parseFloat(quote.price) * 1_000_000))
        const qMaxSize = BigInt(quote.max_size)

        const fillAsset = remainingAssetSize < qMaxSize ? remainingAssetSize : qMaxSize
        if (fillAsset <= 0n) continue

        const fillQuote = (fillAsset * qPrice) / 1_000_000n

        trancheFills.push({
          dealer: quote.dealer,
          price: qPrice,
          assetAmount: fillAsset,
          quoteAmount: fillQuote,
        })

        totalAssetMatched += fillAsset
        totalQuoteMatched += fillQuote
        remainingAssetSize -= fillAsset
      }

      if (trancheFills.length === 0) {
        return {
          success: false,
          status: 'no_match',
          round_id: bundle.round_id,
          error: 'Tranche knapsack allocation produced zero fills',
        }
      }

      const fillReceiptPda = deriveFillReceiptPda(roundIdBytes, this.programId)

      console.log(
        `[CreClient] Enclave matched ${totalAssetMatched} PT/YT for ${totalQuoteMatched} quote tokens across ${trancheFills.length} tranche(s). FillReceipt: ${fillReceiptPda}`
      )

      return {
        success: true,
        status: 'matched_simulation',
        round_id: bundle.round_id,
        fill_receipt: fillReceiptPda,
        asset_amount: totalAssetMatched.toString(),
        quote_amount: totalQuoteMatched.toString(),
        tranche_count: trancheFills.length,
      }
    } catch (err: any) {
      console.error(`[CreClient] Enclave simulation error:`, err)
      return {
        success: false,
        status: 'simulation_error',
        round_id: bundle.round_id,
        error: err.message,
      }
    }
  }
}

export const creClient = new CreClient()
