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
import { PublicKey } from '@solana/web3.js'
import { lockEscrow } from '../../../lib/kalend-client'
import { deriveEscrowPda } from '../../../lib/solana'
import { TiltCard } from '../../../components/TiltCard'

export default function NewRfqPage() {
  const router = useRouter()
  const modeBarState = useModeBarState()
  const wallet = useWallet()
  const walletAddress = wallet.walletAddress || ''

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1)
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

  // Tradable series: Open (status 0) and not yet matured, newest maturity first
  const nowSecs = Math.floor(Date.now() / 1000)
  const openSeries = (allSeries ?? [])
    .filter((s) => s.status === 0 && s.maturity_ts > nowSecs + 600)
    .sort((a, b) => b.maturity_ts - a.maturity_ts)
  const [seriesPick, setSeriesPick] = useState<string>('')
  const selectedSeries = openSeries.find((s) => s.pubkey === seriesPick) ?? openSeries[0]

  const daysLeft = selectedSeries
    ? Math.max(1, Math.ceil((selectedSeries.maturity_ts - Date.now() / 1000) / 86400))
    : 90

  // Live implied price from (1/p - 1) * 365/d => p = 1 / (1 + r * d / 365)
  const rateDecimal = limitRateBps / 10000
  const impliedPrice = (1 / (1 + rateDecimal * (daysLeft / 365))).toFixed(4)

  const visibilityItems: VisibilityItem[] = [
    {
      label: 'Order Type',
      value: side,
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
      description: 'Decrypted only inside the CRE workflow (local simulator on devnet, not an enclave)',
    },
    {
      label: 'Escrow Locked',
      value: `${size} ${side === 'SellPT' ? 'PT' : 'YT'}`,
      visibility: 'public_solana',
      description: 'Escrow amounts are public on Solana (the price and limit are not)',
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
    if (!selectedSeries) {
      alert('No open series on devnet to trade.')
      return
    }

    setIsSealing(true)
    try {
      const assetMint = side === 'SellPT' ? selectedSeries.pt_mint : selectedSeries.yt_mint
      const sizeRaw = BigInt(size)

      // Step 1: make sure the asset being sold is escrowed (public on-chain; cannot be
      // withdrawn before lock_until, so an approved fill cannot be starved).
      setSealingStepText('Step 1 of 4: Locking asset in escrow (wallet signature)...')
      const [escrowPda] = deriveEscrowPda(new PublicKey(selectedSeries.pubkey), wallet.publicKey, new PublicKey(assetMint))
      const escrowAcc = await wallet.connection.getAccountInfo(escrowPda)
      // Escrow layout: 8 disc + owner 32 + series 32 + mint 32 + lock_until i64 + amount u64
      const escrowed = escrowAcc ? escrowAcc.data.readBigUInt64LE(8 + 96 + 8) : 0n
      if (escrowed < sizeRaw) {
        await lockEscrow(wallet, {
          seriesPubkey: selectedSeries.pubkey,
          mintPubkey: assetMint,
          amount: (sizeRaw - escrowed).toString(),
          lockUntilTs: Math.floor(Date.now() / 1000) + windowLengthSec + 900,
          isToken2022: true,
        })
      }

      // Step 2: the relay opens a round and assigns its id.
      setSealingStepText('Step 2 of 4: Opening sealed round on relay...')
      const roundRes = await fetch(`${RELAY_API_URL}/rfq/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: selectedSeries.pubkey, duration: windowLengthSec }),
      })
      const roundJson = await roundRes.json()
      if (!roundRes.ok) throw new Error(roundJson.error ?? 'Relay refused to open a round')
      const newRoundId: string = roundJson.round.round_id
      setRoundId(newRoundId)

      // Step 3: sign with the wallet and HPKE-seal in the browser.
      setSealingStepText('Step 3 of 4: Signing and sealing order (HPKE RFC 9180)...')
      const payload = {
        v: 1,
        round_id: newRoundId,
        series: selectedSeries.pubkey,
        side,
        size,
        limit_price: impliedPrice,
        quote_mint: selectedSeries.quote_mint,
        requester: wallet.walletAddress,
        nonce: Date.now(),
        not_after: Math.floor(Date.now() / 1000) + windowLengthSec + 600,
      }
      const sealed = await sealOrderEnvelopeWithSigner(
        ENCLAVE_PUBLIC_KEY,
        newRoundId,
        CURRENT_KID,
        'KALEND/v1/request',
        payload,
        wallet.publicKey.toBytes(),
        (msg) => wallet.signMessage(msg)
      )

      // Step 4: ciphertext only to the relay.
      setSealingStepText('Step 4 of 4: Submitting ciphertext to relay...')
      const res = await fetch(`${RELAY_API_URL}/rfq/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: newRoundId, enc: sealed.enc, ciphertext: sealed.ciphertext, kid: CURRENT_KID }),
      })
      if (!res.ok) throw new Error(`Relay rejected request: ${await res.text()}`)

      router.push(`/rfq/${newRoundId}`)
    } catch (err: any) {
      console.error('RFQ sealing/submission failed:', err)
      alert(`RFQ submission failed: ${err.message || 'Unknown error'}`)
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
                        Series (open, on-chain)
                      </label>
                      {openSeries.length === 0 ? (
                        <p className="font-mono text-xs text-[#737373]">No open series found in the on-chain Registry.</p>
                      ) : (
                        <select
                          value={selectedSeries?.pubkey ?? ''}
                          onChange={(e) => setSeriesPick(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[#242424] rounded-[3px] p-3 font-mono text-xs text-white"
                        >
                          {openSeries.map((s) => (
                            <option key={s.pubkey} value={s.pubkey}>
                              {s.pubkey.slice(0, 8)}… · matures {new Date(s.maturity_ts * 1000).toISOString().slice(0, 10)} · test collateral {s.collateral_mint.slice(0, 6)}…
                            </option>
                          ))}
                        </select>
                      )}
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
                          {(Number(size || '0') * Number(impliedPrice)).toLocaleString()} quote units (raw)
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
                          {selectedSeries?.pubkey ?? '—'}
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
                        <span className="text-white">{windowLengthSec}s</span>
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
                          Nothing leaves the browser in plain text: the order is HPKE-sealed (RFC 9180, X25519 + ChaCha20-Poly1305) to the CRE workflow key. The relay sees only ciphertext and timing. On devnet the workflow runs in the CRE simulator, not a hardware enclave, and the team holds the decryption key.
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
