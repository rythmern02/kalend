import { Connection, PublicKey } from '@solana/web3.js'
import {
  PROGRAM_ID,
  CONFIG_PDA,
  REGISTRY_PDA,
  SOLANA_RPC_URL,
  RELAY_API_URL,
  DEVNET_STAKE_POOL,
  PYTH_HERMES_URL,
  PYTH_API_KEY,
  PYTH_FEED_SOL_USD,
  PYTH_FEED_BTC_USD,
} from './constants'
import {
  ConfigAccountSchema,
  ConfigAccount,
  SeriesAccountSchema,
  SeriesAccount,
  AllowEntrySchema,
  AllowEntry,
  PythFeedDataSchema,
  PythFeedData,
  RfqRoundStatusSchema,
  RfqRoundStatus,
  FillReceipt,
  FillReceiptSchema,
} from './types'

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

/**
 * Fetch and parse on-chain Config PDA account
 */
export async function fetchConfig(): Promise<ConfigAccount | null> {
  try {
    const acc = await connection.getAccountInfo(CONFIG_PDA)
    if (!acc) return null

    const data = acc.data
    // Anchor discriminator: 8 bytes
    let offset = 8
    const authority = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
    offset += 32
    const pending_authority = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
    offset += 32

    // Forwarders: 2 entries of (32 + 32 + 32) = 96 bytes each
    const forwarders = []
    for (let i = 0; i < 2; i++) {
      const program = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
      offset += 32
      const state = new PublicKey(data.subarray(offset, offset + 32)).toBase58()
      offset += 32
      const allowed_workflow = Buffer.from(data.subarray(offset, offset + 32)).toString('hex')
      offset += 32
      forwarders.push({ program, state, allowed_workflow })
    }

    const forwarder_count = data[offset]
    offset += 1

    const enclave_key_hash = Buffer.from(data.subarray(offset, offset + 32)).toString('hex')
    offset += 32

    const paused = data[offset] === 1
    offset += 1

    const cluster_mode = data[offset]
    offset += 1

    const fee_bps = data.readUInt16LE(offset)
    offset += 2

    const treasury = new PublicKey(data.subarray(offset, offset + 32)).toBase58()

    return ConfigAccountSchema.parse({
      authority,
      pending_authority,
      forwarders,
      forwarder_count,
      enclave_key_hash,
      paused,
      cluster_mode,
      fee_bps,
      treasury,
    })
  } catch (err) {
    console.warn('Failed to parse on-chain Config account:', err)
    return null
  }
}

/**
 * Fetch and parse on-chain Series accounts from Registry
 */
export async function fetchAllSeries(): Promise<SeriesAccount[]> {
  try {
    const regAcc = await connection.getAccountInfo(REGISTRY_PDA)
    if (!regAcc) return []

    const data = regAcc.data
    const count = data.readUInt16LE(8)
    const pubkeys: PublicKey[] = []

    let offset = 14
    for (let i = 0; i < count && i < 64; i++) {
      const pk = new PublicKey(data.subarray(offset, offset + 32))
      if (!pk.equals(PublicKey.default)) {
        pubkeys.push(pk)
      }
      offset += 32
    }

    if (pubkeys.length === 0) return []

    const seriesAccounts = await connection.getMultipleAccountsInfo(pubkeys)
    const parsedSeries: SeriesAccount[] = []

    for (let i = 0; i < pubkeys.length; i++) {
      const acc = seriesAccounts[i]
      if (!acc) continue

      const sData = acc.data
      let sOffset = 8 // skip discriminator
      const collateral_mint = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const collateral_program = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const quote_mint = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const index_kind = sData[sOffset]
      sOffset += 1
      const index_source = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const lowOpen = sData.readBigUInt64LE(sOffset)
      const highOpen = sData.readBigUInt64LE(sOffset + 8)
      const idx_open = (lowOpen + (highOpen << 64n)).toString()
      sOffset += 16
      const open_ts = Number(sData.readBigInt64LE(sOffset))
      sOffset += 8
      const maturity_ts = Number(sData.readBigInt64LE(sOffset))
      sOffset += 8
      const pt_mint = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const yt_mint = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const vault = new PublicKey(sData.subarray(sOffset, sOffset + 32)).toBase58()
      sOffset += 32
      const status = sData[sOffset]
      sOffset += 1
      const lowSettle = sData.readBigUInt64LE(sOffset)
      const highSettle = sData.readBigUInt64LE(sOffset + 8)
      const idx_settle = (lowSettle + (highSettle << 64n)).toString()
      sOffset += 16
      const split_num = sData.readUInt32LE(sOffset)
      sOffset += 4
      const split_den = sData.readUInt32LE(sOffset)
      sOffset += 4
      const settled_ts = Number(sData.readBigInt64LE(sOffset))
      sOffset += 8
      const privacy_mode = sData[sOffset]
      sOffset += 1
      const max_rate_bps = sData.readUInt32LE(sOffset)
      sOffset += 4
      const dividend_cap_bps = sData.readUInt32LE(sOffset)
      sOffset += 4
      const nonce = sData.readUInt16LE(sOffset)

      parsedSeries.push(
        SeriesAccountSchema.parse({
          pubkey: pubkeys[i].toBase58(),
          collateral_mint,
          collateral_program,
          quote_mint,
          index_kind,
          index_source,
          idx_open,
          open_ts,
          maturity_ts,
          pt_mint,
          yt_mint,
          vault,
          status,
          idx_settle,
          split_num,
          split_den,
          settled_ts,
          privacy_mode,
          max_rate_bps,
          dividend_cap_bps,
          nonce,
        })
      )
    }

    return parsedSeries
  } catch (err) {
    console.warn('Failed to fetch series from on-chain Registry:', err)
    return []
  }
}

/**
 * Fetch AllowEntry account for a wallet address
 */
export async function fetchAllowEntry(walletAddress: string): Promise<AllowEntry | null> {
  try {
    const walletPubkey = new PublicKey(walletAddress)
    const [allowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('allow'), walletPubkey.toBuffer()],
      PROGRAM_ID
    )

    const acc = await connection.getAccountInfo(allowPda)
    if (!acc) return null

    const data = acc.data
    // 8 disc + 32 wallet + 8 expiry_ts + 1 roles
    const expiry_ts = Number(data.readBigInt64LE(40))
    const roles = data[48]
    const now = Math.floor(Date.now() / 1000)

    return AllowEntrySchema.parse({
      wallet: walletAddress,
      expiry_ts,
      roles,
      is_valid: expiry_ts > now && roles > 0,
    })
  } catch (err) {
    return null
  }
}

/**
 * Fetch Pyth reference rates (SOL/USD, BTC/USD) via Pyth Hermes API or on-chain Devnet accounts
 */
export async function fetchPythFeed(symbol: 'SOL/USD' | 'BTC/USD'): Promise<PythFeedData | null> {
  // 1. Try Authenticated Pyth Hermes API
  const feedIds: Record<string, string> = {
    'SOL/USD': PYTH_FEED_SOL_USD,
    'BTC/USD': PYTH_FEED_BTC_USD,
  }

  const feedId = feedIds[symbol]
  if (feedId && PYTH_API_KEY) {
    try {
      const res = await fetch(
        `${PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${feedId}&parsed=true`,
        {
          headers: {
            Authorization: `Bearer ${PYTH_API_KEY}`,
          },
        }
      )
      if (res.ok) {
        const json = await res.json()
        const parsed = json.parsed?.[0]
        if (parsed?.price) {
          const price = Number(parsed.price.price) * Math.pow(10, parsed.price.expo)
          const confidence = Number(parsed.price.conf) * Math.pow(10, parsed.price.expo)
          const publishTime = Number(parsed.price.publish_time)

          return PythFeedDataSchema.parse({
            symbol,
            price,
            confidence,
            publishTime,
            source: 'Pyth Hermes Live Feed (Authenticated)',
          })
        }
      }
    } catch {
      // Fall through to on-chain account fallback
    }
  }

  // 2. Fallback: On-Chain Devnet Pyth Price Accounts
  try {
    const feedAddresses: Record<string, string> = {
      'SOL/USD': 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
      'BTC/USD': 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J',
    }

    const addr = feedAddresses[symbol]
    if (!addr) return null

    const acc = await connection.getAccountInfo(new PublicKey(addr))
    if (!acc || acc.data.length < 240) return null

    const data = acc.data
    const priceRaw = Number(data.readBigInt64LE(208))
    const confRaw = Number(data.readBigUInt64LE(216))
    const expo = data.readInt32LE(20)
    const publishTime = Number(data.readBigInt64LE(224))

    const price = priceRaw * Math.pow(10, expo)
    const confidence = confRaw * Math.pow(10, expo)

    return PythFeedDataSchema.parse({
      symbol,
      price,
      confidence,
      publishTime,
      source: 'Pyth Solana Devnet On-Chain',
    })
  } catch (err) {
    return null
  }
}

export interface StakePoolRateData {
  totalLamports: string
  poolTokenSupply: string
  exchangeRate: number
  annualizedYieldPct: number
  sourceAccount: string
  isLive: boolean
}

/**
 * Fetch live exchange rate from Devnet SPL Stake Pool (HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f)
 */
export async function fetchLiveStakePoolRate(): Promise<StakePoolRateData | null> {
  try {
    const poolPubkey = new PublicKey(DEVNET_STAKE_POOL)
    const acc = await connection.getAccountInfo(poolPubkey)
    if (!acc || acc.data.length < 274) {
      return null
    }

    const data = acc.data
    const totalLamports = data.readBigUInt64LE(258)
    const poolTokenSupply = data.readBigUInt64LE(266)

    if (poolTokenSupply === 0n) return null

    const rateWad = (totalLamports * 1_000_000_000_000_000_000n) / poolTokenSupply
    const exchangeRate = Number(rateWad) / 1e18

    // Devnet stake pools exhibit minimal movement; calculate exact delta
    const delta = exchangeRate >= 1.0 ? exchangeRate - 1.0 : 0
    const annualizedYieldPct = Math.max(0.01, Number((delta * 100).toFixed(4)))

    return {
      totalLamports: totalLamports.toString(),
      poolTokenSupply: poolTokenSupply.toString(),
      exchangeRate,
      annualizedYieldPct,
      sourceAccount: DEVNET_STAKE_POOL,
      isLive: true,
    }
  } catch (err) {
    console.warn('Failed to fetch live stake pool rate:', err)
    return null
  }
}

/**
 * Fetch RFQ Round Status from the Relay
 */
export async function fetchRfqRound(roundId: string): Promise<RfqRoundStatus | null> {
  try {
    const res = await fetch(`${RELAY_API_URL}/rfq/rounds/${roundId}`)
    if (!res.ok) return null
    const json = await res.json()
    return RfqRoundStatusSchema.parse(json)
  } catch (err) {
    return null
  }
}

/**
 * Fetch FillReceipts from Relay or on-chain
 */
export async function fetchFillReceipts(): Promise<FillReceipt[]> {
  try {
    const res = await fetch(`${RELAY_API_URL}/rfq/receipts`)
    if (!res.ok) return []
    const json = await res.json()
    if (!Array.isArray(json)) return []
    return json.map((item) => FillReceiptSchema.parse(item))
  } catch (err) {
    return []
  }
}
