'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '../../../components/Header'
import { ModeBar, useModeBarState } from '../../../components/ModeBar'
import { StatusChip } from '../../../components/StatusChip'
import { DataSourceTag } from '../../../components/DataSourceTag'
import { TiltCard } from '../../../components/TiltCard'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Cpu,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchRfqRound } from '../../../lib/api'
import { useWallet } from '../../../lib/wallet'

export default function RoundStatusPage() {
  const params = useParams()
  const roundId = params?.roundId as string
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  const { data: roundData, isLoading } = useQuery({
    queryKey: ['rfqRound', roundId],
    queryFn: () => fetchRfqRound(roundId),
    refetchInterval: 3000,
  })

  // Derive real stage from roundData.status
  // 'open' -> stage 1 (window open)
  // 'matching' -> stage 2 (matching in enclave)
  // 'settled' -> stage 4 (executed)
  // 'expired' / 'failed' -> error
  const stageMap: Record<string, number> = {
    open: 1,
    matching: 2,
    settled: 4,
    expired: 0,
    failed: 0,
  }

  const currentStage = roundData ? (stageMap[roundData.status] ?? 1) : 1
  const notAfter = roundData?.not_after ? roundData.not_after * 1000 : Date.now() + 180000
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.max(0, Math.floor((notAfter - Date.now()) / 1000))
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(Math.max(0, Math.floor((notAfter - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [notAfter])

  const steps = [
    { label: 'Sealed', desc: 'HPKE ciphertext submitted', icon: Lock },
    { label: 'Window Open', desc: `${roundData?.quote_count ?? 0} quotes received`, icon: Clock },
    { label: 'Enclave Matching', desc: 'Knapsack waterfall in TEE', icon: Cpu },
    { label: 'Solana CPI', desc: 'Keystone forwarder write', icon: Layers },
    { label: 'Executed', desc: 'Atomic escrow swap finalized', icon: CheckCircle2 },
  ]

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/rfq/new"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a8a8] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>New Quote Request</span>
        </Link>

        {/* Round Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-10 border-b border-[#222222] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider">
                RFQ Round Lifecycle
              </span>
              <StatusChip status={roundData ? roundData.status.toUpperCase() : 'PENDING'} />
            </div>
            <h1 className="font-serif text-3xl font-medium text-white mb-1">
              Round Execution Audit
            </h1>
            <p className="font-mono text-xs text-[#a8a8a8] truncate max-w-lg">
              Round ID: {roundId}
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-[2px] font-mono text-xs text-right shrink-0">
            <span className="text-[#737373] block mb-1 uppercase text-[10px]">
              Auction Window Remaining
            </span>
            <span className="text-xl font-medium text-white font-mono">{formatTimer(secondsRemaining)}</span>
          </div>
        </div>

        {/* Timeline Stepper */}
        <TiltCard accent="default" intensity={3} enableGlare={false} className="mb-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-xs text-[#737373] uppercase tracking-wider block">
                Execution Lifecycle
              </span>
              <DataSourceTag sourceName="Relay Real-Time Telemetry" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {steps.map((st, idx) => {
                const Icon = st.icon
                const isPast = idx < currentStage
                const isCurrent = idx === currentStage
                return (
                  <div
                    key={st.label}
                    className={`p-4 rounded-[3px] border transition-all ${
                      isCurrent
                        ? 'bg-[#151515] border-white text-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)]'
                        : isPast
                        ? 'bg-[#0c1f13] border-[#1b4329] text-[#4ade80]'
                        : 'bg-[#0a0a0a] border-[#1c1c1c] text-[#555]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-mono text-[10px] uppercase font-semibold">
                        {isPast ? 'Done' : isCurrent ? 'Active' : 'Pending'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-medium block mb-1">
                      {st.label}
                    </span>
                    <span className="text-[11px] text-[#a8a8a8] block leading-tight">
                      {st.desc}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </TiltCard>

        {/* Execution Results Summary */}
        <TiltCard accent={roundData?.status === 'settled' ? 'emerald' : 'default'} intensity={4} enableGlare={true} className="mb-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1c1c1c]">
              <h2 className="font-serif text-lg text-white font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                Enclave Match Results (Blended Fill)
              </h2>
              <div className="text-[11px] font-mono text-[#a8a8a8] bg-[#141414] px-2.5 py-0.5 rounded-[2px] border border-[#262626]">
                Dealer Quote Privacy Preserved
              </div>
            </div>

            {roundData?.status === 'settled' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs mb-6">
                  <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px]">
                    <span className="text-[#737373] block mb-1 uppercase">Blended Rate Achieved</span>
                    <span className="text-xl text-[#4ade80] font-medium block mb-1">
                      {roundData.blended_rate ? `${roundData.blended_rate.toFixed(2)}% APY` : 'Executed'}
                    </span>
                    <span className="text-[11px] text-[#a8a8a8]">
                      Knapsack waterfall optimal match
                    </span>
                  </div>

                  <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px]">
                    <span className="text-[#737373] block mb-1 uppercase">Status</span>
                    <span className="text-xl text-white font-medium block mb-1">Settled</span>
                    <span className="text-[11px] text-[#4ade80]">Atomic escrow swap finalized</span>
                  </div>

                  <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px]">
                    <span className="text-[#737373] block mb-1 uppercase">Fill Receipt PDA</span>
                    <span className="text-xl text-white font-medium block mb-1 truncate">
                      {roundData.fill_receipt ? `${roundData.fill_receipt.slice(0, 8)}...` : 'On-Chain'}
                    </span>
                    <span className="text-[11px] text-[#a8a8a8]">Swapped atomically via Keystone</span>
                  </div>
                </div>

                {roundData.fill_receipt && (
                  <div className="p-4 bg-[#121212] border border-[#242424] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                    <div>
                      <span className="text-[#737373] block mb-0.5">FillReceipt On-Chain PDA</span>
                      <span className="text-white text-[11px]">{roundData.fill_receipt}</span>
                    </div>

                    <a
                      href={`https://explorer.solana.com/address/${roundData.fill_receipt}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-[2px] bg-white text-black font-semibold text-xs hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] shrink-0"
                    >
                      <span>View On-Chain Receipt</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center font-mono text-xs">
                <div className="w-10 h-10 rounded-[2px] bg-[#141414] border border-[#262626] flex items-center justify-center text-[#fbbf24] mx-auto mb-3">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">
                  Awaiting Enclave Matching & Settlement
                </h3>
                <p className="text-[#737373] text-[11px] max-w-md mx-auto leading-relaxed">
                  Auction round is open ({roundData?.quote_count ?? 0} quotes received). When the 300s window closes or the round is triggered, quotes will be evaluated confidentially inside Chainlink CRE TEE.
                </p>
              </div>
            )}
          </div>
        </TiltCard>
      </main>
    </div>
  )
}
