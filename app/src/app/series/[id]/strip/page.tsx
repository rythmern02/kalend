'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '../../../../components/Header'
import { ModeBar, useModeBarState } from '../../../../components/ModeBar'
import { VisibilityPanel } from '../../../../components/VisibilityPanel'
import { ConfirmActionModal } from '../../../../components/ConfirmActionModal'
import { DataSourceTag } from '../../../../components/DataSourceTag'
import { StatusChip } from '../../../../components/StatusChip'
import { ArrowLeft, Layers, ArrowDownUp, Check, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries } from '../../../../lib/api'
import { VisibilityItem } from '../../../../lib/types'

import { useWallet } from '../../../../lib/wallet'
import { getMintDecimals, parseUnits } from '../../../../lib/solana'
import { stripTokens, mergeTokens } from '../../../../lib/kalend-client'
import { TiltCard } from '../../../../components/TiltCard'

export default function StripMergePage() {
  const params = useParams()
  const seriesId = params?.id as string
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  const [activeTab, setActiveTab] = useState<'strip' | 'merge'>('strip')
  const [amount, setAmount] = useState<string>('1000')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const series = allSeries?.find((s) => s.pubkey === seriesId)

  const visibilityItems: VisibilityItem[] = [
    {
      label: 'Operation',
      value: activeTab === 'strip' ? 'Strip (Deposit & Mint)' : 'Merge (Burn & Withdraw)',
      visibility: 'public_solana',
      description: 'Transaction instruction logged on Solana',
    },
    {
      label: 'Collateral Amount',
      value: `${amount || '0'} Raw Collateral`,
      visibility: modeBarState.isPrivacyMode ? 'enclave_only' : 'public_solana',
      description: modeBarState.isPrivacyMode
        ? 'Encrypted in wallet via Token-2022 confidential transfer'
        : 'Visible in plaintext on Solana',
    },
    {
      label: 'PT & YT Minted',
      value: `${amount || '0'} PT + ${amount || '0'} YT`,
      visibility: 'public_solana',
      description: '1:1 mathematical conservation invariant (INV1 & INV2)',
    },
    {
      label: 'Wallet Owner',
      value: wallet.walletAddress || 'Wallet not connected',
      visibility: 'public_solana',
      description: 'Token account owner on Solana',
    },
  ]

  const handleConfirmAction = async () => {
    if (!wallet.connected) {
      wallet.setShowConnectModal(true)
      return
    }
    if (!series) {
      setActionError('No active series account found on-chain.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)
    try {
      const parsedAmount = parseUnits(amount, await getMintDecimals(wallet.connection, series.collateral_mint))
      let txSig: string
      if (activeTab === 'strip') {
        txSig = await stripTokens(wallet, {
          seriesPubkey: series.pubkey,
          amount: parsedAmount,
        })
      } else {
        txSig = await mergeTokens(wallet, {
          seriesPubkey: series.pubkey,
          amount: parsedAmount,
        })
      }
      setReceiptUrl(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`)
    } catch (err: any) {
      console.error('Strip/Merge transaction failed:', err)
      setActionError(err.message || 'Transaction rejected on-chain')
    } finally {
      setIsSubmitting(false)
    }
  }

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

        <div className="mb-10">
          <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
            Base-Layer Token Splitting
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
            Strip & Merge Collateral
          </h1>
          <p className="text-sm text-[#a8a8a8] max-w-2xl leading-relaxed">
            Deposit yield-bearing collateral to mint matching Principal Tokens (PT) and Yield Tokens (YT) 1:1, or burn both to merge and retrieve raw collateral before maturity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Action Ticket */}
          <div className="lg:col-span-7">
            <TiltCard accent="emerald" intensity={4} enableGlare={true}>
              <div className="p-7">
                {/* Tab Selector */}
                <div className="flex border-b border-[#222222] mb-6">
                  <button
                    onClick={() => setActiveTab('strip')}
                    className={`flex-1 py-3 text-xs font-mono font-medium border-b-2 transition-colors ${
                      activeTab === 'strip'
                        ? 'border-white text-white'
                        : 'border-transparent text-[#a8a8a8] hover:text-white'
                    }`}
                  >
                    Strip (Deposit → PT + YT)
                  </button>
                  <button
                    onClick={() => setActiveTab('merge')}
                    className={`flex-1 py-3 text-xs font-mono font-medium border-b-2 transition-colors ${
                      activeTab === 'merge'
                        ? 'border-white text-white'
                        : 'border-transparent text-[#a8a8a8] hover:text-white'
                    }`}
                  >
                    Merge (PT + YT → Withdraw)
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-2">
                      <span className="text-[#a8a8a8]">
                        {activeTab === 'strip' ? 'Deposit Collateral Amount' : 'Merge PT/YT Amount'}
                      </span>
                      <button
                        onClick={() => setAmount('1000000')}
                        className="text-[#4ade80] hover:underline"
                      >
                        Max: 1,000,000
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-3.5 px-4 text-white font-mono text-lg focus:outline-none transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#a8a8a8]">
                        {series ? 'RAW' : 'TOKENS'}
                      </span>
                    </div>
                  </div>

                  {/* Preview Box */}
                  <div className="p-4 bg-[#121212] border border-[#222222] rounded-[2px] font-mono text-xs space-y-2">
                    <span className="text-[#737373] uppercase tracking-wider block text-[10px] mb-2">
                      Output Preview (1:1 Conservation)
                    </span>
                    <div className="flex justify-between">
                      <span className="text-[#a8a8a8]">Principal Tokens (PT):</span>
                      <span className="text-white font-medium">+{amount || '0'} PT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#a8a8a8]">Yield Tokens (YT):</span>
                      <span className="text-white font-medium">+{amount || '0'} YT</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#1e1e1e]">
                      <span className="text-[#a8a8a8]">Maturity Timestamp:</span>
                      <span className="text-[#fbbf24]">
                        {series
                          ? new Date(series.maturity_ts * 1000).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsConfirmOpen(true)}
                  className="w-full py-3.5 bg-white text-black font-semibold text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                >
                  {activeTab === 'strip'
                    ? `Strip ${amount || '0'} Collateral`
                    : `Merge ${amount || '0'} PT & YT`}
                </button>
              </div>
            </TiltCard>
          </div>

          {/* Visibility Panel Column */}
          <div className="lg:col-span-5">
            <VisibilityPanel
              items={visibilityItems}
              title="Who can see this"
              subtitle="Base-layer collateral transaction visibility"
            />
          </div>
        </div>

        <ConfirmActionModal
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false)
            setReceiptUrl(undefined)
            setActionError(null)
          }}
          onConfirm={handleConfirmAction}
          actionName={
            activeTab === 'strip'
              ? `Strip ${amount} Collateral to PT & YT`
              : `Merge ${amount} PT & YT to Collateral`
          }
          whatWillHappen={
            activeTab === 'strip'
              ? `Transfers ${amount} raw collateral tokens into the on-chain Series vault and mints exactly ${amount} PT and ${amount} YT to your wallet.`
              : `Burns ${amount} PT and ${amount} YT from your wallet and withdraws ${amount} raw collateral tokens from the on-chain vault back to you.`
          }
          whatItCosts="~0.002 SOL network fee + Token account rent"
          whatBecomesPublic={
            modeBarState.isPrivacyMode
              ? 'Transaction signatures and token balance updates on Solana. Plaintext balances hidden if using confidential mode.'
              : 'Sender address, token amounts, and vault balance updates on the public Solana ledger.'
          }
          isSubmitting={isSubmitting}
          txReceiptUrl={receiptUrl}
          error={actionError}
        />
      </main>
    </div>
  )
}
