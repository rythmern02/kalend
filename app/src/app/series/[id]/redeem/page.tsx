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

import { useWallet } from '../../../../lib/wallet'
import { getMintDecimals, parseUnits } from '../../../../lib/solana'
import { redeemPt, claimYt, settleOnchain } from '../../../../lib/kalend-client'
import { TiltCard } from '../../../../components/TiltCard'

export default function MaturityRedeemPage() {
  const params = useParams()
  const seriesId = params?.id as string
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  const [redeemPtAmount, setRedeemPtAmount] = useState<string>('1000')
  const [claimYtAmount, setClaimYtAmount] = useState<string>('1000')
  const [activeModal, setActiveModal] = useState<'pt' | 'yt' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>()

  const { data: allSeries, refetch: refetchSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const series = allSeries?.find((s) => s.pubkey === seriesId)

  // Plain-sentence settlement math:
  // pt_redeem_raw = a * idx_open / idx_settle
  // yt_claim_raw = a - pt_redeem_raw
  const isSettled = series?.status === 1
  const isMatured = series ? series.maturity_ts <= Math.floor(Date.now() / 1000) : false
  const idxOpen = series && BigInt(series.idx_open) > 0n ? Number(BigInt(series.idx_open) / 10n ** 9n) / 1e9 : 1.0
  const idxSettle = series && isSettled ? Number(BigInt(series.idx_settle) / 10n ** 9n) / 1e9 : idxOpen
  const [settleBusy, setSettleBusy] = useState(false)

  const handleSettle = async () => {
    if (!wallet.connected) return wallet.setShowConnectModal(true)
    if (!series) return
    setSettleBusy(true)
    setActionError(null)
    try {
      const sig = await settleOnchain(wallet, { seriesPubkey: series.pubkey, indexSourcePubkey: series.index_source })
      setReceiptUrl(`https://explorer.solana.com/tx/${sig}?cluster=devnet`)
      await refetchSeries()
    } catch (err: any) {
      setActionError(err.message || 'Settlement rejected on-chain')
    } finally {
      setSettleBusy(false)
    }
  }
  const ptRedeemUnit = idxSettle > 0 ? (Math.min(idxOpen, idxSettle) / idxSettle).toFixed(6) : '1.000000'
  const ytClaimUnit = idxSettle > 0 ? (Math.max(0, idxSettle - idxOpen) / idxSettle).toFixed(6) : '0.000000'

  const handleAction = async () => {
    if (!wallet.connected) {
      wallet.setShowConnectModal(true)
      return
    }
    if (!series) {
      setActionError('No active series found')
      return
    }

    setIsSubmitting(true)
    setActionError(null)
    try {
      let txSig: string
      if (activeModal === 'pt') {
        const parsedAmount = parseUnits(redeemPtAmount, await getMintDecimals(wallet.connection, series.collateral_mint))
        txSig = await redeemPt(wallet, {
          seriesPubkey: series.pubkey,
          amount: parsedAmount,
        })
      } else {
        const parsedAmount = parseUnits(claimYtAmount, await getMintDecimals(wallet.connection, series.collateral_mint))
        txSig = await claimYt(wallet, {
          seriesPubkey: series.pubkey,
          amount: parsedAmount,
        })
      }
      setReceiptUrl(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`)
    } catch (err: any) {
      console.error('Maturity action failed:', err)
      setActionError(err.message || 'Transaction rejected on-chain')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
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
            After maturity anyone can settle a stake-pool series: the program reads the pool's exchange rate itself. Then PT redeems principal and YT claims the growth, both in kind.
          </p>
        </div>

        {/* Settlement Index Card */}
        <TiltCard accent="default" intensity={3} enableGlare={false} className="mb-10">
          <div className="p-6">
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
                <span className="text-[#737373] block mb-1">Index at open</span>
                <span className="text-xl text-white font-medium block">{idxOpen.toFixed(9)}</span>
                <span className="text-[11px] text-[#737373]">Series.idx_open (on-chain)</span>
              </div>

              <div className="p-4 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                <span className="text-[#737373] block mb-1">Index at settlement</span>
                <span className="text-xl text-[#4ade80] font-medium block">{isSettled ? idxSettle.toFixed(9) : 'not settled'}</span>
                <span className="text-[11px] text-[#4ade80]">
                  {isSettled ? `${((idxSettle / idxOpen - 1) * 100).toFixed(4)}% growth over the term` : 'Settles at or after maturity by the on-chain clock'}
                </span>
              </div>

              <div className="p-4 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
                <span className="text-[#737373] block mb-1">Maturity</span>
                <span className="text-xl text-white font-medium block">{series ? new Date(series.maturity_ts * 1000).toISOString().slice(0, 16).replace('T', ' ') : '—'}</span>
                <span className="text-[11px] text-[#737373]">UTC</span>
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
        </TiltCard>

        {!series && (
          <div className="p-4 mb-8 rounded-[2px] border border-[#4a1b1b] bg-[#1f0c0c] font-mono text-xs text-[#f87171]">
            Series {seriesId} is not in the on-chain Registry.
          </div>
        )}

        {series && isMatured && !isSettled && (
          <div className="p-5 mb-8 rounded-[3px] border border-[#4d360d] bg-[#1f1505] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <span className="text-[#fbbf24]">
              Matured, not yet settled. settle_onchain is permissionless: it reads the stake pool rate on-chain and records idx_settle once.
            </span>
            <button onClick={handleSettle} disabled={settleBusy} className="px-4 py-2 rounded-[2px] bg-white text-black font-semibold disabled:opacity-50 shrink-0">
              {settleBusy ? 'Settling…' : 'Settle series'}
            </button>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {/* Redeem PT */}
          <TiltCard accent="emerald" intensity={4} enableGlare={true}>
            <div className="p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-[#4ade80] uppercase font-semibold">
                    Principal Token Payout
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-white font-medium mb-2">
                  Redeem PT for Collateral
                </h3>
                <p className="text-xs text-[#a8a8a8] mb-6 leading-relaxed">
                  Burn PT to receive principal in kind: amount x min(idx_open, idx_settle) / idx_settle.
                </p>

                <div className="space-y-4 mb-6 font-mono text-xs">
                  <div>
                    <span className="text-[#a8a8a8] block mb-1">Redeem Amount:</span>
                    <input
                      type="number"
                      value={redeemPtAmount}
                      onChange={(e) => setRedeemPtAmount(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-3 px-3.5 text-white font-mono text-base focus:outline-none transition-colors"
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
                className="w-full py-3.5 bg-white text-black font-semibold text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                Redeem {redeemPtAmount} PT
              </button>
            </div>
          </TiltCard>

          {/* Claim YT */}
          <TiltCard accent="amber" intensity={4} enableGlare={true}>
            <div className="p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-[#fbbf24] uppercase font-semibold">
                    Yield Token Payout
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-white font-medium mb-2">
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
                      className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-3 px-3.5 text-white font-mono text-base focus:outline-none transition-colors"
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
                className="w-full py-3.5 bg-white text-black font-semibold text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                Claim Yield on {claimYtAmount} YT
              </button>
            </div>
          </TiltCard>
        </div>

        <ConfirmActionModal
          isOpen={activeModal !== null}
          onClose={() => {
            setActiveModal(null)
            setReceiptUrl(undefined)
            setActionError(null)
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
          error={actionError}
        />
      </main>
    </div>
  )
}
