'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '../../../../components/Header'
import { ModeBar, useModeBarState } from '../../../../components/ModeBar'
import { DataSourceTag } from '../../../../components/DataSourceTag'
import { StatusChip } from '../../../../components/StatusChip'
import { ConfirmActionModal } from '../../../../components/ConfirmActionModal'
import {
  ArrowLeft,
  Scale,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries } from '../../../../lib/api'

export default function MaturityRedeemPage() {
  const params = useParams()
  const seriesId = params?.id as string
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')

  const [redeemPtAmount, setRedeemPtAmount] = useState<string>('1000000')
  const [claimYtAmount, setClaimYtAmount] = useState<string>('1000000')
  const [activeModal, setActiveModal] = useState<'pt' | 'yt' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const series = allSeries?.find((s) => s.pubkey === seriesId) || allSeries?.[0]

  // Plain-sentence settlement math:
  // pt_redeem_raw = a * idx_open / idx_settle
  // yt_claim_raw = a - pt_redeem_raw
  const idxOpen = 1.0
  const idxSettle = 1.0712 // 7.12% growth
  const ptRedeemUnit = (idxOpen / idxSettle).toFixed(6)
  const ytClaimUnit = (1 - Number(ptRedeemUnit)).toFixed(6)

  const handleAction = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setReceiptUrl(`https://explorer.solana.com/tx/mock-redeem-${Date.now()}?cluster=devnet`)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a8a8] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio</span>
        </Link>

        <div className="mb-10">
          <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
            Maturity Finality & Collateral Payout
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
            Maturity Settlement & Redemption
          </h1>
          <p className="text-sm text-[#a8a8a8] max-w-2xl leading-relaxed">
            The Chainlink CRE Oracle workflow attested the final maturity index. Redeem Principal Tokens for underlying collateral, or claim accumulated yield using Yield Tokens.
          </p>
        </div>

        {/* Settlement Index Card */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#1f1f1f] gap-4">
            <div>
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-1">
                Series Identification
              </span>
              <span className="font-mono text-sm text-white">
                {series?.pubkey || seriesId}
              </span>
            </div>
            <div>
              <StatusChip status="Settled" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs mb-6">
            <div className="p-4 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Initial Opening Index</span>
              <span className="text-xl text-white font-medium block">1.000000 WAD</span>
              <span className="text-[11px] text-[#737373]">At series opening</span>
            </div>

            <div className="p-4 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Attested Settlement Index</span>
              <span className="text-xl text-[#4ade80] font-medium block">1.071200 WAD</span>
              <span className="text-[11px] text-[#4ade80]">+7.12% Realized Yield</span>
            </div>

            <div className="p-4 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Corporate Split Ratio</span>
              <span className="text-xl text-white font-medium block">1.0 : 1.0</span>
              <span className="text-[11px] text-[#737373]">No dilution adjustment</span>
            </div>
          </div>

          {/* Plain sentence settlement math */}
          <div className="p-4 bg-[#0d0d0d] border border-[#262626] rounded-[2px] text-xs font-mono">
            <span className="text-[#a8a8a8] uppercase text-[10px] block mb-1">
              Settlement Payout Formula
            </span>
            <p className="text-white leading-relaxed">
              For every 1.000000 PT held, you receive exactly {ptRedeemUnit} underlying collateral tokens, while every 1.000000 YT claims the remaining {ytClaimUnit} yield tokens, conserving 100% of deposited vault collateral.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {/* Redeem PT */}
          <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-[#4ade80] uppercase">
                  Principal Token Payout
                </span>
              </div>
              <h3 className="font-serif text-xl text-white font-medium mb-2">
                Redeem PT for Collateral
              </h3>
              <p className="text-xs text-[#a8a8a8] mb-6 leading-relaxed">
                Burn Principal Tokens to claim your guaranteed underlying collateral allocation.
              </p>

              <div className="space-y-4 mb-6 font-mono text-xs">
                <div>
                  <span className="text-[#a8a8a8] block mb-1">Redeem Amount:</span>
                  <input
                    type="number"
                    value={redeemPtAmount}
                    onChange={(e) => setRedeemPtAmount(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-2.5 px-3 text-white font-mono text-base focus:outline-none"
                  />
                </div>
                <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                  <span className="text-[#737373] block mb-0.5">Estimated Collateral Received:</span>
                  <span className="text-white font-medium text-sm">
                    {(Number(redeemPtAmount || '0') * Number(ptRedeemUnit)).toFixed(2)} Collateral
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('pt')}
              className="w-full py-3 bg-white text-black font-medium text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-colors"
            >
              Redeem {redeemPtAmount} PT
            </button>
          </div>

          {/* Claim YT */}
          <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-[#fbbf24] uppercase">
                  Yield Token Payout
                </span>
              </div>
              <h3 className="font-serif text-xl text-white font-medium mb-2">
                Claim YT Realized Yield
              </h3>
              <p className="text-xs text-[#a8a8a8] mb-6 leading-relaxed">
                Burn Yield Tokens to claim all accumulated yield and corporate dividends in-kind.
              </p>

              <div className="space-y-4 mb-6 font-mono text-xs">
                <div>
                  <span className="text-[#a8a8a8] block mb-1">Claim Amount:</span>
                  <input
                    type="number"
                    value={claimYtAmount}
                    onChange={(e) => setClaimYtAmount(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-2.5 px-3 text-white font-mono text-base focus:outline-none"
                  />
                </div>
                <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                  <span className="text-[#737373] block mb-0.5">Estimated Yield Claimed:</span>
                  <span className="text-[#4ade80] font-medium text-sm">
                    {(Number(claimYtAmount || '0') * Number(ytClaimUnit)).toFixed(2)} Yield Tokens
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('yt')}
              className="w-full py-3 bg-white text-black font-medium text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-colors"
            >
              Claim Yield on {claimYtAmount} YT
            </button>
          </div>
        </div>

        <ConfirmActionModal
          isOpen={activeModal !== null}
          onClose={() => {
            setActiveModal(null)
            setReceiptUrl(undefined)
          }}
          onConfirm={handleAction}
          actionName={
            activeModal === 'pt'
              ? `Redeem ${redeemPtAmount} PT for Underlying Collateral`
              : `Claim Yield on ${claimYtAmount} YT`
          }
          whatWillHappen={
            activeModal === 'pt'
              ? `Burns ${redeemPtAmount} PT and transfers ${(Number(redeemPtAmount || '0') * Number(ptRedeemUnit)).toFixed(2)} raw collateral tokens from the series vault to your wallet.`
              : `Burns ${claimYtAmount} YT and transfers ${(Number(claimYtAmount || '0') * Number(ytClaimUnit)).toFixed(2)} accumulated yield tokens to your wallet.`
          }
          whatItCosts="~0.002 SOL network execution fee"
          whatBecomesPublic="Redemption transaction signatures and updated token balances on the Solana blockchain."
          isSubmitting={isSubmitting}
          txReceiptUrl={receiptUrl}
        />
      </main>
    </div>
  )
}
