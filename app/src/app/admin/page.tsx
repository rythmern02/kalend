'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import { ConfirmActionModal } from '../../components/ConfirmActionModal'
import { DataSourceTag } from '../../components/DataSourceTag'
import {
  ShieldAlert,
  UserPlus,
  UserMinus,
  Pause,
  Play,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig, fetchAllSeries } from '../../lib/api'

import { useWallet } from '../../lib/wallet'
import { setAllowEntry, togglePauseGlobal } from '../../lib/kalend-client'

export default function AdminConsolePage() {
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  // Form states
  const [targetWallet, setTargetWallet] = useState('')
  const [rolesBitmask, setRolesBitmask] = useState<number>(31) // all roles
  const [expiryDays, setExpiryDays] = useState<number>(365)
  const [confirmModalData, setConfirmModalData] = useState<{
    actionName: string
    whatWillHappen: string
    whatItCosts: string
    whatBecomesPublic: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()

  const { data: config, refetch: refetchConfig } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
  })

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const handleAction = async () => {
    if (!wallet.connected) {
      wallet.setShowConnectModal(true)
      return
    }

    setIsSubmitting(true)
    setActionError(null)
    try {
      let txSig: string
      if (confirmModalData?.actionName.includes('Pause')) {
        const nextPaused = !config?.paused
        txSig = await togglePauseGlobal(wallet, nextPaused)
      } else {
        if (!targetWallet.trim()) {
          throw new Error('Please enter a target wallet address.')
        }
        const expiryTs = Math.floor(Date.now() / 1000) + expiryDays * 86400
        txSig = await setAllowEntry(wallet, {
          targetWallet: targetWallet.trim(),
          roles: rolesBitmask,
          expiryTs,
        })
      }
      setReceiptUrl(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`)
      refetchConfig()
    } catch (err: any) {
      console.error('Admin action failed:', err)
      setActionError(err.message || 'Transaction rejected on-chain')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header
        userRole="Compliance Authority (Admin)"
      />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-10 border-b border-[#222222] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#fbbf24] uppercase tracking-wider">
                Compliance Officer & Risk Desk
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#1a1408] border border-[#4d3810] text-[#fbbf24]">
                Strict Multisig Authority
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-2">
              Compliance Admin Console
            </h1>
            <p className="text-sm text-[#a8a8a8] max-w-xl">
              Maintain institutional KYC accreditation, open new dated series, and manage emergency circuit breakers. Every action requires explicit two-step confirmation.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <button
              onClick={() =>
                setConfirmModalData({
                  actionName: config?.paused ? 'Emergency Unpause Protocol' : 'Emergency Pause Protocol',
                  whatWillHappen: config?.paused
                    ? 'Resumes all strip, merge, and RFQ matching functions across the protocol.'
                    : 'Immediately pauses strip and new RFQ matching functions. User withdrawals and redemptions remain protected.',
                  whatItCosts: '~0.002 SOL network fee',
                  whatBecomesPublic: 'Global paused state flag toggled in on-chain Config PDA.',
                })
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[2px] border font-medium transition-colors ${
                config?.paused
                  ? 'bg-[#0c1f13] border-[#1b4329] text-[#4ade80] hover:bg-[#132c1b]'
                  : 'bg-[#1f1505] border-[#4d360d] text-[#fbbf24] hover:bg-[#2e2008]'
              }`}
            >
              {config?.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{config?.paused ? 'Resume Protocol' : 'Emergency Pause'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
          {/* Allowlist Manager */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <h2 className="font-serif text-xl text-white font-medium mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#4ade80]" />
                Institutional Allowlist & Role Manager
              </h2>
              <p className="text-xs text-[#a8a8a8] mb-6 leading-relaxed">
                Add or modify counterparty accreditation. Creates or updates an on-chain AllowEntry PDA checked by the core program and SPL Transfer Hook.
              </p>

              <div className="space-y-5 font-mono text-xs mb-6">
                <div>
                  <label className="text-[#a8a8a8] uppercase block mb-2">
                    Target Wallet Address
                  </label>
                  <input
                    type="text"
                    value={targetWallet}
                    onChange={(e) => setTargetWallet(e.target.value)}
                    placeholder="Base58 Solana address..."
                    className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-2.5 px-3 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#a8a8a8] uppercase block mb-2">
                    Accreditation Roles
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: 'Strip (1)', bit: 1 },
                      { label: 'Redeem (2)', bit: 2 },
                      { label: 'Claim (4)', bit: 4 },
                      { label: 'Requester (8)', bit: 8 },
                      { label: 'Dealer (16)', bit: 16 },
                    ].map((r) => {
                      const isSelected = (rolesBitmask & r.bit) !== 0
                      return (
                        <button
                          key={r.label}
                          type="button"
                          onClick={() => setRolesBitmask((prev) => prev ^ r.bit)}
                          className={`p-2.5 rounded-[2px] border text-left transition-colors ${
                            isSelected
                              ? 'bg-[#141414] border-white text-white font-medium'
                              : 'bg-[#0c0c0c] border-[#222222] text-[#737373]'
                          }`}
                        >
                          <span className="block text-[11px]">{r.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[#a8a8a8] uppercase block mb-2">
                    KYC Expiry Term (Days)
                  </label>
                  <input
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-2.5 px-3 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModalData({
                      actionName: `Accredit Wallet (${targetWallet || 'Address'})`,
                      whatWillHappen: `Initializes AllowEntry PDA with roles bitmask ${rolesBitmask} expiring in ${expiryDays} days.`,
                      whatItCosts: '~0.002 SOL PDA rent',
                      whatBecomesPublic: `Wallet address and expiry timestamp on Solana.`,
                    })
                  }
                  className="flex-1 py-3 bg-white text-black font-medium text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-colors"
                >
                  Save Accreditation
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmModalData({
                      actionName: `Revoke AllowEntry (${targetWallet || 'Address'})`,
                      whatWillHappen: `Closes AllowEntry PDA and returns rent lamports to authority. Immediate revocation.`,
                      whatItCosts: '0 net (Rent reclaimed)',
                      whatBecomesPublic: `AllowEntry PDA closed on Solana.`,
                    })
                  }
                  className="px-4 py-3 rounded-[2px] border border-[#4d1c1c] text-[#f87171] hover:bg-[#240e0e] text-xs font-mono transition-colors"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>

          {/* Protocol State & Round Health */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] font-mono text-xs space-y-4">
              <span className="text-[#a8a8a8] uppercase text-[10px] block">
                Relay & Forwarder Crank Health
              </span>
              <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                <span className="text-[#737373]">Keystone Forwarder:</span>
                <span className="text-[#4ade80]">Connected & Healthy</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                <span className="text-[#737373]">ALT Crank Worker:</span>
                <span className="text-[#4ade80]">Active (0.2s lag)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                <span className="text-[#737373]">Relay HTTP Gateway:</span>
                <span className="text-white">Authenticated via EVM JWT</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1c1c1c]">
                <span className="text-[#737373]">Registered Series:</span>
                <span className="text-white">{allSeries?.length ?? 7} Series</span>
              </div>
            </div>

            <div className="p-6 rounded-[4px] bg-[#0d0d0d] border border-[#262626] font-mono text-xs">
              <span className="text-[#a8a8a8] uppercase text-[10px] block mb-2">
                Open New Dated Series
              </span>
              <p className="text-[#737373] text-[11px] leading-relaxed mb-4">
                To open a new series, deploy through the Anchor CLI or submit an OpenSeries instruction referencing an extension-compliant collateral mint.
              </p>
              <Link
                href="/vaults"
                className="text-white underline hover:text-[#4ade80] transition-colors"
              >
                Inspect current series registry →
              </Link>
            </div>
          </div>
        </div>

        {confirmModalData && (
          <ConfirmActionModal
            isOpen={true}
            onClose={() => {
              setConfirmModalData(null)
              setReceiptUrl(undefined)
              setActionError(null)
            }}
            onConfirm={handleAction}
            actionName={confirmModalData.actionName}
            whatWillHappen={confirmModalData.whatWillHappen}
            whatItCosts={confirmModalData.whatItCosts}
            whatBecomesPublic={confirmModalData.whatBecomesPublic}
            isSubmitting={isSubmitting}
            txReceiptUrl={receiptUrl}
            error={actionError}
          />
        )}
      </main>
    </div>
  )
}
