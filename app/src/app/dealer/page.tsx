'use client'

import React, { useState } from 'react'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import { DataSourceTag } from '../../components/DataSourceTag'
import { ConfirmActionModal } from '../../components/ConfirmActionModal'
import {
  Inbox,
  Clock,
  Shield,
  Send,
  Lock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries } from '../../lib/api'

import { useWallet } from '../../lib/wallet'
import { sealOrderEnvelopeWithSigner } from '../../lib/crypto'
import { ENCLAVE_PUBLIC_KEY, CURRENT_KID, RELAY_API_URL } from '../../lib/constants'

export default function DealerDeskPage() {
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  const [selectedRound, setSelectedRound] = useState<string>('')
  const [quotePrice, setQuotePrice] = useState<string>('0.9650')
  const [quoteMaxSize, setQuoteMaxSize] = useState<string>('1200000')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false)

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  // Fetch live rounds from Relay
  const { data: relayRounds = [], refetch: refetchRounds } = useQuery({
    queryKey: ['relay-rounds'],
    queryFn: async () => {
      try {
        const res = await fetch(`${RELAY_API_URL}/rfq/rounds`)
        if (!res.ok) return []
        const data = await res.json()
        return (data.rounds || []).filter((r: any) => r.status === 'open')
      } catch {
        return []
      }
    },
    refetchInterval: 5000,
  })

  // Select first open round if none selected
  React.useEffect(() => {
    if (!selectedRound && relayRounds.length > 0) {
      setSelectedRound(relayRounds[0].round_id)
    }
  }, [relayRounds, selectedRound])

  const handleQuoteSubmit = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      wallet.setShowConnectModal(true)
      return
    }
    if (!selectedRound) {
      setActionError('Please select an active RFQ round first.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    try {
      const payload = {
        v: 1,
        round_id: selectedRound,
        dealer: wallet.walletAddress,
        price: quotePrice,
        max_size: quoteMaxSize,
        nonce: Date.now(),
        not_after: Math.floor(Date.now() / 1000) + 300,
      }

      const sealed = await sealOrderEnvelopeWithSigner(
        ENCLAVE_PUBLIC_KEY,
        selectedRound,
        CURRENT_KID,
        'KALEND/v1/quote',
        payload,
        wallet.publicKey.toBytes(),
        (msg) => wallet.signMessage(msg)
      )

      const res = await fetch(`${RELAY_API_URL}/rfq/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: selectedRound,
          enc: sealed.enc,
          ciphertext: sealed.ciphertext,
          kid: CURRENT_KID,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Relay rejected quote: ${errText}`)
      }

      setSubmissionSuccess(true)
      refetchRounds()
    } catch (err: any) {
      console.error('Quote submission failed:', err)
      setActionError(err.message || 'Quote submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header
        userRole="Authorized Dealer Desk"
      />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-10 border-b border-[#222222] gap-4">
          <div>
            <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
              Institutional Market Maker Terminal
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-2">
              Dealer Desk
            </h1>
            <p className="text-sm text-[#a8a8a8] max-w-xl">
              Competitive quote submission for authorized market makers. Sealed quotes are evaluated greedily in the Chainlink CRE enclave via knapsack waterfall matching.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs shrink-0">
            <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-[2px]">
              <span className="text-[#737373] block mb-1">Standard Escrow Lock</span>
              <span className="text-[#4ade80] font-medium">5,000,000 USDC</span>
            </div>
            <div className="p-3 bg-[#0a0a0a] border border-[#222222] rounded-[2px]">
              <span className="text-[#737373] block mb-1">Fill Rate (30d)</span>
              <span className="text-white font-medium">84.2%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Inbox Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[#a8a8a8] px-1">
              <span className="uppercase">Open Auction Rounds</span>
              <span>{relayRounds.length} Active</span>
            </div>

            {relayRounds.length === 0 ? (
              <div className="p-8 rounded-[4px] bg-[#0a0a0a] border border-[#222222] text-center font-mono text-xs">
                <span className="text-[#a8a8a8] block mb-2">No Active RFQ Rounds</span>
                <p className="text-[#555] text-[11px] leading-relaxed">
                  Awaiting new RFQ requests from institutional requesters. Check back when an auction round opens.
                </p>
              </div>
            ) : (
              relayRounds.map((rnd: any) => (
                <div
                  key={rnd.round_id}
                  onClick={() => setSelectedRound(rnd.round_id)}
                  className={`p-5 rounded-[4px] border cursor-pointer transition-colors ${
                    selectedRound === rnd.round_id
                      ? 'bg-[#141414] border-white text-white'
                      : 'bg-[#0a0a0a] border-[#242424] text-[#a8a8a8] hover:border-[#404040]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-white font-medium">
                      Round {rnd.round_id.slice(0, 8)}...
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs text-[#fbbf24]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{rnd.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs text-[#737373]">
                    <div>
                      <span className="block">Series:</span>
                      <span className="text-white">{rnd.series.slice(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="block">Quotes:</span>
                      <span className="text-white">{rnd.quotes?.length ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Dealer Performance & Escrow */}
            <div className="p-5 rounded-[4px] bg-[#0d0d0d] border border-[#242424] font-mono text-xs space-y-3 mt-6">
              <span className="text-[#a8a8a8] uppercase text-[10px] block">
                Escrow Status (Uniform Round Allocation)
              </span>
              <p className="text-[#737373] text-[11px] leading-relaxed">
                Dealers lock a uniform standard round amount (5,000,000 USDC) rather than exact quote sizes, preventing size leakage to the relay or blockchain observers.
              </p>
              <div className="flex justify-between pt-2 border-t border-[#1e1e1e]">
                <span className="text-[#a8a8a8]">Locked in Escrow:</span>
                <span className="text-white">5,000,000 USDC</span>
              </div>
            </div>
          </div>

          {/* Quote Ticket Column */}
          <div className="lg:col-span-7">
            <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] p-6">
              <h2 className="font-serif text-xl text-white font-medium mb-6">
                Submit Sealed Quote
              </h2>

              <div className="space-y-6 mb-8 font-mono text-xs">
                <div>
                  <label className="text-[#a8a8a8] uppercase block mb-2">
                    Quote Price (Discounted Clean Price)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-3 px-4 text-white text-base focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373]">
                      USDC / PT
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[#a8a8a8] uppercase block mb-2">
                    Maximum Fill Size Capacity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={quoteMaxSize}
                      onChange={(e) => setQuoteMaxSize(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-3 px-4 text-white text-base focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373]">
                      PT
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#121212] border border-[#222222] rounded-[2px] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Maximum Capital Commitment:</span>
                    <span className="text-white font-medium">
                      ${(Number(quoteMaxSize || '0') * Number(quotePrice || '0')).toLocaleString()} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Implied Annualized Yield:</span>
                    <span className="text-[#4ade80]">
                      {((1 / Number(quotePrice || '1') - 1) * (365 / 90) * 100).toFixed(2)}% APY
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsConfirmOpen(true)}
                className="w-full py-3 bg-white text-black font-medium text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Seal and Submit Quote ({quotePrice} USDC)</span>
              </button>
            </div>
          </div>
        </div>

        <ConfirmActionModal
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false)
            setActionError(null)
            setSubmissionSuccess(false)
          }}
          onConfirm={handleQuoteSubmit}
          actionName={`Submit Sealed Quote (${quotePrice} USDC)`}
          whatWillHappen={`Encrypts your quote (${quotePrice} USDC for up to ${quoteMaxSize} PT) to the Chainlink CRE enclave public key and forwards ciphertext to the relay.`}
          whatItCosts="Zero gas (Client-side Ed25519 signature + HPKE encryption)"
          whatBecomesPublic="Zero order terms are public. Only the signed fill receipt touches Solana if your quote wins matching."
          isSubmitting={isSubmitting}
          txReceiptUrl={submissionSuccess ? 'https://explorer.solana.com' : undefined}
          error={actionError}
        />
      </main>
    </div>
  )
}
