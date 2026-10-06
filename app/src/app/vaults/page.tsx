'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { DataSourceTag } from '../../components/DataSourceTag'
import { StatusChip } from '../../components/StatusChip'
import {
  Landmark,
  Scale,
  Sparkles,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries, fetchLiveStakePoolRate } from '../../lib/api'

export default function VaultsPage() {
  const modeBarState = useModeBarState()
  const [openDrawer, setOpenDrawer] = useState<string | null>(null)

  const { data: allSeries, isLoading } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const { data: stakePoolData } = useQuery({
    queryKey: ['live-stake-pool'],
    queryFn: fetchLiveStakePoolRate,
    refetchInterval: 10000,
  })

  const toggleDrawer = (id: string) => {
    setOpenDrawer((prev) => (prev === id ? null : id))
  }

  const seriesByKind = (kind: number) => {
    return allSeries?.filter((s) => s.index_kind === kind) ?? []
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Disclosure Banner: Decision 1 */}
        <div className="mb-8 p-4 bg-[#14120a] border border-[#382b13] rounded-[2px] flex items-start gap-3 text-xs font-mono text-[#d4af37]">
          <ShieldAlert className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Institutional Privacy & Settlement Disclosure:</strong> Dealer quotes are matched and blended privately inside the Chainlink CRE confidential enclave. When settlements execute, individual on-chain escrow splits and payout amounts are visible on the public Solana ledger.
          </div>
        </div>

        <div className="mb-10">
          <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
            Institutional Asset Allocation
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
            Institutional Vaults
          </h1>
          <p className="text-sm text-[#a8a8a8] max-w-2xl leading-relaxed">
            Dated yield structures categorized by fundamental counterparty and asset risk profiles.
            All vaults enforce mathematical collateral conservation (INV1) and zero admin fund extraction (INV3).
          </p>
        </div>

        {/* 3 Vaults */}
        <div className="space-y-6 mb-16">
          {/* Conservative Vault */}
          <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] flex items-center justify-center text-[#4ade80] shrink-0 mt-1">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-[#4ade80] uppercase tracking-wider">
                        Tier 1 · Conservative
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded-[2px] bg-[#141414] border border-[#2b2b2b] text-[#fbbf24]">
                        Reg S Non-U.S. Only
                      </span>
                    </div>
                    <h2 className="font-serif text-xl text-white font-medium">
                      Ondo Finance USDY Vault
                    </h2>
                    <p className="text-xs text-[#a8a8a8] mt-1 max-w-xl">
                      Test mint standing in for USDY. Tokenized short-term U.S. Treasury bills and bank demand deposits.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs shrink-0">
                  <div>
                    <span className="text-[#737373] block mb-1">Benchmark Rate</span>
                    <span className="text-[#4ade80] text-sm font-medium">4.85% (Test Index)</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Source</span>
                    <span className="text-white text-[11px]">Index set manually</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Active Series</span>
                    <span className="text-white">{seriesByKind(3).length}</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Standard</span>
                    <span className="text-white">Token-2022</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleDrawer('conservative')}
                    className="p-2 text-[#a8a8a8] hover:text-white rounded-[2px] border border-[#262626] hover:border-[#404040]"
                    title="Risk disclosure"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <Link
                    href="/vaults/conservative"
                    className="px-4 py-2 bg-white text-black text-xs font-medium rounded-[2px] hover:bg-[#e6e6e6] transition-colors flex items-center gap-1.5"
                  >
                    <span>View Series</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Risk Drawer */}
            {openDrawer === 'conservative' && (
              <div className="px-6 py-4 bg-[#0d0d0d] border-t border-[#1c1c1c] text-xs font-mono text-[#a8a8a8] flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Risk Disclosure:</strong> USDY carries off-chain credit risk of short-term U.S. Treasuries and Ondo collateral custody. Regulated issuer retains pause and permanent delegate authority under Token-2022 policy.
                </p>
              </div>
            )}
          </div>

          {/* Balanced Vault */}
          <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-[#1a1408] border border-[#4d3810] flex items-center justify-center text-[#fbbf24] shrink-0 mt-1">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-[#fbbf24] uppercase tracking-wider">
                        Tier 2 · Balanced
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded-[2px] bg-[#141414] border border-[#2b2b2b] text-[#a8a8a8]">
                        Global Institutional
                      </span>
                    </div>
                    <h2 className="font-serif text-xl text-white font-medium">
                      Solana LST Staking Vault (JitoSOL / mSOL)
                    </h2>
                    <p className="text-xs text-[#a8a8a8] mt-1 max-w-xl">
                      Liquid staked Solana validation rewards with MEV extraction. Lock in fixed staking returns against epoch reward fluctuation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs shrink-0">
                  <div>
                    <span className="text-[#737373] block mb-1">Exchange Rate</span>
                    <span className="text-[#fbbf24] text-sm font-medium">
                      {stakePoolData ? `${stakePoolData.exchangeRate.toFixed(4)} SOL/Jito` : 'Attested on-chain'}
                    </span>
                    <span className="text-[10px] text-[#737373] block">Mechanics proof</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Source</span>
                    <span className="text-white text-[11px]">SPL Stake Pool (HUnw...)</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Active Series</span>
                    <span className="text-white">{seriesByKind(0).length}</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Crank</span>
                    <span className="text-[#4ade80]">Permissionless</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleDrawer('balanced')}
                    className="p-2 text-[#a8a8a8] hover:text-white rounded-[2px] border border-[#262626] hover:border-[#404040]"
                    title="Risk disclosure"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <Link
                    href="/vaults/balanced"
                    className="px-4 py-2 bg-white text-black text-xs font-medium rounded-[2px] hover:bg-[#e6e6e6] transition-colors flex items-center gap-1.5"
                  >
                    <span>View Series</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Risk Drawer */}
            {openDrawer === 'balanced' && (
              <div className="px-6 py-4 bg-[#0d0d0d] border-t border-[#1c1c1c] text-xs font-mono text-[#a8a8a8] flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Risk Disclosure:</strong> APR on devnet shows mechanics, not market rates. Underlying Devnet stake pool balance is small (0.505 SOL), so rates do not simulate mainnet market conditions. Settle crank executes permissionlessly on Solana.
                </p>
              </div>
            )}
          </div>

          {/* Alpha Vault (Decision 4: Deferred / Not live) */}
          <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] overflow-hidden opacity-90">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-[#737373] shrink-0 mt-1">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider">
                        Tier 3 · Delta-Neutral Equities
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded-[2px] bg-[#1a1408] border border-[#4d3810] text-[#fbbf24]">
                        Not Live · Deferred Tier 2
                      </span>
                    </div>
                    <h2 className="font-serif text-xl text-white font-medium">
                      Backpack Tokenized Equities Vault (Preview)
                    </h2>
                    <p className="text-xs text-[#a8a8a8] mt-1 max-w-xl">
                      Tokenized securities entitlements preview. 1,190 Backpack securities verified via /api/v1/securities. Corporate action settlement workflows deferred per launch gate.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono text-xs shrink-0">
                  <div>
                    <span className="text-[#737373] block mb-1">Status</span>
                    <span className="text-[#fbbf24] text-sm font-medium">Not Live</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Catalog</span>
                    <span className="text-white text-[11px]">1,190 Securities</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">Active Series</span>
                    <span className="text-[#737373]">0 (Deferred)</span>
                  </div>
                  <div>
                    <span className="text-[#737373] block mb-1">API Verified</span>
                    <span className="text-[#4ade80]">Spike C Pass</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleDrawer('alpha')}
                    className="p-2 text-[#a8a8a8] hover:text-white rounded-[2px] border border-[#262626] hover:border-[#404040]"
                    title="Risk disclosure"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <Link
                    href="/vaults/alpha"
                    className="px-4 py-2 bg-[#1a1a1a] text-white border border-[#333333] text-xs font-medium rounded-[2px] hover:border-white transition-colors flex items-center gap-1.5"
                  >
                    <span>View 1,190 Securities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Risk Drawer */}
            {openDrawer === 'alpha' && (
              <div className="px-6 py-4 bg-[#0d0d0d] border-t border-[#1c1c1c] text-xs font-mono text-[#a8a8a8] flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Decision 4 Implementation:</strong> Tokenized Equities Vault is deferred from active trading. Spike C verified Backpack’s securities API returning 1,190 assets. No unverified dividend rates or speculative cash yields are published. Risk Disclosure: Equities corporate actions (stock splits vs dividends) are adjusted via the Token-2022 Scaled UI Multiplier. Issuer may pause transfers during mandatory SEC filing halts.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
