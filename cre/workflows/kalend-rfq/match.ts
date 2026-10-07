/**
 * Sealed-round matching, pure and deterministic (no SDK, no clock, no logging), so it runs
 * unchanged inside the enclave handler and in local tests.
 *
 * v1 rule (spec 8.2): each round matches its first valid request to the single best valid quote
 * meeting the requester's limit, for min(size, max_size). Ties are broken by
 * sha256(round_id || dealer), never by arrival order. Losing quotes never leave this function.
 */
import { PublicKey } from '@solana/web3.js'
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { utf8ToBytes, bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js'
import { hpkeOpen } from './hpke'

export interface SealedEnvelope {
  enc: string // hex
  ciphertext: string // hex
  kid: string
}

export interface RoundBundle {
  kid: string
  round_id: string // 32-byte hex
  series: string
  requests: SealedEnvelope[]
  quotes: SealedEnvelope[]
}

export interface RequestOrder {
  v: number
  round_id: string
  series: string
  side: 'SellPT' | 'SellYT'
  size: string // raw asset units, integer string
  limit_price: string // quote units per asset unit, decimal string (<= 6 dp)
  quote_mint: string
  requester: string // base58 wallet
  nonce: number
  not_after: number
}

export interface QuoteOrder {
  v: number
  round_id: string
  dealer: string // base58 wallet
  price: string // decimal string (<= 6 dp)
  max_size: string // raw asset units, integer string
  nonce: number
  not_after: number
}

interface SignedEnvelope<T> {
  payload: T
  sig: string // hex ed25519 signature over sha256(domain || JSON(payload))
  pubkey: string // hex ed25519 public key; must equal the wallet named in the payload
}

export interface MatchedFill {
  roundId: Uint8Array
  series: string
  side: 0 | 1
  requester: string
  dealer: string
  assetAmount: bigint
  quoteAmount: bigint
  quoteMint: string
  notAfter: number
}

export type MatchResult =
  | { status: 'filled'; fill: MatchedFill }
  | { status: 'no_match'; reason: string; validRequests: number; validQuotes: number }

const PRICE_SCALE = 1_000_000n
const INT_RE = /^[1-9][0-9]{0,19}$/
const DEC_RE = /^(0|[1-9][0-9]{0,12})(\.[0-9]{1,6})?$/
const U64_MAX = (1n << 64n) - 1n

export function parsePrice6(s: string): bigint | null {
  if (typeof s !== 'string' || !DEC_RE.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  return BigInt(whole) * PRICE_SCALE + BigInt(frac.padEnd(6, '0'))
}

function parseAmount(s: string): bigint | null {
  if (typeof s !== 'string' || !INT_RE.test(s)) return null
  const v = BigInt(s)
  return v > 0n && v <= U64_MAX ? v : null
}

function walletFromPubkeyHex(hex: string): string | null {
  try {
    const b = hexToBytes(hex)
    return b.length === 32 ? new PublicKey(b).toBase58() : null
  } catch {
    return null
  }
}

function isBase58Pubkey(s: string): boolean {
  try {
    return new PublicKey(s).toBase58() === s
  } catch {
    return false
  }
}

export function roundInfo(roundIdHex: string, kid: string): { info: Uint8Array; aad: Uint8Array } {
  const roundIdBytes = hexToBytes(roundIdHex)
  const kidBytes = utf8ToBytes(kid)
  return {
    info: concatBytes(utf8ToBytes('kalend/v1/rfq'), roundIdBytes, kidBytes),
    aad: concatBytes(new Uint8Array([1, 1]), roundIdBytes, kidBytes),
  }
}

/** Decrypt + verify one envelope. Returns null on any failure (fail closed, nothing logged). */
function openSigned<T extends { round_id: string }>(
  secretKey: Uint8Array,
  bundle: RoundBundle,
  env: SealedEnvelope,
  domain: 'KALEND/v1/request' | 'KALEND/v1/quote',
  walletField: 'requester' | 'dealer'
): T | null {
  try {
    if (env.kid !== bundle.kid) return null
    const { info, aad } = roundInfo(bundle.round_id, bundle.kid)
    const pt = hpkeOpen(secretKey, hexToBytes(env.enc), info, aad, hexToBytes(env.ciphertext))
    const signed = JSON.parse(new TextDecoder().decode(pt)) as SignedEnvelope<T>
    const digest = sha256(concatBytes(utf8ToBytes(domain), utf8ToBytes(JSON.stringify(signed.payload))))
    if (!ed25519.verify(hexToBytes(signed.sig), digest, hexToBytes(signed.pubkey))) return null
    // Bind identity: the signing wallet must be the wallet the order names.
    const signer = walletFromPubkeyHex(signed.pubkey)
    if (!signer || (signed.payload as any)[walletField] !== signer) return null
    if (signed.payload.round_id !== bundle.round_id) return null
    return signed.payload
  } catch {
    return null
  }
}

export function matchRound(secretKey: Uint8Array, bundle: RoundBundle, nowSecs: number): MatchResult {
  const requests: RequestOrder[] = []
  for (const env of bundle.requests) {
    const r = openSigned<RequestOrder>(secretKey, bundle, env, 'KALEND/v1/request', 'requester')
    if (
      r &&
      r.v === 1 &&
      r.series === bundle.series &&
      (r.side === 'SellPT' || r.side === 'SellYT') &&
      r.not_after > nowSecs &&
      parseAmount(r.size) !== null &&
      parsePrice6(r.limit_price) !== null &&
      isBase58Pubkey(r.quote_mint)
    ) {
      requests.push(r)
    }
  }

  const quotes: QuoteOrder[] = []
  for (const env of bundle.quotes) {
    const q = openSigned<QuoteOrder>(secretKey, bundle, env, 'KALEND/v1/quote', 'dealer')
    if (q && q.v === 1 && q.not_after > nowSecs && parseAmount(q.max_size) !== null && parsePrice6(q.price) !== null) {
      quotes.push(q)
    }
  }

  const counts = { validRequests: requests.length, validQuotes: quotes.length }
  if (requests.length === 0 || quotes.length === 0) {
    return { status: 'no_match', reason: 'insufficient_valid_orders', ...counts }
  }

  const req = requests[0]
  const limit = parsePrice6(req.limit_price)!
  const roundIdBytes = hexToBytes(bundle.round_id)
  const tieKey = (dealer: string) => bytesToHex(sha256(concatBytes(roundIdBytes, utf8ToBytes(dealer))))

  const eligible = quotes
    .filter((q) => q.dealer !== req.requester && parsePrice6(q.price)! >= limit)
    .sort((a, b) => {
      const pa = parsePrice6(a.price)!
      const pb = parsePrice6(b.price)!
      if (pa !== pb) return pb > pa ? 1 : -1
      return tieKey(a.dealer) < tieKey(b.dealer) ? -1 : 1
    })

  if (eligible.length === 0) {
    return { status: 'no_match', reason: 'no_quote_meets_limit', ...counts }
  }

  const best = eligible[0]
  const size = parseAmount(req.size)!
  const maxSize = parseAmount(best.max_size)!
  const assetAmount = size < maxSize ? size : maxSize
  const quoteAmount = (assetAmount * parsePrice6(best.price)!) / PRICE_SCALE
  if (quoteAmount === 0n || quoteAmount > U64_MAX) {
    return { status: 'no_match', reason: 'quote_amount_out_of_range', ...counts }
  }

  return {
    status: 'filled',
    fill: {
      roundId: roundIdBytes,
      series: req.series,
      side: req.side === 'SellPT' ? 0 : 1,
      requester: req.requester,
      dealer: best.dealer,
      assetAmount,
      quoteAmount,
      quoteMint: req.quote_mint,
      notAfter: Math.min(req.not_after, best.not_after),
    },
  }
}
