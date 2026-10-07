import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import idl from './idl/kalend.json'
import {
  PROGRAM_ID,
  CONFIG_PDA,
  REGISTRY_PDA,
} from './constants'
import {
  deriveAllowEntryPda,
  deriveEscrowPda,
  deriveFillReceiptPda,
} from './solana'
import type { WalletContextValue } from './wallet'

function getAnchorProgram(wallet: WalletContextValue): Program {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected')
  }

  const dummySigner = {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  }

  const provider = new AnchorProvider(
    wallet.connection,
    dummySigner as any,
    { commitment: 'confirmed', preflightCommitment: 'confirmed' }
  )

  return new Program(idl as any, provider)
}

/**
 * Fetch series data on-chain to ensure fresh accounts
 */
export async function getSeriesData(
  connection: Connection,
  seriesPubkey: PublicKey
) {
  const info = await connection.getAccountInfo(seriesPubkey)
  if (!info) {
    throw new Error(`Series account not found on-chain: ${seriesPubkey.toBase58()}`)
  }
  const sData = info.data
  let offset = 8
  const collateral_mint = new PublicKey(sData.subarray(offset, offset + 32))
  offset += 32
  const collateral_program = new PublicKey(sData.subarray(offset, offset + 32))
  offset += 32
  const quote_mint = new PublicKey(sData.subarray(offset, offset + 32))
  offset += 32
  const index_kind = sData[offset]
  offset += 1
  const index_source = new PublicKey(sData.subarray(offset, offset + 32))
  offset += 32
  // skip idx_open (16) + open_ts (8) + maturity_ts (8)
  offset += 32
  const pt_mint = new PublicKey(sData.subarray(offset, offset + 32))
  offset += 32
  const yt_mint = new PublicKey(sData.subarray(offset, offset + 32))
  offset += 32
  const vault = new PublicKey(sData.subarray(offset, offset + 32))

  return {
    collateral_mint,
    collateral_program,
    quote_mint,
    index_kind,
    index_source,
    pt_mint,
    yt_mint,
    vault,
  }
}

/**
 * STRIP: Deposit raw collateral into series vault, mint PT and YT 1:1
 */
export async function stripTokens(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    amount: bigint | number | string
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const amountBn = new BN(params.amount.toString())

  const seriesInfo = await getSeriesData(wallet.connection, seriesPk)
  const program = getAnchorProgram(wallet)

  const [allowEntryPda] = deriveAllowEntryPda(wallet.publicKey)

  const userCollateral = getAssociatedTokenAddressSync(
    seriesInfo.collateral_mint,
    wallet.publicKey,
    false,
    seriesInfo.collateral_program
  )
  const userPt = getAssociatedTokenAddressSync(
    seriesInfo.pt_mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )
  const userYt = getAssociatedTokenAddressSync(
    seriesInfo.yt_mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = new Transaction()

  // Ensure user ATAs exist idempotently
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      userPt,
      wallet.publicKey,
      seriesInfo.pt_mint,
      TOKEN_2022_PROGRAM_ID
    )
  )
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      userYt,
      wallet.publicKey,
      seriesInfo.yt_mint,
      TOKEN_2022_PROGRAM_ID
    )
  )

  const stripIx = await program.methods
    .strip(amountBn)
    .accounts({
      config: CONFIG_PDA,
      series: seriesPk,
      allowEntry: allowEntryPda,
      collateralMint: seriesInfo.collateral_mint,
      ptMint: seriesInfo.pt_mint,
      ytMint: seriesInfo.yt_mint,
      vault: seriesInfo.vault,
      userCollateral,
      userPt,
      userYt,
      user: wallet.publicKey,
      collateralTokenProgram: seriesInfo.collateral_program,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .instruction()

  tx.add(stripIx)
  return await wallet.sendTransaction(tx)
}

/**
 * MERGE: Burn matching PT and YT to reclaim raw collateral before maturity
 */
export async function mergeTokens(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    amount: bigint | number | string
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const amountBn = new BN(params.amount.toString())

  const seriesInfo = await getSeriesData(wallet.connection, seriesPk)
  const program = getAnchorProgram(wallet)

  const userCollateral = getAssociatedTokenAddressSync(
    seriesInfo.collateral_mint,
    wallet.publicKey,
    false,
    seriesInfo.collateral_program
  )
  const userPt = getAssociatedTokenAddressSync(
    seriesInfo.pt_mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )
  const userYt = getAssociatedTokenAddressSync(
    seriesInfo.yt_mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = new Transaction()
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      userCollateral,
      wallet.publicKey,
      seriesInfo.collateral_mint,
      seriesInfo.collateral_program
    )
  )

  const mergeIx = await program.methods
    .merge(amountBn)
    .accounts({
      series: seriesPk,
      collateralMint: seriesInfo.collateral_mint,
      ptMint: seriesInfo.pt_mint,
      ytMint: seriesInfo.yt_mint,
      vault: seriesInfo.vault,
      userCollateral,
      userPt,
      userYt,
      user: wallet.publicKey,
      collateralTokenProgram: seriesInfo.collateral_program,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .instruction()

  tx.add(mergeIx)
  return await wallet.sendTransaction(tx)
}

/**
 * REDEEM PT: Burn settled PT to redeem principal in raw collateral
 */
export async function redeemPt(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    amount: bigint | number | string
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const amountBn = new BN(params.amount.toString())

  const seriesInfo = await getSeriesData(wallet.connection, seriesPk)
  const program = getAnchorProgram(wallet)

  const [allowEntryPda] = deriveAllowEntryPda(wallet.publicKey)
  const userCollateral = getAssociatedTokenAddressSync(
    seriesInfo.collateral_mint,
    wallet.publicKey,
    false,
    seriesInfo.collateral_program
  )
  const userPt = getAssociatedTokenAddressSync(
    seriesInfo.pt_mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = new Transaction()
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      userCollateral,
      wallet.publicKey,
      seriesInfo.collateral_mint,
      seriesInfo.collateral_program
    )
  )

  const redeemIx = await program.methods
    .redeemPt(amountBn)
    .accounts({
      series: seriesPk,
      allowEntry: allowEntryPda,
      collateralMint: seriesInfo.collateral_mint,
      ptMint: seriesInfo.pt_mint,
      vault: seriesInfo.vault,
      userPt,
      userCollateral,
      user: wallet.publicKey,
      collateralTokenProgram: seriesInfo.collateral_program,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .instruction()

  tx.add(redeemIx)
  return await wallet.sendTransaction(tx)
}

/**
 * CLAIM YT: Burn settled YT to claim accrued yield in raw collateral
 */
export async function claimYt(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    amount: bigint | number | string
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const amountBn = new BN(params.amount.toString())

  const seriesInfo = await getSeriesData(wallet.connection, seriesPk)
  const program = getAnchorProgram(wallet)

  const [allowEntryPda] = deriveAllowEntryPda(wallet.publicKey)
  const userCollateral = getAssociatedTokenAddressSync(
    seriesInfo.collateral_mint,
    wallet.publicKey,
    false,
    seriesInfo.collateral_program
  )
  const userYt = getAssociatedTokenAddressSync(
    seriesInfo.yt_mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = new Transaction()
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      userCollateral,
      wallet.publicKey,
      seriesInfo.collateral_mint,
      seriesInfo.collateral_program
    )
  )

  const claimIx = await program.methods
    .claimYt(amountBn)
    .accounts({
      series: seriesPk,
      allowEntry: allowEntryPda,
      collateralMint: seriesInfo.collateral_mint,
      ytMint: seriesInfo.yt_mint,
      vault: seriesInfo.vault,
      userYt,
      userCollateral,
      user: wallet.publicKey,
      collateralTokenProgram: seriesInfo.collateral_program,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .instruction()

  tx.add(claimIx)
  return await wallet.sendTransaction(tx)
}

/**
 * LOCK ESCROW: Lock collateral or quote asset for an active RFQ round
 */
export async function lockEscrow(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    mintPubkey: PublicKey | string
    amount: bigint | number | string
    lockUntilTs: number
    isToken2022?: boolean
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const mintPk = typeof params.mintPubkey === 'string' ? new PublicKey(params.mintPubkey) : params.mintPubkey
  const amountBn = new BN(params.amount.toString())
  const lockUntilBn = new BN(params.lockUntilTs)

  const tokenProgramId = params.isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID

  const [escrowPda] = deriveEscrowPda(seriesPk, wallet.publicKey, mintPk)
  const [allowEntryPda] = deriveAllowEntryPda(wallet.publicKey)

  const escrowToken = getAssociatedTokenAddressSync(
    mintPk,
    escrowPda,
    true,
    tokenProgramId
  )
  const ownerToken = getAssociatedTokenAddressSync(
    mintPk,
    wallet.publicKey,
    false,
    tokenProgramId
  )

  const program = getAnchorProgram(wallet)
  const lockIx = await program.methods
    .lockEscrow(amountBn, lockUntilBn)
    .accounts({
      config: CONFIG_PDA,
      series: seriesPk,
      allowEntry: allowEntryPda,
      escrow: escrowPda,
      mint: mintPk,
      escrowToken,
      ownerToken,
      owner: wallet.publicKey,
      tokenProgram: tokenProgramId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction()

  const tx = new Transaction().add(lockIx)
  return await wallet.sendTransaction(tx)
}

/**
 * WITHDRAW ESCROW: Reclaim unconsumed funds from escrow after lock expiry
 */
export async function withdrawEscrow(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    mintPubkey: PublicKey | string
    amount: bigint | number | string
    isToken2022?: boolean
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const mintPk = typeof params.mintPubkey === 'string' ? new PublicKey(params.mintPubkey) : params.mintPubkey
  const amountBn = new BN(params.amount.toString())

  const tokenProgramId = params.isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
  const [escrowPda] = deriveEscrowPda(seriesPk, wallet.publicKey, mintPk)

  const escrowToken = getAssociatedTokenAddressSync(
    mintPk,
    escrowPda,
    true,
    tokenProgramId
  )
  const ownerToken = getAssociatedTokenAddressSync(
    mintPk,
    wallet.publicKey,
    false,
    tokenProgramId
  )

  const program = getAnchorProgram(wallet)
  const withdrawIx = await program.methods
    .withdrawEscrow(amountBn)
    .accounts({
      series: seriesPk,
      escrow: escrowPda,
      mint: mintPk,
      escrowToken,
      ownerToken,
      owner: wallet.publicKey,
      tokenProgram: tokenProgramId,
    })
    .instruction()

  const tx = new Transaction().add(withdrawIx)
  return await wallet.sendTransaction(tx)
}

/**
 * SET ALLOW ENTRY: Admin adds or updates KYC / whitelist accreditation
 */
export async function setAllowEntry(
  wallet: WalletContextValue,
  params: {
    targetWallet: PublicKey | string
    roles: number
    expiryTs: number
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const targetPk = typeof params.targetWallet === 'string' ? new PublicKey(params.targetWallet) : params.targetWallet
  const [allowEntryPda] = deriveAllowEntryPda(targetPk)

  const program = getAnchorProgram(wallet)
  const ix = await program.methods
    .setAllowEntry(targetPk, params.roles, new BN(params.expiryTs))
    .accounts({
      config: CONFIG_PDA,
      allowEntry: allowEntryPda,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .instruction()

  const tx = new Transaction().add(ix)
  return await wallet.sendTransaction(tx)
}

/**
 * REMOVE ALLOW ENTRY: Admin revokes accreditation
 */
export async function removeAllowEntry(
  wallet: WalletContextValue,
  params: {
    targetWallet: PublicKey | string
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const targetPk = typeof params.targetWallet === 'string' ? new PublicKey(params.targetWallet) : params.targetWallet
  const [allowEntryPda] = deriveAllowEntryPda(targetPk)

  const program = getAnchorProgram(wallet)
  const ix = await program.methods
    .removeAllowEntry(targetPk)
    .accounts({
      config: CONFIG_PDA,
      allowEntry: allowEntryPda,
      authority: wallet.publicKey,
    })
    .instruction()

  const tx = new Transaction().add(ix)
  return await wallet.sendTransaction(tx)
}

/**
 * SETTLE ONCHAIN: Permissionless crank settling a StakePoolRate series at maturity
 */
export async function settleOnchain(
  wallet: WalletContextValue,
  params: {
    seriesPubkey: PublicKey | string
    indexSourcePubkey: PublicKey | string
  }
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const seriesPk = typeof params.seriesPubkey === 'string' ? new PublicKey(params.seriesPubkey) : params.seriesPubkey
  const indexSourcePk = typeof params.indexSourcePubkey === 'string' ? new PublicKey(params.indexSourcePubkey) : params.indexSourcePubkey

  const program = getAnchorProgram(wallet)
  const ix = await program.methods
    .settleOnchain()
    .accounts({
      series: seriesPk,
      indexSource: indexSourcePk,
      crank: wallet.publicKey,
    })
    .instruction()

  const tx = new Transaction().add(ix)
  return await wallet.sendTransaction(tx)
}

/**
 * PAUSE / UNPAUSE PROTOCOL: Emergency circuit breaker
 */
export async function togglePauseGlobal(
  wallet: WalletContextValue,
  paused: boolean
): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const program = getAnchorProgram(wallet)

  const ix = await program.methods
    .pauseGlobal(paused)
    .accounts({
      config: CONFIG_PDA,
      authority: wallet.publicKey,
    })
    .instruction()

  const tx = new Transaction().add(ix)
  return await wallet.sendTransaction(tx)
}

/**
 * EXECUTE FILL: permissionless phase 2 of a two-phase fill. Anyone may send it; the program
 * pays out only to the requester's and dealer's own token accounts named in the FillReceipt.
 */
export async function executeFill(wallet: WalletContextValue, roundIdHex: string): Promise<string> {
  if (!wallet.publicKey) throw new Error('Please connect your wallet first')
  const program = getAnchorProgram(wallet)
  const [receiptPda] = deriveFillReceiptPda(Buffer.from(roundIdHex, 'hex'))
  const receipt: any = await (program.account as any).fillReceipt.fetch(receiptPda)
  if (receipt.status === 1) throw new Error('This fill was already executed')

  const series: any = await (program.account as any).series.fetch(receipt.series)
  const assetMint: PublicKey = receipt.side === 0 ? series.ptMint : series.ytMint
  const quoteMint: PublicKey = receipt.quoteMint
  const quoteMintInfo = await wallet.connection.getAccountInfo(quoteMint)
  if (!quoteMintInfo) throw new Error('Quote mint not found')
  const quoteProgram = quoteMintInfo.owner
  const assetProgram = TOKEN_2022_PROGRAM_ID

  const requester: PublicKey = receipt.requester
  const dealer: PublicKey = receipt.dealer
  const [reqEscrow] = deriveEscrowPda(receipt.series, requester, assetMint)
  const [dlrEscrow] = deriveEscrowPda(receipt.series, dealer, quoteMint)
  const requesterQuoteToken = getAssociatedTokenAddressSync(quoteMint, requester, false, quoteProgram)
  const dealerAssetToken = getAssociatedTokenAddressSync(assetMint, dealer, false, assetProgram)

  const ix = await program.methods
    .executeFill()
    .accountsStrict({
      caller: wallet.publicKey,
      requester,
      dealer,
      assetMint,
      quoteMint,
      assetTokenProgram: assetProgram,
      quoteTokenProgram: quoteProgram,
      fillReceipt: receiptPda,
      series: receipt.series,
      allowEntryRequester: deriveAllowEntryPda(requester)[0],
      allowEntryDealer: deriveAllowEntryPda(dealer)[0],
      requesterAssetEscrow: reqEscrow,
      requesterAssetEscrowToken: getAssociatedTokenAddressSync(assetMint, reqEscrow, true, assetProgram),
      dealerQuoteEscrow: dlrEscrow,
      dealerQuoteEscrowToken: getAssociatedTokenAddressSync(quoteMint, dlrEscrow, true, quoteProgram),
      requesterQuoteToken,
      dealerAssetToken,
    })
    .instruction()

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, requesterQuoteToken, requester, quoteMint, quoteProgram),
    createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, dealerAssetToken, dealer, assetMint, assetProgram),
    ix
  )
  return await wallet.sendTransaction(tx)
}
