'use client'

import React, { useState } from 'react'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
  UserCheck,
  ExternalLink,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllowEntry } from '../../lib/api'

export default function AccessPage() {
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')

  const { data: allowEntry, isLoading } = useQuery({
    queryKey: ['allowEntry', walletAddress],
    queryFn: () => fetchAllowEntry(walletAddress),
    enabled: !!walletAddress,
  })

  const hasRole = (roleBit: number) => {
    if (!allowEntry || !allowEntry.is_valid) return false
    return (allowEntry.roles & roleBit) !== 0
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
            Institutional Compliance & KYC
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
            Access & Accreditation
          </h1>
          <p className="text-sm text-[#a8a8a8] max-w-2xl leading-relaxed">
            Kalend is an institutional desk. Counterparties must be verified on-chain via the protocol allowlist before stripping, quoting, or redeeming dated yield.
          </p>
        </div>

        {/* Current Eligibility Status */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#1f1f1f] gap-4">
            <div>
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-1">
                Connected Wallet
              </span>
              <span className="font-mono text-sm text-white">{walletAddress}</span>
            </div>

            <div>
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-1">
                Accreditation Status
              </span>
              {isLoading ? (
                <span className="text-xs text-[#a8a8a8] font-mono">Auditing on-chain...</span>
              ) : allowEntry?.is_valid ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80] text-xs font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accredited & Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#240e0e] border border-[#4d1c1c] text-[#f87171] text-xs font-mono">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Not Allowlisted</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono text-xs">
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#a8a8a8] block mb-1">Strip Role</span>
              <span className={hasRole(1) ? 'text-[#4ade80]' : 'text-[#737373]'}>
                {hasRole(1) ? 'Granted (1:1)' : 'Pending'}
              </span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#a8a8a8] block mb-1">Redeem Role</span>
              <span className={hasRole(2) ? 'text-[#4ade80]' : 'text-[#737373]'}>
                {hasRole(2) ? 'Granted' : 'Pending'}
              </span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#a8a8a8] block mb-1">Claim Role</span>
              <span className={hasRole(4) ? 'text-[#4ade80]' : 'text-[#737373]'}>
                {hasRole(4) ? 'Granted' : 'Pending'}
              </span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#a8a8a8] block mb-1">Requester</span>
              <span className={hasRole(8) ? 'text-[#4ade80]' : 'text-[#737373]'}>
                {hasRole(8) ? 'Active' : 'Pending'}
              </span>
            </div>
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#a8a8a8] block mb-1">Dealer</span>
              <span className={hasRole(16) ? 'text-[#4ade80]' : 'text-[#737373]'}>
                {hasRole(16) ? 'Authorized' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Vault Jurisdiction Requirements */}
        <div className="mb-10">
          <h2 className="font-serif text-xl text-white font-medium mb-4">
            Jurisdiction Notes by Vault Tier
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-base text-white">
                  🛡️ Conservative Vault (Ondo USDY)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#1a1408] border border-[#4d3810] text-[#fbbf24]">
                  Non-U.S. Persons Only
                </span>
              </div>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                USDY is issued under Regulation S and is strictly restricted to non-U.S. individuals and entities. Requires completed KYC/AML verification and non-sanctioned address screening through the Kalend compliance hook.
              </p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-base text-white">
                  ⚖️ Balanced Vault (Solana LSTs)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80]">
                  Global Institutional Access
                </span>
              </div>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                Liquid staking yield derived from native on-chain Solana proof-of-stake rewards (JitoSOL, mSOL). Open to accredited global counterparties subject to standard AML sanctions screening.
              </p>
            </div>

            <div className="p-4 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-base text-white">
                  🚀 Delta-Neutral Alpha (Backpack Securities)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#1a1408] border border-[#4d3810] text-[#fbbf24]">
                  Qualified Institutional Buyers
                </span>
              </div>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                Tokenized U.S. equities entitlements. Counterparties must maintain Level 2 verified institutional status with Backpack Exchange or accredited custody documentation.
              </p>
            </div>
          </div>
        </div>

        {/* How to Apply */}
        <div className="p-6 rounded-[4px] bg-[#0d0d0d] border border-[#262626]">
          <h3 className="font-serif text-lg text-white mb-2">How to Apply for Desk Access</h3>
          <p className="text-xs text-[#a8a8a8] mb-4 leading-relaxed">
            To onboard your fund, treasury, or trading desk, submit your entity details and compliance contact. Approved wallets are added directly to the on-chain AllowEntry PDA registry.
          </p>
          <a
            href="mailto:compliance@kalend.fi?subject=Kalend%20Institutional%20Onboarding"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-medium text-xs rounded-[2px] hover:bg-[#e6e6e6] transition-colors"
          >
            <span>Request Institutional Onboarding</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  )
}
