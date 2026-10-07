import { Connection, PublicKey } from '@solana/web3.js'
import { PROGRAM_ID, SOLANA_RPC_URL } from './constants'

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

export function deriveSeriesPda(collateralMint: PublicKey, maturityTs: number, nonce: number): [PublicKey, number] {
  const matBuf = Buffer.alloc(8)
  matBuf.writeBigInt64LE(BigInt(maturityTs))
  const nonceBuf = Buffer.alloc(2)
  nonceBuf.writeUInt16LE(nonce)

  return PublicKey.findProgramAddressSync(
    [Buffer.from('series'), collateralMint.toBuffer(), matBuf, nonceBuf],
    PROGRAM_ID
  )
}

export function derivePtMintPda(seriesPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('pt_mint'), seriesPda.toBuffer()], PROGRAM_ID)
}

export function deriveYtMintPda(seriesPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('yt_mint'), seriesPda.toBuffer()], PROGRAM_ID)
}

export function deriveAllowEntryPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('allow'), wallet.toBuffer()], PROGRAM_ID)
}

export function deriveEscrowPda(series: PublicKey, owner: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), series.toBuffer(), owner.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  )
}

export function deriveFillReceiptPda(roundIdBytes: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('fill'), roundIdBytes], PROGRAM_ID)
}

// In-kind principal redemption formula
export function ptRedeemRaw(amount: bigint, idxOpen: bigint, idxSettle: bigint): bigint {
  if (idxSettle === 0n) return 0n
  const minIdx = idxOpen < idxSettle ? idxOpen : idxSettle
  return (amount * minIdx) / idxSettle
}

// In-kind yield claim formula
export function ytClaimRaw(amount: bigint, idxOpen: bigint, idxSettle: bigint): bigint {
  if (idxSettle === 0n) return 0n
  const minIdx = idxOpen < idxSettle ? idxOpen : idxSettle
  const growth = idxSettle > minIdx ? idxSettle - minIdx : 0n
  return (amount * growth) / idxSettle
}

// Implied annualized fixed rate: (1/price - 1) * 365 / daysLeft
export function calculateImpliedRate(price: number, daysLeft: number): number {
  if (price <= 0 || daysLeft <= 0) return 0
  return ((1 / price - 1) * 365) / daysLeft
}

/** Mint decimals (offset 44 in both SPL Token and Token-2022 mint layouts). */
export async function getMintDecimals(conn: Connection, mint: PublicKey | string): Promise<number> {
  const info = await conn.getAccountInfo(typeof mint === 'string' ? new PublicKey(mint) : mint)
  if (!info || info.data.length < 45) throw new Error('Mint account not found')
  return info.data[44]
}

/** Exact decimal string -> raw integer units (no floating point). */
export function parseUnits(amount: string, decimals: number): bigint {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(amount.trim())
  if (!m) throw new Error(`Invalid amount: ${amount}`)
  const frac = m[2] ?? ''
  if (frac.length > decimals) throw new Error(`At most ${decimals} decimal places`)
  const raw = BigInt(m[1]) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0') || '0')
  if (raw === 0n) throw new Error('Amount must be greater than zero')
  return raw
}

export function formatUnits(raw: bigint | string | number, decimals: number): string {
  const v = BigInt(raw)
  const base = 10n ** BigInt(decimals)
  const frac = (v % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return frac ? `${v / base}.${frac}` : `${v / base}`
}
