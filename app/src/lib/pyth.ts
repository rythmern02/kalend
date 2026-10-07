import { Connection, PublicKey } from '@solana/web3.js'

/**
 * Pyth display prices (never used in settlement math).
 *
 * Primary source: the Pyth Solana Receiver "sponsored" price-feed accounts, which Pyth keeps
 * updated on devnet and mainnet. Address = PDA(seeds [shard_id u16 LE, feed_id], push-oracle
 * program). We verify the account owner is the receiver program and that the feed_id stored in
 * the account equals the one requested before showing any number.
 *
 * Optional source: Hermes, only when NEXT_PUBLIC_PYTH_API_KEY is set in the environment.
 * Hermes now rejects unauthenticated requests, so the on-chain path is the default.
 *
 * Feed IDs verified against Hermes /v2/price_feeds metadata on 2026-10-07.
 */

export const PYTH_PUSH_ORACLE_PROGRAM = new PublicKey('pythWSnswVUd12oZpeFP8e9CVaEqJg25g1Vtc2biRsT')
export const PYTH_RECEIVER_PROGRAM = new PublicKey('rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ')
export const PYTH_HERMES_URL = 'https://hermes.pyth.network'

export const PYTH_FEEDS = {
  'SOL/USD': 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'JITOSOL/USD': '67be9f519b95cf24338801051f9a808eff0a578ccb388db73b7f6fe1de019ffb',
  'BTC/USD': 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
} as const

export type PythSymbol = keyof typeof PYTH_FEEDS

/** A price older than this is shown as stale rather than live. */
export const PYTH_STALE_AFTER_SECS = 120

export interface PythPrice {
  symbol: PythSymbol
  feedId: string
  account: string | null
  price: number
  conf: number
  publishTime: number
  source: 'pyth-receiver-onchain' | 'pyth-hermes'
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export function derivePriceFeedAccount(feedIdHex: string, shardId = 0): PublicKey {
  const shard = new Uint8Array(2)
  new DataView(shard.buffer).setUint16(0, shardId, true)
  return PublicKey.findProgramAddressSync([shard, hexToBytes(feedIdHex)], PYTH_PUSH_ORACLE_PROGRAM)[0]
}

/**
 * Decode a PriceUpdateV2 account:
 * 8 discriminator | 32 write_authority | VerificationLevel (0 = Partial{u8}, 1 = Full) |
 * PriceFeedMessage { feed_id[32], price i64, conf u64, exponent i32, publish_time i64, ... }
 */
export function decodePriceUpdateV2(data: Uint8Array): {
  feedId: string
  price: number
  conf: number
  publishTime: number
} | null {
  if (data.length < 8 + 32 + 2 + 32 + 28) return null
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const level = data[40]
  let o = level === 0 ? 42 : 41
  const feedId = bytesToHex(data.subarray(o, o + 32))
  o += 32
  const rawPrice = view.getBigInt64(o, true)
  const rawConf = view.getBigUint64(o + 8, true)
  const expo = view.getInt32(o + 16, true)
  const publishTime = Number(view.getBigInt64(o + 20, true))
  const scale = Math.pow(10, expo)
  return { feedId, price: Number(rawPrice) * scale, conf: Number(rawConf) * scale, publishTime }
}

export async function fetchPythOnchain(connection: Connection, symbols: PythSymbol[]): Promise<PythPrice[]> {
  const accounts = symbols.map((s) => derivePriceFeedAccount(PYTH_FEEDS[s]))
  const infos = await connection.getMultipleAccountsInfo(accounts, 'confirmed')
  const out: PythPrice[] = []
  infos.forEach((info, i) => {
    const symbol = symbols[i]
    if (!info || !info.owner.equals(PYTH_RECEIVER_PROGRAM)) return
    const decoded = decodePriceUpdateV2(info.data)
    if (!decoded || decoded.feedId !== PYTH_FEEDS[symbol]) return
    out.push({
      symbol,
      feedId: decoded.feedId,
      account: accounts[i].toBase58(),
      price: decoded.price,
      conf: decoded.conf,
      publishTime: decoded.publishTime,
      source: 'pyth-receiver-onchain',
    })
  })
  return out
}

export async function fetchPythHermes(apiKey: string, symbols: PythSymbol[]): Promise<PythPrice[]> {
  const q = symbols.map((s) => `ids[]=${PYTH_FEEDS[s]}`).join('&')
  const res = await fetch(`${PYTH_HERMES_URL}/v2/updates/price/latest?${q}&parsed=true`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) return []
  const json = await res.json()
  const out: PythPrice[] = []
  for (const symbol of symbols) {
    const item = json?.parsed?.find((p: any) => p.id === PYTH_FEEDS[symbol])
    if (!item?.price) continue
    const scale = Math.pow(10, item.price.expo)
    out.push({
      symbol,
      feedId: item.id,
      account: null,
      price: Number(item.price.price) * scale,
      conf: Number(item.price.conf) * scale,
      publishTime: Number(item.price.publish_time),
      source: 'pyth-hermes',
    })
  }
  return out
}

/** On-chain first (verifiable, keyless); Hermes only fills gaps when a key is configured. */
export async function fetchPythPrices(connection: Connection, symbols: PythSymbol[]): Promise<PythPrice[]> {
  let prices: PythPrice[] = []
  try {
    prices = await fetchPythOnchain(connection, symbols)
  } catch {
    prices = []
  }
  const missing = symbols.filter((s) => !prices.some((p) => p.symbol === s))
  const apiKey = process.env.NEXT_PUBLIC_PYTH_API_KEY
  if (missing.length > 0 && apiKey) {
    try {
      prices = prices.concat(await fetchPythHermes(apiKey, missing))
    } catch {
      // display-only; leave missing feeds empty
    }
  }
  return symbols.flatMap((s) => prices.filter((p) => p.symbol === s))
}
