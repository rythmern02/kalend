import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { store } from './store.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

export class SolanaWatcher {
  private connection: Connection
  private programId: PublicKey
  private provider?: AnchorProvider
  private program?: Program

  constructor(
    rpcUrl: string = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    programIdStr: string = process.env.PROGRAM_ID || 'Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527'
  ) {
    this.connection = new Connection(rpcUrl, 'confirmed')
    this.programId = new PublicKey(programIdStr)

    try {
      const keypairPath =
        process.env.SOLANA_KEYPAIR || path.join(os.homedir(), '.config/solana/civitas-deployer.json')
      if (fs.existsSync(keypairPath)) {
        const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))
        const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey))
        this.provider = new AnchorProvider(this.connection, new Wallet(keypair), {
          commitment: 'confirmed',
        })

        const idlPath = path.resolve(process.cwd(), 'target/idl/kalend.json')
        if (fs.existsSync(idlPath)) {
          const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'))
          this.program = new Program(idl, this.provider)
        }
      }
    } catch (err) {
      console.warn('[SolanaWatcher] Warning: could not initialize Anchor provider:', err)
    }
  }

  deriveFillReceiptPda(roundIdBytes: Uint8Array): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('fill'), roundIdBytes],
      this.programId
    )
    return pda
  }

  async checkFillReceipt(roundIdHex: string): Promise<{ exists: boolean; status?: number; data?: any }> {
    const roundIdBytes = Buffer.from(roundIdHex, 'hex')
    const pda = this.deriveFillReceiptPda(roundIdBytes)

    try {
      const accountInfo = await this.connection.getAccountInfo(pda)
      if (!accountInfo) {
        return { exists: false }
      }

      if (this.program) {
        const receipt = await (this.program.account as any).fillReceipt.fetch(pda)
        return { exists: true, status: receipt.status, data: receipt }
      }

      return { exists: true }
    } catch {
      return { exists: false }
    }
  }

  /**
   * Watch a round for FillReceipt creation on Solana
   */
  startWatchingRound(roundIdHex: string, maxAttempts: number = 30): void {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      const result = await this.checkFillReceipt(roundIdHex)
      if (result.exists) {
        clearInterval(interval)
        console.log(`[SolanaWatcher] FillReceipt confirmed onchain for round ${roundIdHex}! Status: ${result.status}`)
        store.updateRoundStatus(roundIdHex, result.status === 2 ? 'executed' : 'approved', {
          fill_receipt: this.deriveFillReceiptPda(Buffer.from(roundIdHex, 'hex')).toBase58(),
        })
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }, 2000)
  }
}

export const solanaWatcher = new SolanaWatcher()
