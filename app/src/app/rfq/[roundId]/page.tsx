'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Clock, Lock, Cpu, Layers, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { Header } from '../../../components/Header'
import { ModeBar, useModeBarState } from '../../../components/ModeBar'
import { StatusChip } from '../../../components/StatusChip'
import { DataSourceTag } from '../../../components/DataSourceTag'
import { fetchRfqRound, fetchFillReceipt } from '../../../lib/api'
import { executeFill } from '../../../lib/kalend-client'
import { RELAY_API_URL } from '../../../lib/constants'
import { useWallet } from '../../../lib/wallet'

const explorer = (kind: 'tx' | 'address', id: string) => `https://explorer.solana.com/${kind}/${id}?cluster=devnet`
const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`

export default function RoundStatusPage() {
  const roundId = (useParams()?.roundId as string) ?? ''
  const modeBarState = useModeBarState()
  const wallet = useWallet()
  const qc = useQueryClient()
  const [busy, setBusy] = useState<'trigger' | 'execute' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [executeSig, setExecuteSig] = useState<string | null>(null)
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  const { data: round } = useQuery({
    queryKey: ['rfqRound', roundId],
    queryFn: () => fetchRfqRound(roundId),
    refetchInterval: 3000,
  })
  // The outcome is read from Solana, not from the relay.
  const { data: receipt } = useQuery({
    queryKey: ['fillReceipt', roundId],
    queryFn: () => fetchFillReceipt(roundId),
    refetchInterval: 4000,
    enabled: /^[0-9a-f]{64}$/.test(roundId),
  })

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  const status = receipt?.status === 'Executed' ? 'executed' : receipt ? 'approved' : round?.status ?? 'unknown'
  const stage = { open: 1, sealed: 2, approved: 4, executed: 5 }[status as string] ?? 0
  const secondsLeft = round ? Math.max(0, round.window_end - now) : 0

  const steps = [
    { label: 'Sealed', desc: 'Orders HPKE-sealed in the browser', icon: Lock },
    { label: 'Window open', desc: `${round?.request_count ?? 0} request · ${round?.quote_count ?? 0} quotes (ciphertext)`, icon: Clock },
    { label: 'CRE matching', desc: 'Workflow decrypts and picks best quote', icon: Cpu },
    { label: 'on_report', desc: 'FillReceipt written via forwarder', icon: Layers },
    { label: 'Executed', desc: 'execute_fill moved escrowed tokens', icon: CheckCircle2 },
  ]

  async function trigger() {
    setBusy('trigger')
    setActionError(null)
    try {
      const res = await fetch(`${RELAY_API_URL}/rfq/rounds/${roundId}/trigger`, { method: 'POST' })
      const j = await res.json()
      if (j.round?.status === 'failed' || j.round?.status === 'no_match') setActionError(j.round.error ?? j.round.status)
    } catch (e: any) {
      setActionError(`Relay unreachable: ${e.message}`)
    } finally {
      setBusy(null)
      qc.invalidateQueries({ queryKey: ['rfqRound', roundId] })
      qc.invalidateQueries({ queryKey: ['fillReceipt', roundId] })
    }
  }

  async function execute() {
    if (!wallet.connected) return wallet.setShowConnectModal(true)
    setBusy('execute')
    setActionError(null)
    try {
      setExecuteSig(await executeFill(wallet, roundId))
    } catch (e: any) {
      setActionError(e.message ?? String(e))
    } finally {
      setBusy(null)
      qc.invalidateQueries({ queryKey: ['fillReceipt', roundId] })
    }
  }

  const execTx = executeSig ?? round?.execute_tx

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/rfq/new" className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a8a8] hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New quote request</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-10 border-b border-[#222222] gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider">RFQ round</span>
              <StatusChip status={status.toUpperCase()} />
            </div>
            <h1 className="font-serif text-3xl font-medium text-white mb-1">Sealed round</h1>
            <p className="font-mono text-xs text-[#a8a8a8] break-all">{roundId}</p>
          </div>
          {round?.status === 'open' && (
            <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-[2px] font-mono text-xs sm:text-right shrink-0 space-y-2">
              <span className="text-[#737373] block uppercase text-[10px]">Window closes in</span>
              <span className="text-xl text-white block">
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
              <button
                onClick={trigger}
                disabled={busy !== null}
                className="w-full px-3 py-1.5 rounded-[2px] bg-white text-black font-semibold disabled:opacity-50"
              >
                {busy === 'trigger' ? 'Running CRE workflow…' : 'Close now and match'}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-xs text-[#737373] uppercase tracking-wider">Lifecycle</span>
            <DataSourceTag sourceName={receipt ? 'Solana FillReceipt account' : 'Relay scheduler'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {steps.map((st, idx) => {
              const Icon = st.icon
              const done = idx < stage
              const current = idx === stage && stage < 5
              return (
                <div
                  key={st.label}
                  className={`p-4 rounded-[3px] border ${
                    done ? 'bg-[#0c1f13] border-[#1b4329] text-[#4ade80]'
                      : current ? 'bg-[#151515] border-white text-white'
                      : 'bg-[#0a0a0a] border-[#1c1c1c] text-[#555]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {current && busy === 'trigger' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    <span className="font-mono text-[10px] uppercase">{done ? 'Done' : current ? 'Now' : 'Pending'}</span>
                  </div>
                  <span className="font-mono text-xs block mb-1">{st.label}</span>
                  <span className="text-[11px] text-[#a8a8a8] block leading-tight">{st.desc}</span>
                </div>
              )
            })}
          </div>
        </div>

        {(actionError || round?.error) && (
          <div className="p-4 mb-8 rounded-[2px] bg-[#1f0c0c] border border-[#4a1b1b] text-[#f87171] font-mono text-xs flex gap-2 break-words">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError ?? round?.error}</span>
          </div>
        )}

        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
          <h2 className="font-serif text-lg text-white mb-4">Fill (from chain)</h2>
          {receipt ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="Side" value={receipt.side} />
                <Field label="Asset amount (raw)" value={receipt.asset_amount} />
                <Field label="Quote amount (raw)" value={receipt.quote_amount} />
                <Field label="Status" value={receipt.status} accent={receipt.status === 'Executed'} />
                <Field label="Requester" value={short(receipt.requester)} />
                <Field label="Dealer" value={short(receipt.dealer)} />
                <Field label="Price" value={(Number(receipt.quote_amount) / Number(receipt.asset_amount)).toFixed(6)} />
                <Field label="Report hash" value={short(receipt.report_hash)} />
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={explorer('address', receipt.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-[2px] border border-[#333] hover:border-white">
                  FillReceipt account <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {execTx && (
                  <a href={explorer('tx', execTx)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-[2px] border border-[#1b4329] text-[#4ade80] hover:border-[#4ade80]">
                    execute_fill tx <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {receipt.status === 'Approved' && (
                  <button onClick={execute} disabled={busy !== null} className="px-3 py-2 rounded-[2px] bg-white text-black font-semibold disabled:opacity-50">
                    {busy === 'execute' ? 'Sending…' : 'Execute fill (permissionless)'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#737373] leading-relaxed">
                Only this fill left the matching step. Losing quotes and the requester's limit were never written anywhere.
              </p>
            </div>
          ) : (
            <p className="font-mono text-xs text-[#737373]">
              {status === 'no_match'
                ? 'No quote met the limit; nothing was written on-chain and escrows stay with their owners.'
                : status === 'failed'
                  ? 'The CRE run failed before writing; no FillReceipt exists for this round.'
                  : 'No FillReceipt for this round on Solana yet.'}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-3 bg-[#121212] border border-[#1e1e1e] rounded-[2px] min-w-0">
      <span className="text-[#737373] block mb-1 text-[10px] uppercase">{label}</span>
      <span className={`block truncate ${accent ? 'text-[#4ade80]' : 'text-white'}`}>{value}</span>
    </div>
  )
}
