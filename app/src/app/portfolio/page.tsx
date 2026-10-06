'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import { DataSourceTag } from '../../components/DataSourceTag'
import {
  Wallet,
  Eye,
  EyeOff,
  Lock,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries } from '../../lib/api'

export default function PortfolioPage() {
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')
  const [showAmounts, setShowAmounts] = useState<boolean>(true)

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  // Format amount with show/hide toggle
  const formatAmount = (val: string) => {
    if (!showAmounts) return '••••••••'
    return val
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-10 border-b border-[#222222] gap-4">
          <div>
            <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
              Institutional Asset Custody
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-2">
              Portfolio & Escrow Positions
            </h1>
            <p className="font-mono text-xs text-[#a8a8a8]">
              Wallet: {walletAddress}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => setShowAmounts(!showAmounts)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[2px] border border-[#333333] hover:border-white text-white transition-colors"
            >
              {showAmounts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showAmounts ? 'Hide Balances' : 'Show Balances'}</span>
            </button>
          </div>
        </div>

        {/* Portfolio Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12 font-mono text-xs">
          <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
            <span className="text-[#737373] block mb-1 uppercase text-[10px]">
              Total PT Holdings (Face Value)
            </span>
            <span className="text-xl text-white font-medium block mb-1">
              {formatAmount('2,500,000 PT')}
            </span>
            <span className="text-[11px] text-[#4ade80]">Conservative + Balanced</span>
          </div>

          <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
            <span className="text-[#737373] block mb-1 uppercase text-[10px]">
              Active YT Floating Positions
            </span>
            <span className="text-xl text-white font-medium block mb-1">
              {formatAmount('1,500,000 YT')}
            </span>
            <span className="text-[11px] text-[#fbbf24]">Earning staking & T-bill yield</span>
          </div>

          <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
            <span className="text-[#737373] block mb-1 uppercase text-[10px]">
              Escrow Locked (In-Auction)
            </span>
            <span className="text-xl text-white font-medium block mb-1">
              {formatAmount('1,000,000 PT')}
            </span>
            <span className="text-[11px] text-[#a8a8a8]">Locked until window close</span>
          </div>

          <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
            <span className="text-[#737373] block mb-1 uppercase text-[10px]">
              Claimable at Maturity
            </span>
            <span className="text-xl text-[#4ade80] font-medium block mb-1">
              {formatAmount('$124,500 USDC')}
            </span>
            <span className="text-[11px] text-[#4ade80]">1 Series ready for claim</span>
          </div>
        </div>

        {/* PT & YT Positions Table */}
        <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] overflow-hidden mb-12">
          <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between">
            <h2 className="font-serif text-lg text-white font-medium">
              Dated Token Holdings (PT & YT)
            </h2>
            <span className="font-mono text-xs text-[#a8a8a8]">
              Token-2022 Verified Mints
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1f1f1f] text-[#737373] bg-[#0d0d0d]">
                  <th className="py-3 px-5">Series / Underlying</th>
                  <th className="py-3 px-5">Maturity Date</th>
                  <th className="py-3 px-5">PT Balance</th>
                  <th className="py-3 px-5">YT Balance</th>
                  <th className="py-3 px-5">Privacy Mode</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818]">
                <tr className="hover:bg-[#121212] transition-colors">
                  <td className="py-4 px-5 text-white">
                    <span className="font-medium block">Ondo USDY (2026-Q4)</span>
                    <span className="text-[11px] text-[#737373]">CSQJ...FPUwY</span>
                  </td>
                  <td className="py-4 px-5 text-white">2026-10-10</td>
                  <td className="py-4 px-5 text-white font-medium">
                    {formatAmount('1,000,000 PT')}
                  </td>
                  <td className="py-4 px-5 text-white font-medium">
                    {formatAmount('1,000,000 YT')}
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1 text-[#4ade80] text-[11px]">
                      <ShieldCheck className="w-3 h-3" />
                      Confidential
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href="/series/CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY/redeem"
                      className="px-2.5 py-1 rounded-[2px] bg-white text-black font-medium text-[11px] hover:bg-[#e6e6e6] transition-colors"
                    >
                      Redeem
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-[#121212] transition-colors">
                  <td className="py-4 px-5 text-white">
                    <span className="font-medium block">JitoSOL LST (2026-Q4)</span>
                    <span className="text-[11px] text-[#737373]">9VaN...qVD3</span>
                  </td>
                  <td className="py-4 px-5 text-white">2026-10-09</td>
                  <td className="py-4 px-5 text-white font-medium">
                    {formatAmount('1,500,000 PT')}
                  </td>
                  <td className="py-4 px-5 text-white font-medium">
                    {formatAmount('500,000 YT')}
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1 text-[#4ade80] text-[11px]">
                      <ShieldCheck className="w-3 h-3" />
                      Confidential
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Link
                      href="/series/9VaNs9rZckXBVBP4Tw9cHUP5Faifmu6MVgYUAAJVqVD3/redeem"
                      className="px-2.5 py-1 rounded-[2px] bg-white text-black font-medium text-[11px] hover:bg-[#e6e6e6] transition-colors"
                    >
                      Redeem
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Escrow Locks & Unlock Timers */}
        <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] p-6 font-mono text-xs">
          <h2 className="font-serif text-lg text-white font-medium mb-4">
            Active Program Escrow Locks
          </h2>
          <div className="p-4 bg-[#121212] border border-[#1e1e1e] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[#a8a8a8] block mb-1">
                Escrow PDA: 8JkL...7xQa (Requester Auction Commitment)
              </span>
              <span className="text-white">
                Locked Amount: {formatAmount('1,000,000 PT')} · Unlocks at: 2026-10-06 18:30 UTC
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#fbbf24]">
              <Clock className="w-4 h-4" />
              <span>Auction Active (Cannot Front-Run Withdraw)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
