'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '../../../components/Header'
import { ModeBar, useModeBarState } from '../../../components/ModeBar'
import { StatusChip } from '../../../components/StatusChip'
import { DataSourceTag } from '../../../components/DataSourceTag'
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
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchRfqRound } from '../../../lib/api'

export default function RoundStatusPage() {
  const params = useParams()
  const roundId = params?.roundId as string
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')

  const [simulatedStage, setSimulatedStage] = useState<number>(3)
  const [countdown, setCountdown] = useState<number>(18)

  const { data: roundData } = useQuery({
    queryKey: ['rfqRound', roundId],
    queryFn: () => fetchRfqRound(roundId),
    refetchInterval: 3000,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto transition for presentation
  useEffect(() => {
    const stageTimer = setTimeout(() => {
      setSimulatedStage(4) // Executed
    }, 4000)
    return () => clearInterval(stageTimer)
  }, [])

  const steps = [
    { label: 'Sealed', desc: 'HPKE ciphertext submitted', icon: Lock },
    { label: 'Window Open', desc: 'Authorized dealers quoting', icon: Clock },
    { label: 'Matching in Enclave', desc: 'Knapsack waterfall in TEE', icon: Cpu },
    { label: 'Fill on Solana', desc: 'Keystone forwarder CPI', icon: Layers },
    { label: 'Executed', desc: 'Atomic escrow swap finalized', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
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
                RFQ Round Status
              </span>
              <StatusChip status={simulatedStage >= 4 ? 'Executed' : 'Matching'} />
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
              Auction Window Timer
            </span>
            <span className="text-xl font-medium text-white">00:{countdown.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Timeline Stepper */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-10">
          <span className="font-mono text-xs text-[#737373] uppercase tracking-wider block mb-6">
            Execution Lifecycle
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {steps.map((st, idx) => {
              const Icon = st.icon
              const isPast = idx < simulatedStage
              const isCurrent = idx === simulatedStage
              return (
                <div
                  key={st.label}
                  className={`p-4 rounded-[2px] border transition-colors ${
                    isCurrent
                      ? 'bg-[#141414] border-white text-white'
                      : isPast
                      ? 'bg-[#0c1f13] border-[#1b4329] text-[#4ade80]'
                      : 'bg-[#0a0a0a] border-[#1c1c1c] text-[#555]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-mono text-[10px] uppercase">
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

        {/* Execution Results Summary */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1c1c1c]">
            <h2 className="font-serif text-lg text-white font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
              Enclave Match Results (Blended Fill)
            </h2>
            <div className="text-[11px] font-mono text-[#a8a8a8] bg-[#141414] px-2 py-0.5 rounded-[2px] border border-[#262626]">
              Number of Dealer Fills Hidden
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs mb-6">
            <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px]">
              <span className="text-[#737373] block mb-1 uppercase">Blended Rate Achieved</span>
              <span className="text-xl text-[#4ade80] font-medium block mb-1">4.92% APY</span>
              <span className="text-[11px] text-[#a8a8a8]">
                Better than limit: +0.03% improved
              </span>
            </div>

            <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px]">
              <span className="text-[#737373] block mb-1 uppercase">Total Filled Size</span>
              <span className="text-xl text-white font-medium block mb-1">1,000,000 PT</span>
              <span className="text-[11px] text-[#a8a8a8]">100% Volume satisfied</span>
            </div>

            <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px]">
              <span className="text-[#737373] block mb-1 uppercase">Gross Quote Proceeds</span>
              <span className="text-xl text-white font-medium block mb-1">\$965,000 USDC</span>
              <span className="text-[11px] text-[#a8a8a8]">Swapped atomically via ALT</span>
            </div>
          </div>

          <div className="p-4 bg-[#121212] border border-[#242424] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="text-[#737373] block mb-0.5">FillReceipt On-Chain PDA</span>
              <span className="text-white text-[11px]">
                227GaCtKiP4mFch4AtZBLAviLcJBgJYeCpxXPWAQfNS1
              </span>
            </div>

            <a
              href="https://explorer.solana.com/address/227GaCtKiP4mFch4AtZBLAviLcJBgJYeCpxXPWAQfNS1?cluster=devnet"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[2px] bg-white text-black font-medium text-[11px] hover:bg-[#e6e6e6] transition-colors shrink-0"
            >
              <span>View On-Chain Receipt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
