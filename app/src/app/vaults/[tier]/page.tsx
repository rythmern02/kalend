'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '../../../components/Header'
import { ModeBar, useModeBarState } from '../../../components/ModeBar'
import { DataSourceTag } from '../../../components/DataSourceTag'
import { StatusChip } from '../../../components/StatusChip'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  Landmark,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries, fetchPythFeed } from '../../../lib/api'

export default function VaultDetailPage() {
  const params = useParams()
  const tier = params?.tier as string
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')

  const { data: allSeries, isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const { data: solFeed } = useQuery({
    queryKey: ['pyth', 'SOL/USD'],
    queryFn: () => fetchPythFeed('SOL/USD'),
  })

  const tierMetadata: Record<
    string,
    { name: string; asset: string; kind: number; icon: any; benchmark: string }
  > = {
    conservative: {
      name: 'Conservative Vault',
      asset: 'Ondo Finance USDY',
      kind: 3,
      icon: Landmark,
      benchmark: '4.85% APY',
    },
    balanced: {
      name: 'Balanced Vault',
      asset: 'Solana LSTs (JitoSOL / mSOL)',
      kind: 0,
      icon: Scale,
      benchmark: '7.12% APY',
    },
    alpha: {
      name: 'Delta-Neutral Alpha Vault',
      asset: 'Backpack Securities (AAPL / NVDA)',
      kind: 1,
      icon: Sparkles,
      benchmark: '3.40% Yield',
    },
  }

  const currentTier = tierMetadata[tier] || tierMetadata.conservative
  const IconComponent = currentTier.icon

  const matchingSeries = allSeries?.filter((s) => s.index_kind === currentTier.kind) ?? []

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/vaults"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a8a8] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Vaults</span>
        </Link>

        {/* Vault Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 mb-10 border-b border-[#222222]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[2px] bg-[#141414] border border-[#262626] flex items-center justify-center text-white">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block">
                {currentTier.asset}
              </span>
              <h1 className="font-serif text-3xl font-medium text-white">
                {currentTier.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-[#737373] block mb-1">Benchmark Yield</span>
              <span className="text-white text-base font-medium">{currentTier.benchmark}</span>
            </div>
            <div>
              <span className="text-[#737373] block mb-1">Active Series</span>
              <span className="text-white text-base font-medium">{matchingSeries.length}</span>
            </div>
          </div>
        </div>

        {/* Reference Yield Curve & Sanity Bounds */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-white font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4ade80]" />
              Reference Term Structure & Yield Curve
            </h2>
            <DataSourceTag sourceName="Pyth Macro Yield Receiver" updatedAt={solFeed?.publishTime} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs mb-6">
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">1M Term</span>
              <span className="text-white text-sm font-medium">4.78%</span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">3M Term</span>
              <span className="text-white text-sm font-medium">4.85%</span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">6M Term</span>
              <span className="text-white text-sm font-medium">4.92%</span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">1Y Term</span>
              <span className="text-white text-sm font-medium">4.98%</span>
            </div>
          </div>

          <p className="text-xs text-[#a8a8a8] leading-relaxed">
            Note: Reference curves are ingested inside the Chainlink CRE enclave solely as sanity bounds (Prime Directive 2). Kalend on-chain settlement math never relies on display prices.
          </p>
        </div>

        {/* Series Table */}
        <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] overflow-hidden mb-12">
          <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between">
            <h2 className="font-serif text-lg text-white font-medium">
              Dated Series by Maturity
            </h2>
            <span className="font-mono text-xs text-[#a8a8a8]">
              {matchingSeries.length} Available
            </span>
          </div>

          {matchingSeries.length === 0 ? (
            <div className="p-12 text-center text-[#a8a8a8] font-mono text-xs">
              No active series registered for this vault. Use admin console to open a new series.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1f1f1f] text-[#737373] bg-[#0d0d0d]">
                    <th className="py-3 px-5">Series Pubkey</th>
                    <th className="py-3 px-5">Maturity Date</th>
                    <th className="py-3 px-5">Days Left</th>
                    <th className="py-3 px-5">Indicative PT Price</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818]">
                  {matchingSeries.map((s) => {
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((s.maturity_ts - Date.now() / 1000) / 86400)
                    )
                    const impliedPtPrice = (1 / (1 + 0.05 * (daysLeft / 365))).toFixed(4)

                    return (
                      <tr key={s.pubkey} className="hover:bg-[#121212] transition-colors">
                        <td className="py-4 px-5 text-white">
                          <span className="truncate block max-w-[140px]">
                            {s.pubkey.slice(0, 4)}...{s.pubkey.slice(-4)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-white">
                          {new Date(s.maturity_ts * 1000).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-[#a8a8a8]">{daysLeft}d</td>
                        <td className="py-4 px-5 text-[#4ade80]">${impliedPtPrice}</td>
                        <td className="py-4 px-5">
                          <StatusChip status={s.status === 0 ? 'Open' : 'Settled'} />
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/series/${s.pubkey}/strip`}
                              className="px-2.5 py-1 rounded-[2px] border border-[#333333] hover:border-white text-white text-[11px] transition-colors"
                            >
                              Strip / Merge
                            </Link>
                            <Link
                              href={`/rfq/new?series=${s.pubkey}`}
                              className="px-2.5 py-1 rounded-[2px] bg-white text-black font-medium text-[11px] hover:bg-[#e6e6e6] transition-colors"
                            >
                              Request Quote
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
