import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { Connection, PublicKey } from '@solana/web3.js'
import { store, type SealedEnvelope } from './store.js'
import { creClient } from './cre-client.js'
import { solanaWatcher } from './solana-watcher.js'
import { AltCrankWorker } from './alt-crank.js'
import crypto from 'crypto'

const app = new Hono()

const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const programIdStr = process.env.PROGRAM_ID || 'Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527'
const altCrank = new AltCrankWorker({
  connection: new Connection(rpcUrl, 'confirmed'),
  programId: new PublicKey(programIdStr),
  store,
})
altCrank.start(4000)

// Enable CORS for frontend
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Helper: evaluate operational mode dynamically from environment checks
function getRelayOperationalStatus() {
  const isLiveGateway = Boolean(process.env.CRE_GATEWAY_URL && process.env.CRE_GATEWAY_JWT)
  const isSimAllowed =
    process.env.KALEND_ALLOW_SIMULATION === '1' || process.env.RELAY_ALLOW_SIMULATION === '1'

  const mode: 'production' | 'simulation' | 'degraded' = isLiveGateway
    ? 'production'
    : isSimAllowed
      ? 'simulation'
      : 'degraded'

  return {
    isLiveGateway,
    isSimAllowed,
    mode,
    status: mode === 'degraded' ? 'degraded' : 'ok',
  }
}

// Healthcheck & Operational Status
app.get('/health', (c) => {
  const op = getRelayOperationalStatus()

  return c.json({
    status: op.status,
    service: 'kalend-relay',
    version: '1.1.0',
    mode: op.mode,
    simulation_allowed: op.isSimAllowed,
    cre_gateway: {
      configured: op.isLiveGateway,
      url: process.env.CRE_GATEWAY_URL || null,
    },
    enclave: {
      key_hash:
        process.env.ENCLAVE_KEY_HASH ||
        'a1ec4ad5c6a287e156ae4260c1602ffed192df3fd89c7b6376a268289bb7e703',
      kid: 'kid-2026-v1',
      hardware: op.isLiveGateway
        ? 'AWS Nitro Enclave (us-west-2)'
        : 'Local Nitro Enclave Simulator (WASM/QuickJS)',
    },
    chain: {
      cluster: 'solana-devnet',
      program_id: programIdStr,
      rpc: rpcUrl,
    },
    disclosures: [
      'Decision 1: Enclave matches quotes confidentially; on-chain settlement splits and escrow payouts are visible upon leaving escrow on Solana.',
      'Decision 2: Plain mode requires explicit confirmation; no silent fallback to plaintext.',
      'Decision 3: USDY represented by test mint on Devnet; index set manually/oracle.',
      'Decision 4: Equities deferred from active RFQ trading; 1,190 Backpack securities verified via /api/v1/securities preview only.',
    ],
    timestamp: Math.floor(Date.now() / 1000),
  })
})

// 1. Create a new RFQ Round
app.post('/rfq/rounds', async (c) => {
  const op = getRelayOperationalStatus()
  if (!op.isLiveGateway && !op.isSimAllowed) {
    return c.json(
      {
        error:
          'Fail Closed Guard: Chainlink CRE live gateway credentials missing and simulation flag KALEND_ALLOW_SIMULATION != 1. Refusing to create unverified RFQ rounds.',
        code: 'FAIL_CLOSED',
      },
      503
    )
  }

  const body = await c.req.json().catch(() => ({}))
  const series = body.series
  if (!series) {
    return c.json({ error: 'Missing series pubkey' }, 400)
  }

  const roundId = crypto.randomBytes(32).toString('hex')
  const kid = body.kid || 'kid-2026-v1'
  const duration = typeof body.duration === 'number' ? body.duration : 30

  const round = store.createRound(roundId, series, kid, duration)
  console.log(`[Relay] Opened new RFQ round ${roundId} for series ${series} (window: ${duration}s)`)

  // Automatically trigger round close & matching when window expires
  setTimeout(async () => {
    const currentRound = store.getRound(roundId)
    if (currentRound && currentRound.status === 'open') {
      console.log(`[Relay] Round window expired for ${roundId}, sealing and triggering matching...`)
      store.updateRoundStatus(roundId, 'sealed')
      const result = await creClient.triggerRfqWorkflow({
        kid: currentRound.kid,
        round_id: currentRound.round_id,
        series: currentRound.series,
        requests: currentRound.requests,
        quotes: currentRound.quotes,
      })
      store.updateRoundStatus(roundId, result.success ? 'submitted' : 'open', {
        error: result.error,
      })
      solanaWatcher.startWatchingRound(roundId)
    }
  }, duration * 1000)

  return c.json({ success: true, round })
})

// 2. List all rounds
app.get('/rfq/rounds', (c) => {
  return c.json({ rounds: store.listRounds() })
})

// 3. Get single round
app.get('/rfq/rounds/:id', (c) => {
  const round = store.getRound(c.req.param('id'))
  if (!round) {
    return c.json({ error: 'Round not found' }, 404)
  }
  return c.json({ round })
})

// 4. Submit Sealed Request Ciphertext
app.post('/rfq/request', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { round_id, enc, ciphertext, kid } = body

  if (!round_id || !enc || !ciphertext || !kid) {
    return c.json({ error: 'Missing required sealed envelope fields: round_id, enc, ciphertext, kid' }, 400)
  }

  const success = store.addRequest(round_id, { enc, ciphertext, kid })
  if (!success) {
    return c.json({ error: 'Failed to add request (round not found, closed, or payload too large)' }, 400)
  }

  console.log(`[Relay] Accepted sealed request ciphertext for round ${round_id} (enc len: ${enc.length}, ct len: ${ciphertext.length})`)
  return c.json({ success: true, round_id })
})

// 5. Submit Sealed Quote Ciphertext
app.post('/rfq/quote', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { round_id, enc, ciphertext, kid } = body

  if (!round_id || !enc || !ciphertext || !kid) {
    return c.json({ error: 'Missing required sealed envelope fields: round_id, enc, ciphertext, kid' }, 400)
  }

  const success = store.addQuote(round_id, { enc, ciphertext, kid })
  if (!success) {
    return c.json({ error: 'Failed to add quote (round not found, closed, or payload too large)' }, 400)
  }

  console.log(`[Relay] Accepted sealed quote ciphertext for round ${round_id} (enc len: ${enc.length}, ct len: ${ciphertext.length})`)
  return c.json({ success: true, round_id })
})

// 6. Manual Trigger for an RFQ round
app.post('/rfq/rounds/:id/trigger', async (c) => {
  const op = getRelayOperationalStatus()
  if (!op.isLiveGateway && !op.isSimAllowed) {
    return c.json(
      {
        error:
          'Fail Closed Guard: Chainlink CRE live gateway credentials missing and simulation flag KALEND_ALLOW_SIMULATION != 1. Refusing to trigger unverified matching.',
        code: 'FAIL_CLOSED',
      },
      503
    )
  }

  const roundId = c.req.param('id')
  const round = store.getRound(roundId)

  if (!round) {
    return c.json({ error: 'Round not found' }, 404)
  }

  store.updateRoundStatus(roundId, 'sealed')
  console.log(`[Relay] Manually triggered matching for round ${roundId}...`)

  const result = await creClient.triggerRfqWorkflow({
    kid: round.kid,
    round_id: round.round_id,
    series: round.series,
    requests: round.requests,
    quotes: round.quotes,
  })

  store.updateRoundStatus(roundId, result.success ? 'submitted' : 'open', {
    error: result.error,
  })

  solanaWatcher.startWatchingRound(roundId)

  return c.json({ success: result.success, result })
})

// 7. Execute Fill Phase 2 Crank Endpoint via Address Lookup Table (ALT)
app.post('/rfq/rounds/:id/execute-fill', async (c) => {
  const roundId = c.req.param('id')
  const round = store.getRound(roundId)
  if (!round || !round.fill_receipt) {
    return c.json({ error: 'Round or fill_receipt not found' }, 404)
  }

  const txSig = await altCrank.executeFillWithAlt(roundId, round.fill_receipt)
  return c.json({ success: true, round_id: roundId, tx_hash: txSig })
})

// 8. Server-Sent Events (SSE) Stream for Frontend
app.get('/rfq/events', (c) => {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()

        // Send initial connect message
        controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`))

        // Subscribe to store events
        const unsubscribe = store.subscribe((event) => {
          try {
            const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch {
            // Stream closed
          }
        })

        // Heartbeat keep-alive every 15s
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          } catch {
            clearInterval(heartbeat)
            unsubscribe()
          }
        }, 15000)
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    }
  )
})

const port = Number(process.env.PORT) || 3001
console.log(`[Relay] Kalend Sealed RFQ Relay starting on port ${port}...`)
serve({ fetch: app.fetch, port })
