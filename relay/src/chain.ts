import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token'

/**
 * Chain access for the relay: reads FillReceipts (the source of truth for round outcomes) and
 * cranks the permissionless execute_fill. Destinations are fixed by the program to the
 * requester's and dealer's own token accounts, so the crank cannot redirect funds.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const IDL_PATH = process.env.KALEND_IDL_PATH || path.resolve(here, '../../target/idl/kalend.json')

export interface ChainFillReceipt {
  address: string
  round_id: string
  series: string
  requester: string
  dealer: string
  side: 'SellPT' | 'SellYT'
  asset_amount: string
  quote_amount: string
  quote_mint: string
  ts: number
  report_hash: string
  status: 'Approved' | 'Executed'
}

export class KalendChain {
  readonly connection: Connection
  readonly program: Program
  readonly programId: PublicKey
  readonly crank: Keypair | null

  constructor(rpcUrl: string, crank: Keypair | null) {
    this.connection = new Connection(rpcUrl, 'confirmed')
    this.crank = crank
    const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf-8'))
    const wallet = new Wallet(crank ?? Keypair.generate())
    this.program = new Program(idl, new AnchorProvider(this.connection, wallet, { commitment: 'confirmed' }))
    this.programId = this.program.programId
  }

  fillReceiptPda(roundIdHex: string): PublicKey {
    return PublicKey.findProgramAddressSync([Buffer.from('fill'), Buffer.from(roundIdHex, 'hex')], this.programId)[0]
  }

  private escrowPda(series: PublicKey, owner: PublicKey, mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), series.toBuffer(), owner.toBuffer(), mint.toBuffer()],
      this.programId
    )[0]
  }

  private toReceipt(address: PublicKey, r: any): ChainFillReceipt {
    return {
      address: address.toBase58(),
      round_id: Buffer.from(r.roundId).toString('hex'),
      series: r.series.toBase58(),
      requester: r.requester.toBase58(),
      dealer: r.dealer.toBase58(),
      side: r.side === 0 ? 'SellPT' : 'SellYT',
      asset_amount: r.assetAmount.toString(),
      quote_amount: r.quoteAmount.toString(),
      quote_mint: r.quoteMint.toBase58(),
      ts: Number(r.ts),
      report_hash: Buffer.from(r.reportHash).toString('hex'),
      status: r.status === 1 ? 'Executed' : 'Approved',
    }
  }

  async getFillReceipt(roundIdHex: string): Promise<ChainFillReceipt | null> {
    const pda = this.fillReceiptPda(roundIdHex)
    const r = await (this.program.account as any).fillReceipt.fetchNullable(pda)
    return r ? this.toReceipt(pda, r) : null
  }

  async listFillReceipts(): Promise<ChainFillReceipt[]> {
    const all = await (this.program.account as any).fillReceipt.all()
    return all
      .map((a: any) => this.toReceipt(a.publicKey, a.account))
      .sort((a: ChainFillReceipt, b: ChainFillReceipt) => b.ts - a.ts)
  }

  /** Phase 2 of the two-phase fill. Throws with the program error if it fails. */
  async executeFill(roundIdHex: string): Promise<string> {
    if (!this.crank) throw new Error('No crank keypair configured (KALEND_CRANK_KEYPAIR)')
    const receiptPda = this.fillReceiptPda(roundIdHex)
    const receipt = await (this.program.account as any).fillReceipt.fetch(receiptPda)
    if (receipt.status === 1) throw new Error('Fill already executed')

    const series = await (this.program.account as any).series.fetch(receipt.series)
    const assetMint: PublicKey = receipt.side === 0 ? series.ptMint : series.ytMint
    const quoteMint: PublicKey = receipt.quoteMint
    const quoteMintInfo = await this.connection.getAccountInfo(quoteMint)
    if (!quoteMintInfo) throw new Error('Quote mint not found')
    const quoteProgram = quoteMintInfo.owner
    const assetProgram = TOKEN_2022_PROGRAM_ID

    const requester: PublicKey = receipt.requester
    const dealer: PublicKey = receipt.dealer
    const reqEscrow = this.escrowPda(receipt.series, requester, assetMint)
    const dlrEscrow = this.escrowPda(receipt.series, dealer, quoteMint)
    const requesterQuoteToken = getAssociatedTokenAddressSync(quoteMint, requester, false, quoteProgram)
    const dealerAssetToken = getAssociatedTokenAddressSync(assetMint, dealer, false, assetProgram)
    const allow = (w: PublicKey) =>
      PublicKey.findProgramAddressSync([Buffer.from('allow'), w.toBuffer()], this.programId)[0]

    const ix = await this.program.methods
      .executeFill()
      .accountsStrict({
        caller: this.crank.publicKey,
        requester,
        dealer,
        assetMint,
        quoteMint,
        assetTokenProgram: assetProgram,
        quoteTokenProgram: quoteProgram,
        fillReceipt: receiptPda,
        series: receipt.series,
        allowEntryRequester: allow(requester),
        allowEntryDealer: allow(dealer),
        requesterAssetEscrow: reqEscrow,
        requesterAssetEscrowToken: getAssociatedTokenAddressSync(assetMint, reqEscrow, true, assetProgram),
        dealerQuoteEscrow: dlrEscrow,
        dealerQuoteEscrowToken: getAssociatedTokenAddressSync(quoteMint, dlrEscrow, true, quoteProgram),
        requesterQuoteToken,
        dealerAssetToken,
      })
      .instruction()

    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(this.crank.publicKey, requesterQuoteToken, requester, quoteMint, quoteProgram),
      createAssociatedTokenAccountIdempotentInstruction(this.crank.publicKey, dealerAssetToken, dealer, assetMint, assetProgram),
      ix
    )
    // Preflight stays on: a failing fill surfaces its program error instead of a fake signature.
    return sendAndConfirmTransaction(this.connection, tx, [this.crank], { commitment: 'confirmed' })
  }
}
