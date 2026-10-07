export interface SealedEnvelope {
  enc: string // hex
  ciphertext: string // hex
  kid: string
}

export interface RfqRound {
  round_id: string // hex
  series: string
  kid: string
  // open -> sealed (sent to CRE) -> approved (FillReceipt on-chain) -> executed (execute_fill landed)
  // or no_match / failed. 'approved' and 'executed' are only set from chain reads.
  status: 'open' | 'sealed' | 'approved' | 'executed' | 'no_match' | 'failed'
  window_end: number
  created_at: number
  requests: SealedEnvelope[]
  quotes: SealedEnvelope[]
  fill_receipt?: string
  tx_hash?: string
  error?: string
  execute_tx?: string
}

export interface RoundBundle {
  kid: string
  round_id: string
  series: string
  requests: SealedEnvelope[]
  quotes: SealedEnvelope[]
}

export type EventListener = (event: { type: string; data: any }) => void

export class RelayStore {
  private rounds: Map<string, RfqRound> = new Map()
  private listeners: Set<EventListener> = new Set()

  createRound(roundId: string, series: string, kid: string, durationSeconds: number = 30): RfqRound {
    const now = Math.floor(Date.now() / 1000)
    const round: RfqRound = {
      round_id: roundId,
      series,
      kid,
      status: 'open',
      window_end: now + durationSeconds,
      created_at: now,
      requests: [],
      quotes: [],
    }
    this.rounds.set(roundId, round)
    this.broadcast({ type: 'round_created', data: round })
    return round
  }

  getRound(roundId: string): RfqRound | undefined {
    return this.rounds.get(roundId)
  }

  listRounds(): RfqRound[] {
    return Array.from(this.rounds.values()).sort((a, b) => b.created_at - a.created_at)
  }

  addRequest(roundId: string, envelope: SealedEnvelope): boolean {
    const round = this.rounds.get(roundId)
    if (!round || round.status !== 'open') return false

    // Size limit check on ciphertext (prevent payload flood)
    if (envelope.ciphertext.length > 8192) return false

    round.requests.push(envelope)
    this.broadcast({
      type: 'request_added',
      data: { round_id: roundId, request_count: round.requests.length },
    })
    return true
  }

  addQuote(roundId: string, envelope: SealedEnvelope): boolean {
    const round = this.rounds.get(roundId)
    if (!round || round.status !== 'open') return false

    if (envelope.ciphertext.length > 8192) return false

    round.quotes.push(envelope)
    this.broadcast({
      type: 'quote_added',
      data: { round_id: roundId, quote_count: round.quotes.length },
    })
    return true
  }

  updateRoundStatus(
    roundId: string,
    status: RfqRound['status'],
    details?: { fill_receipt?: string; tx_hash?: string; execute_tx?: string; error?: string }
  ): boolean {
    const round = this.rounds.get(roundId)
    if (!round) return false

    round.status = status
    if (details?.fill_receipt) round.fill_receipt = details.fill_receipt
    if (details?.tx_hash) round.tx_hash = details.tx_hash
    if (details?.error) round.error = details.error
    if (details?.execute_tx) round.execute_tx = details.execute_tx

    this.broadcast({ type: 'round_updated', data: round })
    return true
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  broadcast(event: { type: string; data: any }): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (err) {
        console.error('Error delivering event to listener:', err)
      }
    }
  }
}

export const store = new RelayStore()
