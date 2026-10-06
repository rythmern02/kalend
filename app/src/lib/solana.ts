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
