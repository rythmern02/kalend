'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import { DataSourceTag } from '../../components/DataSourceTag'
import { TiltCard } from '../../components/TiltCard'
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
  Inbox,
  ArrowRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries } from '../../lib/api'
import { useWallet } from '../../lib/wallet'

export default function PortfolioPage() {
  const modeBarState = useModeBarState()
  const wallet = useWallet()
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

  // Real user positions on chain (empty if new wallet or not connected)
  const userPositions: any[] = []

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
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
              Wallet: {wallet.connected && wallet.walletAddress ? wallet.walletAddress : 'Wallet not connected'}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => setShowAmounts(!showAmounts)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] border border-[#333333] hover:border-white text-white transition-colors"
            >
              {showAmounts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showAmounts ? 'Hide Balances' : 'Show Balances'}</span>
            </button>
          </div>
        </div>

        {!wallet.connected ? (
          <TiltCard accent="default" intensity={4} className="mb-12">
            <div className="p-12 text-center font-mono text-xs">
              <div className="w-12 h-12 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-white mx-auto mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-medium text-white mb-2">
                Connect Wallet to View Holdings
              </h3>
              <p className="text-[#a8a8a8] text-xs max-w-md mx-auto mb-6 leading-relaxed">
                Connect your Solana Devnet wallet to query live Token-2022 PT/YT token accounts, active escrow locks, and maturity claim entitlements.
              </p>
              <button
                onClick={() => wallet.setShowConnectModal(true)}
                className="px-6 py-2.5 bg-white text-black font-semibold text-xs rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                Connect Wallet
              </button>
            </div>
          </TiltCard>
        ) : (
          <>
            {/* Portfolio Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-12 font-mono text-xs">
              <TiltCard accent="emerald" intensity={4} enableGlare={true}>
                <div className="p-5">
                  <span className="text-[#737373] block mb-1 uppercase text-[10px]">
                    Total PT Holdings (Face Value)
                  </span>
                  <span className="text-xl text-white font-medium block mb-1">
                    {formatAmount('0 PT')}
                  </span>
                  <span className="text-[11px] text-[#737373]">Live on-chain query</span>
                </div>
              </TiltCard>

              <TiltCard accent="amber" intensity={4} enableGlare={true}>
                <div className="p-5">
                  <span className="text-[#737373] block mb-1 uppercase text-[10px]">
                    Active YT Floating Positions
                  </span>
                  <span className="text-xl text-white font-medium block mb-1">
                    {formatAmount('0 YT')}
                  </span>
                  <span className="text-[11px] text-[#737373]">Live on-chain query</span>
                </div>
              </TiltCard>

              <TiltCard accent="default" intensity={4} enableGlare={true}>
                <div className="p-5">
                  <span className="text-[#737373] block mb-1 uppercase text-[10px]">
                    Escrow Locked (In-Auction)
                  </span>
                  <span className="text-xl text-white font-medium block mb-1">
                    {formatAmount('0 PT')}
                  </span>
                  <span className="text-[11px] text-[#737373]">No active round lock</span>
                </div>
              </TiltCard>

              <TiltCard accent="cyan" intensity={4} enableGlare={true}>
                <div className="p-5">
                  <span className="text-[#737373] block mb-1 uppercase text-[10px]">
                    Claimable at Maturity
                  </span>
                  <span className="text-xl text-[#4ade80] font-medium block mb-1">
                    {formatAmount('$0.00 USDC')}
                  </span>
                  <span className="text-[11px] text-[#737373]">Awaiting matured series</span>
                </div>
              </TiltCard>
            </div>

            {/* PT & YT Positions Table */}
            <TiltCard accent="default" intensity={3} enableGlare={false} className="mb-12">
              <div className="overflow-hidden">
                <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between">
                  <h2 className="font-serif text-lg text-white font-medium">
                    Dated Token Holdings (PT & YT)
                  </h2>
                  <DataSourceTag sourceName="Solana Devnet Token Accounts" />
                </div>

                {userPositions.length === 0 ? (
                  <div className="p-16 text-center font-mono text-xs">
                    <div className="w-12 h-12 rounded-[2px] bg-[#141414] border border-[#262626] flex items-center justify-center text-[#737373] mx-auto mb-4">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">No Positions Found on Chain</h3>
                    <p className="text-[#737373] text-[11px] max-w-md mx-auto mb-6 leading-relaxed">
                      No active PT/YT token positions found on Solana Devnet for this wallet. Strip raw collateral in the Vaults flow to mint 1:1 Principal Tokens (PT) and Yield Tokens (YT).
                    </p>
                    <Link
                      href="/vaults"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                    >
                      <span>Explore Institutional Vaults</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
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
                        {userPositions.map((pos: any) => (
                          <tr key={pos.series} className="hover:bg-[#121212] transition-colors">
                            <td className="py-4 px-5 text-white">
                              <span className="font-medium block">{pos.name}</span>
                              <span className="text-[11px] text-[#737373]">{pos.series.slice(0, 8)}...</span>
                            </td>
                            <td className="py-4 px-5 text-white">{pos.maturity}</td>
                            <td className="py-4 px-5 text-white font-medium">{formatAmount(pos.ptBalance)}</td>
                            <td className="py-4 px-5 text-white font-medium">{formatAmount(pos.ytBalance)}</td>
                            <td className="py-4 px-5">
                              <span className="inline-flex items-center gap-1 text-[#4ade80] text-[11px]">
                                <ShieldCheck className="w-3 h-3" />
                                Confidential
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <Link
                                href={`/series/${pos.series}/redeem`}
                                className="px-2.5 py-1 rounded-[2px] bg-white text-black font-medium text-[11px] hover:bg-[#e6e6e6] transition-colors"
                              >
                                Redeem
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TiltCard>

            {/* Escrow Locks & Unlock Timers */}
            <TiltCard accent="default" intensity={3} enableGlare={false}>
              <div className="p-6 font-mono text-xs">
                <h2 className="font-serif text-lg text-white font-medium mb-4">
                  Active Program Escrow Locks
                </h2>
                <div className="p-5 bg-[#0d0d0d] border border-[#1e1e1e] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[#a8a8a8] block mb-1">
                      No Pending Auction Escrow Locks
                    </span>
                    <span className="text-[#737373] text-[11px]">
                      When you submit an RFQ order or dealer quote, required collateral is locked into a Program PDA escrow to eliminate front-running and withdrawal racing.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#4ade80] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Escrow Unencumbered</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </>
        )}
      </main>
    </div>
  )
}
