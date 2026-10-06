'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '../../../components/Header'
import { ModeBar, useModeBarState } from '../../../components/ModeBar'
import { VisibilityPanel } from '../../../components/VisibilityPanel'
import { DataSourceTag } from '../../../components/DataSourceTag'
import { StatusChip } from '../../../components/StatusChip'
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Lock,
  Layers,
  Scale,
  Sparkles,
  Check,
  Send,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries } from '../../../lib/api'
import { VisibilityItem } from '../../../lib/types'
import { useWallet } from '../../../lib/wallet'
import { sealOrderEnvelopeWithSigner } from '../../../lib/crypto'
import { ENCLAVE_PUBLIC_KEY, CURRENT_KID, RELAY_API_URL } from '../../../lib/constants'
import { TiltCard } from '../../../components/TiltCard'

export default function NewRfqPage() {
  const router = useRouter()
  const modeBarState = useModeBarState()
  const wallet = useWallet()
  const walletAddress = wallet.walletAddress || ''

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [vaultTier, setVaultTier] = useState<'conservative' | 'balanced' | 'alpha'>('conservative')
  const [side, setSide] = useState<'SellPT' | 'SellYT'>('SellPT')
  const [size, setSize] = useState<string>('1000000')
  const [limitRateBps, setLimitRateBps] = useState<number>(495) // 4.95%
  const [windowLengthSec, setWindowLengthSec] = useState<number>(300)

  // Execution state
  const [isSealing, setIsSealing] = useState(false)
  const [sealingStepText, setSealingStepText] = useState('')
  const [roundId, setRoundId] = useState<string>('')

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  // Selected series based on tier
  const kindMap: Record<string, number> = { conservative: 3, balanced: 0, alpha: 1 }
  const selectedSeries = allSeries?.find((s) => s.index_kind === kindMap[vaultTier]) || allSeries?.[0]

  const daysLeft = selectedSeries
    ? Math.max(1, Math.ceil((selectedSeries.maturity_ts - Date.now() / 1000) / 86400))
    : 90

  // Live implied price from (1/p - 1) * 365/d => p = 1 / (1 + r * d / 365)
  const rateDecimal = limitRateBps / 10000
  const impliedPrice = (1 / (1 + rateDecimal * (daysLeft / 365))).toFixed(4)

  const visibilityItems: VisibilityItem[] = [
    {
      label: 'Order Type',
      value: `${side} (${vaultTier.toUpperCase()})`,
      visibility: 'sealed',
      description: 'Encrypted in client-side HPKE envelope',
    },
    {
      label: 'Requested Size',
      value: `${size} PT`,
      visibility: 'sealed',
      description: 'Hidden from public chain & relay',
    },
    {
      label: 'Limit Execution Price',
      value: `$${impliedPrice} (${(limitRateBps / 100).toFixed(2)}% APY)`,
      visibility: 'sealed',
      description: 'Decrypted solely within AWS Nitro TEE enclave',
    },
    {
      label: 'Escrow Locked',
      value: `${size} PT Collateral`,
      visibility: modeBarState.isPrivacyMode ? 'enclave_only' : 'public_solana',
      description: 'Locked in program Escrow PDA for RFQ duration',
    },
    {
      label: 'Enclave Key ID',
      value: CURRENT_KID,
      visibility: 'public_solana',
      description: 'Public hardware attestation identifier',
    },
  ]

  const handleSealAndSubmit = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      wallet.setShowConnectModal(true)
      return
    }

    setIsSealing(true)
    const newRoundId = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join('')
    setRoundId(newRoundId)

    try {
      // Step 1: Local Signing with connected Solana wallet
      setSealingStepText('Step 1 of 3: Signing order with wallet private key...')

      const payload = {
        v: 1,
        round_id: newRoundId,
        series: selectedSeries?.pubkey || 'CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY',
        side,
        size,
        limit_price: impliedPrice,
        quote_mint: selectedSeries?.quote_mint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        requester: wallet.walletAddress,
        nonce: Date.now(),
        not_after: Math.floor(Date.now() / 1000) + windowLengthSec,
      }

      // Step 2: Client-Side HPKE Sealing to Enclave Public Key
      setSealingStepText('Step 2 of 3: HPKE (RFC 9180) sealing to Enclave Public Key...')

      const sealed = await sealOrderEnvelopeWithSigner(
        ENCLAVE_PUBLIC_KEY,
        newRoundId,
        CURRENT_KID,
        'KALEND/v1/request',
        payload,
        wallet.publicKey.toBytes(),
        (msg) => wallet.signMessage(msg)
      )

      // Step 3: Relay Routing (Ciphertext Only)
      setSealingStepText('Step 3 of 3: Submitting sealed ciphertext to Relay (Zero Plaintext)...')

      const res = await fetch(`${RELAY_API_URL}/rfq/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: newRoundId,
          series: payload.series,
          duration: windowLengthSec,
          enc: sealed.enc,
          ciphertext: sealed.ciphertext,
          kid: CURRENT_KID,
        }),
      }).catch((e) => {
        throw new Error(`Relay connection failed: ${e.message}`)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Relay rejected request: ${errorText}`)
      }

      // Redirect to round status
      router.push(`/rfq/${newRoundId}`)
    } catch (err: any) {
      console.error('RFQ sealing/submission failed:', err)
      alert(`RFQ Submission Failed: ${err.message || 'Unknown error'}`)
      setIsSealing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#a8a8a8] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="mb-10">
          <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
            Confidential RFQ Ticket Wizard
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
            Request a Private Quote
          </h1>
          <p className="text-sm text-[#a8a8a8] max-w-2xl leading-relaxed">
            Configure your order parameters. Your requested size, limit rate, and wallet address are sealed inside the browser using HPKE before leaving your machine.
          </p>
        </div>

        {/* 3-Step Wizard Navigation */}
        <div className="grid grid-cols-3 gap-2 mb-10 max-w-2xl font-mono text-xs">
          <div
            onClick={() => !isSealing && setStep(1)}
            className={`p-3 rounded-[2px] border cursor-pointer transition-colors ${
              step === 1
                ? 'bg-[#141414] border-white text-white'
                : 'bg-[#0a0a0a] border-[#222222] text-[#737373]'
            }`}
          >
            <span className="block text-[10px] uppercase text-[#a8a8a8]">Step 1</span>
            <span className="font-medium">1. Vault & Side</span>
          </div>

          <div
            onClick={() => !isSealing && setStep(2)}
            className={`p-3 rounded-[2px] border cursor-pointer transition-colors ${
              step === 2
                ? 'bg-[#141414] border-white text-white'
                : 'bg-[#0a0a0a] border-[#222222] text-[#737373]'
            }`}
          >
            <span className="block text-[10px] uppercase text-[#a8a8a8]">Step 2</span>
            <span className="font-medium">2. Size & Rate</span>
          </div>

          <div
            onClick={() => !isSealing && setStep(3)}
            className={`p-3 rounded-[2px] border cursor-pointer transition-colors ${
              step === 3
                ? 'bg-[#141414] border-white text-white'
                : 'bg-[#0a0a0a] border-[#222222] text-[#737373]'
            }`}
          >
            <span className="block text-[10px] uppercase text-[#a8a8a8]">Step 3</span>
            <span className="font-medium">3. Seal & Send</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Wizard Form */}
          <div className="lg:col-span-7">
            <TiltCard accent="default" intensity={4} enableGlare={true}>
              <div className="p-7">
                {/* STEP 1: Vault & Side */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-3">
                        Select Risk-Tier Vault
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setVaultTier('conservative')}
                          className={`p-4 rounded-[3px] border text-left transition-all ${
                            vaultTier === 'conservative'
                              ? 'bg-[#0f1f14] border-[#4ade80] text-white shadow-[0_0_15px_-3px_rgba(74,222,128,0.3)]'
                              : 'bg-[#0a0a0a] border-[#242424] text-[#a8a8a8] hover:border-[#404040]'
                          }`}
                        >
                          <span className="text-[10px] font-mono text-[#4ade80] uppercase block mb-1 font-semibold">
                            Tier 1
                          </span>
                          <span className="font-serif text-sm font-medium text-white block mb-1">
                            Conservative
                          </span>
                          <span className="text-[11px] text-[#737373] block">Ondo USDY (4.85%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVaultTier('balanced')}
                          className={`p-4 rounded-[3px] border text-left transition-all ${
                            vaultTier === 'balanced'
                              ? 'bg-[#1f190b] border-[#fbbf24] text-white shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]'
                              : 'bg-[#0a0a0a] border-[#242424] text-[#a8a8a8] hover:border-[#404040]'
                          }`}
                        >
                          <span className="text-[10px] font-mono text-[#fbbf24] uppercase block mb-1 font-semibold">
                            Tier 2
                          </span>
                          <span className="font-serif text-sm font-medium text-white block mb-1">
                            Balanced
                          </span>
                          <span className="text-[11px] text-[#737373] block">JitoSOL LST (7.12%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVaultTier('alpha')}
                          className={`p-4 rounded-[3px] border text-left transition-all ${
                            vaultTier === 'alpha'
                              ? 'bg-[#0b171c] border-[#22d3ee] text-white shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]'
                              : 'bg-[#0a0a0a] border-[#242424] text-[#a8a8a8] hover:border-[#404040]'
                          }`}
                        >
                          <span className="text-[10px] font-mono text-[#22d3ee] uppercase block mb-1 font-semibold">
                            Tier 3
                          </span>
                          <span className="font-serif text-sm font-medium text-white block mb-1">
                            Alpha
                          </span>
                          <span className="text-[11px] text-[#737373] block">Equities (3.40%)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-3">
                        Order Side
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSide('SellPT')}
                          className={`p-4 rounded-[3px] border text-left transition-all ${
                            side === 'SellPT'
                              ? 'bg-[#151515] border-white text-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)]'
                              : 'bg-[#0a0a0a] border-[#242424] text-[#a8a8a8] hover:border-[#404040]'
                          }`}
                        >
                          <span className="font-mono text-xs uppercase text-white font-medium block mb-1">
                            Sell Principal Token (PT)
                          </span>
                          <span className="text-[11px] text-[#737373] block leading-relaxed">
                            Lock in upfront fixed cash today at discounted rate
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSide('SellYT')}
                          className={`p-4 rounded-[3px] border text-left transition-all ${
                            side === 'SellYT'
                              ? 'bg-[#151515] border-white text-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)]'
                              : 'bg-[#0a0a0a] border-[#242424] text-[#a8a8a8] hover:border-[#404040]'
                          }`}
                        >
                          <span className="font-mono text-xs uppercase text-white font-medium block mb-1">
                            Sell Yield Token (YT)
                          </span>
                          <span className="text-[11px] text-[#737373] block leading-relaxed">
                            Monetize floating future dividend/staking yield
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-3.5 bg-white text-black font-semibold text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Size & Pricing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* STEP 2: Size & Rate */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-[#a8a8a8]">Order Principal Size</span>
                        <button
                          type="button"
                          onClick={() => setSize('5000000')}
                          className="text-[#4ade80] hover:underline"
                        >
                          Standard Round: 5,000,000
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="1000000"
                          className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-white rounded-[2px] py-3 px-4 text-white font-mono text-lg focus:outline-none transition-colors"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#a8a8a8]">
                          PT
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-[#a8a8a8]">Target APY / Limit Rate</span>
                        <span className="text-white font-mono font-medium">
                          {(limitRateBps / 100).toFixed(2)}% APY
                        </span>
                      </div>
                      <input
                        type="range"
                        min={200}
                        max={1200}
                        step={5}
                        value={limitRateBps}
                        onChange={(e) => setLimitRateBps(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-[#737373] mt-1">
                        <span>2.00%</span>
                        <span className="text-[#4ade80]">Implied Price: ${impliedPrice}</span>
                        <span>12.00%</span>
                      </div>
                    </div>

                    {/* Math Formula Disclosure Box */}
                    <div className="p-4 bg-[#121212] border border-[#222222] rounded-[2px] font-mono text-xs space-y-2">
                      <span className="text-[#737373] uppercase tracking-wider block text-[10px] mb-1">
                        Pricing & Escrow Calculation
                      </span>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Days to Maturity:</span>
                        <span className="text-white">{daysLeft} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Implied Execution Price:</span>
                        <span className="text-[#4ade80] font-medium">${impliedPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Gross Quote Proceeds:</span>
                        <span className="text-white">
                          ${(Number(size || '0') * Number(impliedPrice)).toLocaleString()} USDC
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#1e1e1e]">
                        <span className="text-[#a8a8a8]">Escrow Lock Required:</span>
                        <span className="text-[#fbbf24] font-medium">{size} PT</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 py-3 rounded-[2px] border border-[#333333] text-[#a8a8a8] hover:text-white text-xs font-mono transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="flex-1 py-3 bg-white text-black font-semibold text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2"
                      >
                        <span>Review & Seal Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review, Seal & Send */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="p-5 bg-[#0d0d0d] border border-[#242424] rounded-[2px] font-mono text-xs space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Series:</span>
                        <span className="text-white truncate max-w-[200px]">
                          {selectedSeries?.pubkey || 'CSQJ...FPUwY'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Side:</span>
                        <span className="text-white">{side}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Size:</span>
                        <span className="text-white font-medium">{size} PT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">Limit Price:</span>
                        <span className="text-[#4ade80] font-medium">${impliedPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#a8a8a8]">RFQ Window:</span>
                        <span className="text-white">{windowLengthSec}s (5 minutes)</span>
                      </div>
                    </div>

                    {isSealing ? (
                      <div className="p-6 bg-[#0f1f14] border border-[#1b4329] rounded-[2px] text-center font-mono text-xs shadow-[0_0_25px_-5px_rgba(74,222,128,0.25)]">
                        <div className="w-8 h-8 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-white mb-1 font-medium">{sealingStepText}</p>
                        <p className="text-[#4ade80] text-[11px]">
                          Zero Plaintext leaves your browser. Encrypted via RFC 9180 HPKE.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#0c1f13] border border-[#1b4329] rounded-[2px] text-xs font-mono text-[#4ade80] flex items-start gap-2.5">
                        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Nothing leaves the browser in plain text. Your order is sealed directly to the hardware enclave public key using ChaCha20-Poly1305. The relay and node operators cannot read size, price, or identity.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={isSealing}
                        onClick={() => setStep(2)}
                        className="px-5 py-3 rounded-[2px] border border-[#333333] text-[#a8a8a8] hover:text-white text-xs font-mono transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={isSealing}
                        onClick={handleSealAndSubmit}
                        className="flex-1 py-3.5 bg-white text-black font-semibold text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Seal and Send to Relay</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </TiltCard>
          </div>

          {/* Visibility Panel Column */}
          <div className="lg:col-span-5">
            <VisibilityPanel
              items={visibilityItems}
              title="Who can see this"
              subtitle="Live cryptographic disclosure boundary"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
