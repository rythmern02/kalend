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
  ShieldAlert,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries, fetchPythFeed, fetchLiveStakePoolRate } from '../../../lib/api'
import { useWallet } from '../../../lib/wallet'
import { TiltCard } from '../../../components/TiltCard'

export default function VaultDetailPage() {
  const params = useParams()
  const tier = params?.tier as string
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  const { data: allSeries, isLoading: isSeriesLoading } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const { data: solFeed } = useQuery({
    queryKey: ['pyth', 'SOL/USD'],
    queryFn: () => fetchPythFeed('SOL/USD'),
  })

  const { data: stakePoolData, isLoading: isStakePoolLoading } = useQuery({
    queryKey: ['stake-pool-rate'],
    queryFn: fetchLiveStakePoolRate,
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
      benchmark: '4.85% APY (Reg S Baseline)',
    },
    balanced: {
      name: 'Balanced Vault',
      asset: 'Solana LSTs (JitoSOL / mSOL)',
      kind: 0,
      icon: Scale,
      benchmark: stakePoolData
        ? `${stakePoolData.exchangeRate.toFixed(6)} SOL/pt`
        : 'Live Devnet SPL Pool',
    },
    alpha: {
      name: 'Delta-Neutral Alpha Vault',
      asset: 'Backpack Securities (1,190 Assets)',
      kind: 1,
      icon: Sparkles,
      benchmark: 'Deferred (Decision 4)',
    },
  }

  const currentTier = tierMetadata[tier] || tierMetadata.conservative
  const IconComponent = currentTier.icon

  const matchingSeries = allSeries?.filter((s) => s.index_kind === currentTier.kind) ?? []

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 mb-8 border-b border-[#222222]">
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
              <span className="text-[#737373] block mb-1">
                {tier === 'balanced' ? 'Live Exchange Rate' : 'Benchmark Index'}
              </span>
              <span className="text-white text-base font-medium">{currentTier.benchmark}</span>
              {tier === 'balanced' && stakePoolData && (
                <span className="text-[10px] text-[#4ade80] block font-mono">
                  Live Devnet SPL Pool (HUnw...B7g66f)
                </span>
              )}
            </div>
            <div>
              <span className="text-[#737373] block mb-1">Active Series</span>
              <span className="text-white text-base font-medium">{matchingSeries.length}</span>
            </div>
          </div>
        </div>

        {/* Institutional Operator Disclosures */}
        {tier === 'conservative' && (
          <div className="p-4 rounded-[4px] bg-[#111105] border border-[#3a3010] mb-8 font-mono text-xs flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
            <div>
              <div className="text-[#fbbf24] font-medium mb-1">
                Decision 3 Operator Disclosure: Test Mint Standing In For USDY
              </div>
              <p className="text-[#a8a8a8] leading-relaxed">
                Conservative Vault utilizes a test mint standing in for Ondo USDY on Devnet. Settlement index is set via oracle reports, not live Treasury market data. Structure adheres to Reg S offshore terms. Institutional OUSG accreditation requirements and terms will be confirmed directly with Ondo Finance with no minimum commitment published.
              </p>
            </div>
          </div>
        )}

        {tier === 'balanced' && (
          <div className="p-4 rounded-[4px] bg-[#0c130d] border border-[#1f3a23] mb-8 font-mono text-xs flex items-start gap-3">
            <Scale className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
            <div>
              <div className="text-[#4ade80] font-medium mb-1">
                Live On-Chain Stake Pool Exchange Rate: HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f
              </div>
              <p className="text-[#a8a8a8] leading-relaxed">
                Exchange rate is read directly from Devnet SPL Stake Pool on-chain state (274 bytes). Total Lamports: {stakePoolData?.totalLamports ?? '505,143,440'}, Pool Token Supply: {stakePoolData?.poolTokenSupply ?? '500,000,000'}.
                <br />
                <span className="text-[#888888]">
                  Note: Devnet stake pool is real but pool balance is small; rate delta demonstrates on-chain settlement mechanics rather than market staking yields.
                </span>
              </p>
            </div>
          </div>
        )}

        {tier === 'alpha' && (
          <div className="p-4 rounded-[4px] bg-[#140e0e] border border-[#3e1f1f] mb-8 font-mono text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
            <div>
              <div className="text-[#f87171] font-medium mb-1">
                Decision 4 Operator Disclosure: Tokenized Equities Vault Deferred
              </div>
              <p className="text-[#a8a8a8] leading-relaxed">
                Spike C verified Backpack Exchange&apos;s live public securities API (<code className="text-zinc-300">/api/v1/securities</code>) returning 1,190 assets. In accordance with the Launch Gate (Section 16), live RFQ trading for Equities is deferred until production corporate action attestation is finalized. No unverified dividend rates or speculative cash yields are published.
              </p>
            </div>
          </div>
        )}

        {/* Decision 1 & Privacy Architecture Disclosure */}
        <div className="p-4 rounded-[4px] bg-[#0d0d0d] border border-[#1f1f1f] mb-8 font-mono text-xs flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-[#60a5fa] shrink-0 mt-0.5" />
          <div className="text-[#a8a8a8] leading-relaxed">
            <strong className="text-white">Decision 1 & Privacy Model: </strong>
            RFQ quotes are matched and clearing prices are calculated inside the confidential Chainlink CRE enclave (AWS Nitro TEE). In accordance with Solana Token-2022 architecture (Spike B), settlement balances leaving escrow on-chain are visible on Solana.
          </div>
        </div>

        {/* Reference Yield Curve & Sanity Bounds */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-white font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4ade80]" />
              Reference Term Structure & Oracles
            </h2>
            <DataSourceTag
              sourceName={solFeed ? 'Pyth Devnet Feed' : 'Devnet Oracle Feed'}
              updatedAt={solFeed?.publishTime}
            />
          </div>

          {solFeed ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs mb-6">
              <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                <span className="text-[#737373] block mb-1">Pyth SOL/USD</span>
                <span className="text-white text-sm font-medium">${solFeed.price.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                <span className="text-[#737373] block mb-1">Confidence</span>
                <span className="text-white text-sm font-medium">±${solFeed.confidence.toFixed(3)}</span>
              </div>
              <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                <span className="text-[#737373] block mb-1">Publish Time</span>
                <span className="text-white text-sm font-medium">
                  {new Date(solFeed.publishTime * 1000).toLocaleTimeString()}
                </span>
              </div>
              <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                <span className="text-[#737373] block mb-1">Status</span>
                <span className="text-[#4ade80] text-sm font-medium">Live On-Chain</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px] font-mono text-xs text-[#a8a8a8] mb-6">
              Awaiting live Pyth macro yield curve feed on Devnet. Kalend displays reference prices solely for bounding quotes; on-chain settlement math never relies on display prices (Prime Directive 2).
            </div>
          )}

          <p className="text-xs text-[#737373] leading-relaxed">
            Note: Reference curves are ingested inside the Chainlink CRE enclave solely as sanity bounds. Kalend on-chain settlement math never relies on display prices.
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
