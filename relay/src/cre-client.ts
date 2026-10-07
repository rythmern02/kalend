import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import type { RoundBundle } from './store.js'

/**
 * Hands a sealed round to Chainlink CRE. The relay never decrypts anything: it forwards the
 * ciphertext bundle and later learns the outcome by reading FillReceipt from Solana.
 *
 * Mode on devnet today: `cre workflow simulate --broadcast` (local CRE simulator, real Solana
 * write through the CRE mock forwarder). This is NOT an enclave and the UI says so. A deployed
 * confidential workflow needs Confidential Workflows enrollment; until then the deployed-gateway
 * path is refused rather than faked.
 */

export interface TriggerResult {
  success: boolean
  status: 'written' | 'no_match' | 'cli_error' | 'not_configured'
  round_id: string
  fill_receipt?: string
  tx_status?: number | null
  receiver_status?: number | null
  reason?: string
  error?: string
}

const here = path.dirname(fileURLToPath(import.meta.url))
const CRE_ROOT = process.env.CRE_PROJECT_ROOT || path.resolve(here, '../../cre')
const CRE_BIN = process.env.CRE_BIN || path.join(os.homedir(), '.cre/bin/cre')
const SIM_TIMEOUT_MS = 5 * 60 * 1000

let authCache: { ok: boolean; at: number } | null = null

/** `cre whoami` (cached 60s): simulation needs a logged-in CLI or CRE_API_KEY. */
function creAuthenticated(): Promise<boolean> {
  if (authCache && Date.now() - authCache.at < 60_000) return Promise.resolve(authCache.ok)
  return new Promise((resolve) => {
    const child = spawn(CRE_BIN, ['whoami'], { cwd: CRE_ROOT, env: process.env })
    child.on('close', (code) => {
      authCache = { ok: code === 0, at: Date.now() }
      resolve(code === 0)
    })
    child.on('error', () => resolve(false))
  })
}

export async function creMode(): Promise<{ mode: 'simulator' | 'unavailable'; reason?: string }> {
  if (!fs.existsSync(CRE_BIN)) return { mode: 'unavailable', reason: `CRE CLI not found at ${CRE_BIN}` }
  if (!fs.existsSync(path.join(CRE_ROOT, '.env'))) return { mode: 'unavailable', reason: 'cre/.env missing' }
  if (!(await creAuthenticated())) return { mode: 'unavailable', reason: 'CRE CLI not logged in (run cre login)' }
  return { mode: 'simulator' }
}

/** Extract the handler's JSON string from the simulator output (last JSON object printed). */
function parseHandlerResult(stdout: string): any | null {
  const marker = stdout.lastIndexOf('Workflow Simulation Result')
  const tail = marker >= 0 ? stdout.slice(marker) : stdout
  const start = tail.indexOf('{')
  const quoted = tail.indexOf('"{')
  try {
    if (quoted >= 0 && (start < 0 || quoted < start)) {
      const end = tail.lastIndexOf('}"')
      return JSON.parse(JSON.parse(tail.slice(quoted, end + 2)))
    }
    if (start >= 0) return JSON.parse(tail.slice(start, tail.lastIndexOf('}') + 1))
  } catch {
    return null
  }
  return null
}

let queue: Promise<unknown> = Promise.resolve()

/** Serialized: one simulator run at a time (mirrors the 1-per-30s deployed trigger budget). */
export function triggerRfqWorkflow(bundle: RoundBundle): Promise<TriggerResult> {
  const run = queue.then(() => runSimulator(bundle))
  queue = run.catch(() => undefined)
  return run
}

async function runSimulator(bundle: RoundBundle): Promise<TriggerResult> {
  const m = await creMode()
  if (m.mode !== 'simulator') {
    return { success: false, status: 'not_configured', round_id: bundle.round_id, error: m.reason }
  }

  const payloadPath = path.join(os.tmpdir(), `kalend-round-${bundle.round_id}.json`)
  // Ciphertext only; deleted after the run.
  fs.writeFileSync(payloadPath, JSON.stringify(bundle), { mode: 0o600 })

  const args = [
    'workflow', 'simulate', './workflows/kalend-rfq',
    '--target', 'local-simulation',
    '--non-interactive',
    '--trigger-index', '0',
    '--http-payload', payloadPath,
    '--broadcast',
  ]

  try {
    const { code, stdout, stderr } = await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
      const child = spawn(CRE_BIN, args, { cwd: CRE_ROOT, env: process.env })
      let stdout = ''
      let stderr = ''
      const timer = setTimeout(() => child.kill('SIGKILL'), SIM_TIMEOUT_MS)
      child.stdout.on('data', (d) => (stdout += d))
      child.stderr.on('data', (d) => (stderr += d))
      child.on('close', (c) => {
        clearTimeout(timer)
        resolve({ code: c ?? 1, stdout, stderr })
      })
    })

    const result = parseHandlerResult(stdout)
    if (code !== 0 || !result) {
      // Log only the tail of CLI diagnostics; the simulator never prints order plaintext.
      const tail = (stderr || stdout).split('\n').filter(Boolean).slice(-6).join(' | ')
      return { success: false, status: 'cli_error', round_id: bundle.round_id, error: tail || `cre exited ${code}` }
    }
    if (result.status === 'no_match') {
      return { success: false, status: 'no_match', round_id: bundle.round_id, reason: result.reason }
    }
    return {
      success: result.tx_status === 2 && result.receiver_status === 0,
      status: 'written',
      round_id: bundle.round_id,
      fill_receipt: result.fill_receipt,
      tx_status: result.tx_status,
      receiver_status: result.receiver_status,
      error: result.tx_status === 2 ? undefined : 'Solana write did not succeed (see tx_status)',
    }
  } finally {
    fs.rmSync(payloadPath, { force: true })
  }
}
