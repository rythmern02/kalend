/**
 * Demo fixtures on devnet (idempotent per run; writes .demo/demo.json, gitignored):
 *   - TEST collateral + TEST quote mints (6 dp), clearly labeled as test mints
 *   - LONG series (30 days) for the sealed RFQ, SHORT series maturing in SHORT_MINUTES for a live settle
 *   - requester + dealer devnet wallets, funded with 0.3 SOL, allowlisted, given test tokens
 *
 * Index: both series are StakePoolRate on the devnet SPL stake pool; the program reads idx_open
 * itself. The pool moves once per epoch, so a series that crosses no epoch settles with 0 YT yield.
 *
 *   npx tsx scripts/setup_demo.ts [SHORT_MINUTES=12]
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint,
  getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo,
} from '@solana/spl-token'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const conn = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed')
const authority = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/solana/civitas-deployer.json'), 'utf8')))
)
const program = new Program(
  JSON.parse(fs.readFileSync(path.join(root, 'target/idl/kalend.json'), 'utf8')),
  new AnchorProvider(conn, new Wallet(authority), { commitment: 'confirmed' })
)
const PID = program.programId
const STAKE_POOL = new PublicKey('HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f')
const pda = (...s: Buffer[]) => PublicKey.findProgramAddressSync(s, PID)[0]
const configPda = pda(Buffer.from('config'))
const registryPda = pda(Buffer.from('registry'))
const ALL_ROLES = 1 | 2 | 4 | 8 | 16

process.on('unhandledRejection', (e: any) => console.warn(`  (rpc) ${String(e?.message ?? e).slice(0, 80)}`))

async function openSeries(collateralMint: PublicKey, quoteMint: PublicKey, maturityTs: number) {
  const nonce = Math.floor(Math.random() * 60000)
  const m = Buffer.alloc(8); m.writeBigInt64LE(BigInt(maturityTs))
  const n = Buffer.alloc(2); n.writeUInt16LE(nonce)
  const series = pda(Buffer.from('series'), collateralMint.toBuffer(), m, n)
  const pt = Keypair.generate(), yt = Keypair.generate()
  const sig = await program.methods
    .openSeries(new BN(maturityTs), nonce, 0, STAKE_POOL, new BN('1000000000000000000'), 0, 2000, 0, false)
    .accountsPartial({
      config: configPda, registry: registryPda, series, collateralMint, collateralTokenProgram: TOKEN_PROGRAM_ID,
      quoteMint, ptMint: pt.publicKey, ytMint: yt.publicKey,
      vault: getAssociatedTokenAddressSync(collateralMint, series, true, TOKEN_PROGRAM_ID),
      authority: authority.publicKey, token2022Program: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
    })
    .remainingAccounts([{ pubkey: STAKE_POOL, isSigner: false, isWritable: false }])
    .signers([pt, yt])
    .rpc()
  return { series: series.toBase58(), pt_mint: pt.publicKey.toBase58(), yt_mint: yt.publicKey.toBase58(), maturity_ts: maturityTs, open_tx: sig }
}

async function main() {
  const shortMinutes = Number(process.argv[2] ?? 12)
  const dir = path.join(root, '.demo')
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })

  console.log('Creating TEST mints…')
  const collateralMint = await createMint(conn, authority, authority.publicKey, null, 6, undefined, undefined, TOKEN_PROGRAM_ID)
  const quoteMint = await createMint(conn, authority, authority.publicKey, null, 6, undefined, undefined, TOKEN_PROGRAM_ID)

  const now = Math.floor(Date.now() / 1000)
  console.log('Opening LONG (30d) and SHORT series…')
  const long = await openSeries(collateralMint, quoteMint, now + 30 * 86400)
  const short = await openSeries(collateralMint, quoteMint, now + shortMinutes * 60)

  const wallets: Record<string, Keypair> = { requester: Keypair.generate(), dealer: Keypair.generate() }
  console.log('Funding + allowlisting wallets…')
  await sendAndConfirmTransaction(conn, new Transaction().add(
    ...Object.values(wallets).map((w) => SystemProgram.transfer({ fromPubkey: authority.publicKey, toPubkey: w.publicKey, lamports: 300_000_000 }))
  ), [authority])
  const expiry = new BN(now + 30 * 86400)
  for (const w of Object.values(wallets)) {
    await program.methods.setAllowEntry(w.publicKey, ALL_ROLES, expiry)
      .accountsPartial({ config: configPda, allowEntry: pda(Buffer.from('allow'), w.publicKey.toBuffer()), authority: authority.publicKey, systemProgram: SystemProgram.programId })
      .rpc()
  }

  console.log('Minting test tokens…')
  const rc = await getOrCreateAssociatedTokenAccount(conn, authority, collateralMint, wallets.requester.publicKey)
  await mintTo(conn, authority, collateralMint, rc.address, authority, 10_000_000)
  const dq = await getOrCreateAssociatedTokenAccount(conn, authority, quoteMint, wallets.dealer.publicKey)
  await mintTo(conn, authority, quoteMint, dq.address, authority, 10_000_000)

  for (const [name, kp] of Object.entries(wallets)) {
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 })
  }
  const out = {
    created_at: new Date().toISOString(),
    collateral_mint: collateralMint.toBase58(),
    quote_mint: quoteMint.toBase58(),
    long,
    short,
    requester: wallets.requester.publicKey.toBase58(),
    dealer: wallets.dealer.publicKey.toBase58(),
  }
  fs.writeFileSync(path.join(dir, 'demo.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
