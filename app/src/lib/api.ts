import { Connection, PublicKey } from '@solana/web3.js'
import {
  PROGRAM_ID,
  CONFIG_PDA,
  REGISTRY_PDA,
  SOLANA_RPC_URL,
  RELAY_API_URL,
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
    const count = data.readUInt32LE(8)
    const pubkeys: PublicKey[] = []

    let offset = 12
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
      const idx_open = sData.readBigUInt64LE(sOffset).toString()
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
      const idx_settle = sData.readBigUInt64LE(sOffset).toString()
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
 * Fetch Pyth reference rates (SOL/USD, BTC/USD, US Rates)
 */
export async function fetchPythFeed(symbol: 'SOL/USD' | 'BTC/USD'): Promise<PythFeedData | null> {
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
      source: 'Pyth Solana Devnet Feed',
    })
  } catch (err) {
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
