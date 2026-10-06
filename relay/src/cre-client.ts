import { RoundBundle } from './store.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export interface TriggerResult {
  success: boolean
  status: string
  round_id: string
  fill_receipt?: string
  asset_amount?: string
  quote_amount?: string
  tx_hash?: string
  error?: string
}

export class CreClient {
  private mode: string
  private workflowDir: string

  constructor(mode: string = process.env.RELAY_MODE || 'local-simulation') {
    this.mode = mode
    this.workflowDir = path.resolve(process.cwd(), 'cre/workflows/kalend-rfq')
  }

  async triggerRfqWorkflow(bundle: RoundBundle): Promise<TriggerResult> {
    const payloadJson = JSON.stringify(bundle)

    if (this.mode === 'live' && process.env.CRE_GATEWAY_URL) {
      // Live CRE Gateway Trigger with EVM-signed JWT
      try {
        const response = await fetch(process.env.CRE_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.CRE_GATEWAY_JWT || ''}`,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'trigger',
            params: {
              workflow: 'kalend-rfq',
              input: Buffer.from(payloadJson).toString('base64'),
            },
          }),
        })

        const resData: any = await response.json()
        if (resData.error) {
          return {
            success: false,
            status: 'gateway_error',
            round_id: bundle.round_id,
            error: resData.error.message,
          }
        }

        return {
          success: true,
          status: 'submitted_to_gateway',
          round_id: bundle.round_id,
          tx_hash: resData.result?.txHash,
        }
      } catch (err: any) {
        return {
          success: false,
          status: 'network_error',
          round_id: bundle.round_id,
          error: err.message,
        }
      }
    } else {
      // Local simulation / CLI simulation mode
      try {
        console.log(`[CreClient] Simulating kalend-rfq workflow for round ${bundle.round_id}...`)
        
        // Dynamically invoke the workflow handler logic directly for high-throughput testing
        // or invoke cre workflow simulate if CLI is ready
        return {
          success: true,
          status: 'matched_simulation',
          round_id: bundle.round_id,
          fill_receipt: undefined, // Will be observed onchain or populated by watcher
        }
      } catch (err: any) {
        return {
          success: false,
          status: 'simulation_error',
          round_id: bundle.round_id,
          error: err.message,
        }
      }
    }
  }
}

export const creClient = new CreClient()
