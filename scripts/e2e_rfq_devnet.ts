/**
 * End-to-end sealed RFQ on Solana devnet, against the deployed program and a running relay.
 *
 *   strip -> lock escrows -> open round -> seal request + quote in "browser" code
 *   -> relay -> CRE simulator (--broadcast, mock forwarder) -> on_report -> FillReceipt
 *   -> execute_fill (relay crank) -> balances checked
 *
 * Run (relay must be up on :3001):
 *   NODE_PATH="cre/workflows/kalend-rfq/node_modules:scripts/node_modules" npx tsx scripts/e2e_rfq_devnet.ts
 *
 * Uses labeled TEST mints created by this script. Requester and dealer are fresh keypairs
 * funded from the deployer with a small amount of devnet SOL.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction,
} from '@solana/web3.js'
import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getAccount,
  getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo,
} from '@solana/spl-token'
import { ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js'
import { hpkeSeal } from '../packages/crypto/src/hpke.ts'

const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const RELAY = process.env.RELAY_URL || 'http://localhost:3001'
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const idl = JSON.parse(fs.readFileSync(path.join(root, 'target/idl/kalend.json'), 'utf8'))
const enclave = JSON.parse(fs.readFileSync(path.join(root, 'cre/enclave-public.json'), 'utf8'))

const STAKE_POOL = new PublicKey('HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f')
const ROLES = { STRIP: 1, REDEEM: 2, CLAIM: 4, REQUESTER: 8, DEALER: 16 }
const conn = new Connection(RPC, 'confirmed')
const authority = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/solana/civitas-deployer.json'), 'utf8')))
)
const programFor = (kp: Keypair) =>
  new Program(idl, new AnchorProvider(conn, new Wallet(kp), { commitment: 'confirmed' }))
const admin = programFor(authority)
const PID = admin.programId
const pda = (...seeds: Buffer[]) => PublicKey.findProgramAddressSync(seeds, PID)[0]
const configPda = pda(Buffer.from('config'))
const registryPda = pda(Buffer.from('registry'))
const allowPda = (w: PublicKey) => pda(Buffer.from('allow'), w.toBuffer())
const escrowPda = (s: PublicKey, o: PublicKey, m: PublicKey) =>
  pda(Buffer.from('escrow'), s.toBuffer(), o.toBuffer(), m.toBuffer())
const step = (s: string) => console.log(`\n▸ ${s}`)
const tx = (label: string, sig: string) => console.log(`  ✓ ${label}: https://explorer.solana.com/tx/${sig}?cluster=devnet`)

function sealOrder(roundId: string, domain: string, payload: object, signer: Keypair) {
  const digest = sha256(concatBytes(utf8ToBytes(domain), utf8ToBytes(JSON.stringify(payload))))
  const sig = ed25519.sign(digest, signer.secretKey.slice(0, 32))
  const env = { payload, sig: bytesToHex(sig), pubkey: bytesToHex(signer.publicKey.toBytes()) }
  const rid = hexToBytes(roundId)
  const kid = utf8ToBytes(enclave.kid)
  const { enc, ciphertext } = hpkeSeal(
    hexToBytes(enclave.public_key),
    concatBytes(utf8ToBytes('kalend/v1/rfq'), rid, kid),
    concatBytes(new Uint8Array([1, 1]), rid, kid),
    utf8ToBytes(JSON.stringify(env))
  )
  return { round_id: roundId, enc: bytesToHex(enc), ciphertext: bytesToHex(ciphertext), kid: enclave.kid }
}

async function post(p: string, body: object) {
  const r = await fetch(`${RELAY}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json()
  if (!r.ok) throw new Error(`${p}: ${JSON.stringify(j)}`)
  return j
}

async function main() {
  const health = await (await fetch(`${RELAY}/health`)).json()
  console.log(`Program ${PID.toBase58()} · relay CRE mode: ${health.cre.mode}`)
  if (health.cre.mode !== 'simulator') throw new Error(`Relay cannot reach CRE: ${health.cre.detail}`)

  step('Fund fresh requester + dealer wallets')
  const requester = Keypair.generate()
  const dealer = Keypair.generate()
  tx('fund', await sendAndConfirmTransaction(conn, new Transaction().add(
    SystemProgram.transfer({ fromPubkey: authority.publicKey, toPubkey: requester.publicKey, lamports: 30_000_000 }),
    SystemProgram.transfer({ fromPubkey: authority.publicKey, toPubkey: dealer.publicKey, lamports: 30_000_000 }),
  ), [authority]))

  step('Allowlist (authority-managed)')
  const expiry = new BN(Math.floor(Date.now() / 1000) + 86400 * 30)
  for (const [w, roles] of [[requester.publicKey, ROLES.STRIP | ROLES.REQUESTER | ROLES.REDEEM | ROLES.CLAIM], [dealer.publicKey, ROLES.DEALER]] as const) {
    tx(`allow ${w.toBase58().slice(0, 6)}`, await admin.methods.setAllowEntry(w, roles, expiry)
      .accountsPartial({ config: configPda, allowEntry: allowPda(w), authority: authority.publicKey, systemProgram: SystemProgram.programId })
      .rpc())
  }

  step('TEST mints + series (labeled test collateral, 6 dp)')
  const collateralMint = await createMint(conn, authority, authority.publicKey, null, 6, undefined, undefined, TOKEN_PROGRAM_ID)
  const quoteMint = await createMint(conn, authority, authority.publicKey, null, 6, undefined, undefined, TOKEN_PROGRAM_ID)
  const maturityTs = Math.floor(Date.now() / 1000) + 86400 * 30
  const nonce = Math.floor(Math.random() * 60000)
  const mBuf = Buffer.alloc(8); mBuf.writeBigInt64LE(BigInt(maturityTs))
  const nBuf = Buffer.alloc(2); nBuf.writeUInt16LE(nonce)
  const series = pda(Buffer.from('series'), collateralMint.toBuffer(), mBuf, nBuf)
  const pt = Keypair.generate(), yt = Keypair.generate()
  tx('open_series', await admin.methods
    // StakePoolRate: idx_open is read by the program from the devnet SPL stake pool (the 1.0
    // argument is ignored for this index kind).
    .openSeries(new BN(maturityTs), nonce, 0, STAKE_POOL, new BN('1000000000000000000'), 0, 2000, 0, false)
    .accountsPartial({
      config: configPda, registry: registryPda, series, collateralMint, collateralTokenProgram: TOKEN_PROGRAM_ID,
      quoteMint, ptMint: pt.publicKey, ytMint: yt.publicKey,
      vault: getAssociatedTokenAddressSync(collateralMint, series, true, TOKEN_PROGRAM_ID),
      authority: authority.publicKey, token2022Program: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
    })
    .remainingAccounts([{ pubkey: STAKE_POOL, isSigner: false, isWritable: false }])
    .signers([pt, yt]).rpc())
  console.log(`  series ${series.toBase58()}`)

  step('Requester strips 2.0 collateral -> 2.0 PT + 2.0 YT')
  const reqColl = await getOrCreateAssociatedTokenAccount(conn, authority, collateralMint, requester.publicKey)
  await mintTo(conn, authority, collateralMint, reqColl.address, authority, 2_000_000)
  const reqPt = getAssociatedTokenAddressSync(pt.publicKey, requester.publicKey, false, TOKEN_2022_PROGRAM_ID)
  const reqYt = getAssociatedTokenAddressSync(yt.publicKey, requester.publicKey, false, TOKEN_2022_PROGRAM_ID)
  const rProg = programFor(requester)
  const { createAssociatedTokenAccountIdempotentInstruction: ataIx } = await import('@solana/spl-token')
  const stripIx = await rProg.methods.strip(new BN(2_000_000)).accountsPartial({
    config: configPda, series, allowEntry: allowPda(requester.publicKey), collateralMint,
    ptMint: pt.publicKey, ytMint: yt.publicKey,
    vault: getAssociatedTokenAddressSync(collateralMint, series, true, TOKEN_PROGRAM_ID),
    userCollateral: reqColl.address, userPt: reqPt, userYt: reqYt, user: requester.publicKey,
    collateralTokenProgram: TOKEN_PROGRAM_ID, token2022Program: TOKEN_2022_PROGRAM_ID,
  }).instruction()
  tx('strip', await sendAndConfirmTransaction(conn, new Transaction().add(
    ataIx(requester.publicKey, reqPt, requester.publicKey, pt.publicKey, TOKEN_2022_PROGRAM_ID),
    ataIx(requester.publicKey, reqYt, requester.publicKey, yt.publicKey, TOKEN_2022_PROGRAM_ID),
    stripIx), [requester]))

  const lockUntil = new BN(Math.floor(Date.now() / 1000) + 900)
  const lock = async (who: Keypair, mint: PublicKey, prog: PublicKey, amount: number) => {
    const e = escrowPda(series, who.publicKey, mint)
    return programFor(who).methods.lockEscrow(new BN(amount), lockUntil).accountsPartial({
      config: configPda, series, allowEntry: allowPda(who.publicKey), escrow: e, mint,
      escrowToken: getAssociatedTokenAddressSync(mint, e, true, prog),
      ownerToken: getAssociatedTokenAddressSync(mint, who.publicKey, false, prog),
      owner: who.publicKey, tokenProgram: prog,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
    }).rpc()
  }

  step('Requester locks 1.0 PT; dealer locks a standard round amount (2.0) of quote')
  tx('lock PT', await lock(requester, pt.publicKey, TOKEN_2022_PROGRAM_ID, 1_000_000))
  const dlrQuote = await getOrCreateAssociatedTokenAccount(conn, authority, quoteMint, dealer.publicKey)
  await mintTo(conn, authority, quoteMint, dlrQuote.address, authority, 2_000_000)
  tx('lock quote', await lock(dealer, quoteMint, TOKEN_PROGRAM_ID, 2_000_000))

  step('Relay opens a round; orders are sealed client-side (HPKE RFC 9180) and wallet-signed')
  const { round } = await post('/rfq/rounds', { series: series.toBase58(), duration: 300 })
  const roundId: string = round.round_id
  const notAfter = Math.floor(Date.now() / 1000) + 600
  await post('/rfq/request', sealOrder(roundId, 'KALEND/v1/request', {
    v: 1, round_id: roundId, series: series.toBase58(), side: 'SellPT', size: '1000000', limit_price: '0.95',
    quote_mint: quoteMint.toBase58(), requester: requester.publicKey.toBase58(), nonce: 1, not_after: notAfter,
  }, requester))
  await post('/rfq/quote', sealOrder(roundId, 'KALEND/v1/quote', {
    v: 1, round_id: roundId, dealer: dealer.publicKey.toBase58(), price: '0.962', max_size: '1000000', nonce: 2, not_after: notAfter,
  }, dealer))
  console.log(`  round ${roundId.slice(0, 16)}… has 1 sealed request + 1 sealed quote (relay holds ciphertext only)`)

  step('Close round -> CRE simulator (--broadcast) -> on_report -> FillReceipt -> execute_fill')
  const t0 = Date.now()
  const trig = await post(`/rfq/rounds/${roundId}/trigger`, {})
  console.log(`  CRE result: ${JSON.stringify(trig.result)} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  const final = trig.round
  if (final.status !== 'executed') throw new Error(`Round ended as ${final.status}: ${final.error ?? ''}`)
  tx('execute_fill', final.execute_tx)
  console.log(`  FillReceipt: https://explorer.solana.com/address/${final.fill_receipt}?cluster=devnet`)

  step('Verify balances on-chain')
  const dealerPt = await getAccount(conn, getAssociatedTokenAddressSync(pt.publicKey, dealer.publicKey, false, TOKEN_2022_PROGRAM_ID), 'confirmed', TOKEN_2022_PROGRAM_ID)
  const reqQuote = await getAccount(conn, getAssociatedTokenAddressSync(quoteMint, requester.publicKey), 'confirmed', TOKEN_PROGRAM_ID)
  console.log(`  dealer PT = ${dealerPt.amount} (expect 1000000) · requester quote = ${reqQuote.amount} (expect 962000)`)
  if (dealerPt.amount !== 1_000_000n || reqQuote.amount !== 962_000n) throw new Error('Balance check failed')
  console.log('\n✅ Sealed RFQ end-to-end on devnet: PASS')
}

main().catch((e) => {
  console.error('\n❌ FAIL:', e.message ?? e)
  process.exit(1)
})
