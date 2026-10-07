import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { Keypair, PublicKey } from '@solana/web3.js'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { store, type RfqRound } from './store.js'
import { triggerRfqWorkflow, creMode } from './cre-client.js'
import { KalendChain } from './chain.js'

/**
 * Kalend relay: a liveness and censorship point, not a confidentiality point.
 * It stores ciphertext, schedules rounds, hands bundles to CRE and cranks execute_fill.
 * It cannot read orders and cannot choose where a fill pays out.
 */

const app = new Hono()
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const KID = process.env.ENCLAVE_KID || 'kid-2026-10-07'
const MAX_WINDOW_SECS = 600

function loadCrank(): Keypair | null {
  const p = process.env.KALEND_CRANK_KEYPAIR || path.join(os.homedir(), '.config/solana/kalend-crank.json')
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, 'utf-8'))))
  } catch {
    console.warn('[relay] no crank keypair; execute_fill must be called from the UI')
    return null
  }
}

const chain = new KalendChain(rpcUrl, loadCrank())

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['Content-Type'] }))

function isPubkey(s: unknown): s is string {
  try {
    return typeof s === 'string' && new PublicKey(s).toBase58() === s
  } catch {
    return false
  }
}

/** Public view of a round: counts, never ciphertext bodies. */
function view(r: RfqRound) {
  return {
    round_id: r.round_id,
    series: r.series,
    kid: r.kid,
    status: r.status,
    window_end: r.window_end,
    created_at: r.created_at,
    request_count: r.requests.length,
    quote_count: r.quotes.length,
    fill_receipt: r.fill_receipt,
    execute_tx: r.execute_tx,
    error: r.error,
  }
}

app.get('/health', async (c) => {
  const cre = await creMode()
  return c.json({
    status: cre.mode === 'simulator' ? 'ok' : 'degraded',
    service: 'kalend-relay',
    cre: {
      mode: cre.mode,
      detail:
        cre.mode === 'simulator'
          ? 'Chainlink CRE local simulator with --broadcast (mock forwarder). Not an enclave.'
          : cre.reason,
    },
    enclave_kid: KID,
    crank: chain.crank?.publicKey.toBase58() ?? null,
    chain: { cluster: 'devnet', program_id: chain.programId.toBase58(), rpc: rpcUrl },
    timestamp: Math.floor(Date.now() / 1000),
  })
})

/** Poll Solana for the round's FillReceipt; the chain, not the relay, decides the outcome. */
async function watchForReceipt(roundId: string, attempts = 45): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const receipt = await chain.getFillReceipt(roundId).catch(() => null)
    if (receipt) {
      store.updateRoundStatus(roundId, receipt.status === 'Executed' ? 'executed' : 'approved', {
        fill_receipt: receipt.address,
      })
      if (receipt.status === 'Approved' && chain.crank) await crankExecute(roundId)
      return
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
}

async function crankExecute(roundId: string): Promise<{ ok: boolean; tx?: string; error?: string }> {
  try {
    const tx = await chain.executeFill(roundId)
    store.updateRoundStatus(roundId, 'executed', { execute_tx: tx })
    console.log(`[relay] execute_fill landed for round ${roundId.slice(0, 8)}: ${tx}`)
    return { ok: true, tx }
  } catch (err: any) {
    const msg = String(err?.message || err).slice(0, 400)
    // Stay 'approved': anyone can retry execute_fill later.
    store.updateRoundStatus(roundId, 'approved', { error: `execute_fill failed: ${msg}` })
    console.warn(`[relay] execute_fill failed for round ${roundId.slice(0, 8)}: ${msg}`)
    return { ok: false, error: msg }
  }
}

async function closeAndTrigger(roundId: string) {
  const round = store.getRound(roundId)
  if (!round || round.status !== 'open') return { success: false, error: 'Round not open' }
  store.updateRoundStatus(roundId, 'sealed')
  console.log(`[relay] round ${roundId.slice(0, 8)} sealed: ${round.requests.length} req / ${round.quotes.length} quotes`)

  const result = await triggerRfqWorkflow({
    kid: round.kid,
    round_id: round.round_id,
    series: round.series,
    requests: round.requests,
    quotes: round.quotes,
  })

  if (result.status === 'no_match') {
    store.updateRoundStatus(roundId, 'no_match', { error: `No fill: ${result.reason}` })
  } else if (result.status === 'written') {
    // The CLI's confirmation can time out under RPC rate limits even when the write landed,
    // so the FillReceipt account decides; mark failed only if it never appears.
    await watchForReceipt(roundId)
    if (!(await chain.getFillReceipt(roundId).catch(() => null))) {
      store.updateRoundStatus(roundId, 'failed', { error: `No FillReceipt on-chain (CRE tx_status ${result.tx_status})` })
    }
  } else {
    store.updateRoundStatus(roundId, 'failed', { error: result.error || result.status })
  }
  return result
}

function scheduleClose(round: RfqRound) {
  const ms = Math.max(0, round.window_end * 1000 - Date.now())
  setTimeout(() => {
    closeAndTrigger(round.round_id).catch((e) => console.error('[relay] trigger error', e))
  }, ms)
}

app.post('/rfq/rounds', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!isPubkey(body.series)) return c.json({ error: 'series must be a base58 Series address' }, 400)
  const duration = Math.min(Math.max(Number(body.duration) || 120, 15), MAX_WINDOW_SECS)
  const roundId = crypto.randomBytes(32).toString('hex')
  const round = store.createRound(roundId, body.series, KID, duration)
  scheduleClose(round)
  return c.json({ success: true, round: view(round) })
})

app.get('/rfq/rounds', (c) => c.json({ rounds: store.listRounds().map(view) }))

app.get('/rfq/rounds/:id', (c) => {
  const round = store.getRound(c.req.param('id'))
  return round ? c.json({ round: view(round) }) : c.json({ error: 'Round not found' }, 404)
})

function intake(kind: 'request' | 'quote') {
  return async (c: any) => {
    const body = await c.req.json().catch(() => ({}))
    const { round_id, enc, ciphertext, kid } = body
    if (!round_id || !enc || !ciphertext || !kid) {
      return c.json({ error: 'Missing sealed envelope fields: round_id, enc, ciphertext, kid' }, 400)
    }
    if (kid !== KID) return c.json({ error: `Unknown kid; current enclave key is ${KID}` }, 400)
    const ok = kind === 'request'
      ? store.addRequest(round_id, { enc, ciphertext, kid })
      : store.addQuote(round_id, { enc, ciphertext, kid })
    if (!ok) return c.json({ error: 'Round not found, closed, or envelope too large' }, 400)
    return c.json({ success: true, round_id })
  }
}

app.post('/rfq/request', intake('request'))
app.post('/rfq/quote', intake('quote'))

// Close the window early and hand the bundle to CRE.
app.post('/rfq/rounds/:id/trigger', async (c) => {
  const id = c.req.param('id')
  if (!store.getRound(id)) return c.json({ error: 'Round not found' }, 404)
  const result = await closeAndTrigger(id)
  return c.json({ result, round: view(store.getRound(id)!) })
})

// Permissionless phase 2; the UI can also call execute_fill directly from a wallet.
app.post('/rfq/rounds/:id/execute-fill', async (c) => {
  const id = c.req.param('id')
  const res = await crankExecute(id)
  return c.json(res, res.ok ? 200 : 400)
})

// Fill receipts straight from Solana (getProgramAccounts on FillReceipt).
app.get('/rfq/receipts', async (c) => {
  try {
    return c.json(await chain.listFillReceipts())
  } catch (err: any) {
    return c.json({ error: `RPC error: ${String(err?.message || err).slice(0, 200)}` }, 502)
  }
})

app.get('/rfq/events', () => {
  let cleanup = () => {}
  return new Response(
    new ReadableStream({
      start(controller) {
        const enc = new TextEncoder()
        const send = (s: string) => {
          try {
            controller.enqueue(enc.encode(s))
          } catch {
            cleanup()
          }
        }
        send(`event: connected\ndata: {}\n\n`)
        const unsubscribe = store.subscribe((e) => send(`event: ${e.type}\ndata: ${JSON.stringify(view(e.data))}\n\n`))
        const hb = setInterval(() => send(`: heartbeat\n\n`), 15000)
        cleanup = () => {
          clearInterval(hb)
          unsubscribe()
        }
      },
      cancel() {
        cleanup()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } }
  )
})

const port = Number(process.env.PORT || process.env.RELAY_PORT) || 3001
creMode().then((m) => console.log(`[relay] listening on :${port} · CRE ${m.mode}${m.reason ? ` (${m.reason})` : ''} · program ${chain.programId.toBase58()}`))
serve({ fetch: app.fetch, port })
