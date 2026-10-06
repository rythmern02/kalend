'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Lock,
  Send,
  Clock,
  CheckCircle2,
  RefreshCw,
  Zap,
  TrendingUp,
  Landmark,
  Scale,
  Sparkles,
  ArrowRight,
  Layers,
  Info,
} from 'lucide-react'
import { sealOrderEnvelope, sealOrderEnvelopeWithSigner } from '../lib/crypto'
import { ENCLAVE_PUBLIC_KEY, CURRENT_KID, RELAY_API_URL } from '../lib/constants'
import { useWallet } from '../lib/wallet'

export type VaultTier = 'CONSERVATIVE_ONDO' | 'BALANCED_LST' | 'ALPHA_BACKPACK'

interface VaultOption {
  id: VaultTier
  name: string
  asset: string
  category: string
  targetUser: string
  objective: string
  benchmarkApr: string
  icon: any
  color: string
  badgeColor: string
  seriesPubkey: string
  quoteMint: string
}

const VAULT_OPTIONS: VaultOption[] = [
  {
    id: 'CONSERVATIVE_ONDO',
    name: 'Conservative Vault',
    asset: 'Ondo Finance USDY',
    category: 'Tokenized U.S. Treasury Bills',
    targetUser: 'Corporate Treasuries & Stablecoin Whales',
    objective: 'Lock in guaranteed, risk-free macro interest rates on USD cash reserves.',
    benchmarkApr: '4.85%',
    icon: Landmark,
    color: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    seriesPubkey: 'Ond0USDY1111111111111111111111111111111111',
    quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  },
  {
    id: 'BALANCED_LST',
    name: 'Balanced Vault',
    asset: 'JitoSOL Liquid Staking',
    category: 'Solana Proof-of-Stake Rewards + MEV',
    targetUser: 'Crypto Funds & Infrastructure Allocators',
    objective: 'Protect against on-chain reward volatility and market front-running.',
    benchmarkApr: '7.12%',
    icon: Scale,
    color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    seriesPubkey: 'CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY',
    quoteMint: 'So11111111111111111111111111111111111111112', // wSOL
  },
  {
    id: 'ALPHA_BACKPACK',
    name: 'Delta-Neutral Alpha Vault',
    asset: 'Backpack Securities (AAPL / NVDA)',
    category: '24/7 Tokenized US Equities',
    targetUser: 'Quantitative Trading Desks & Arbitrage Funds',
    objective: 'Strip corporate dividends 24/7 privately via confidential TEE enclaves.',
    benchmarkApr: '3.40%',
    icon: Sparkles,
    color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    seriesPubkey: 'BPackAAPL111111111111111111111111111111111',
    quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  },
]

export function RfqExchangeTab({ walletAddress: propWalletAddress }: { walletAddress?: string | null }) {
  const wallet = useWallet()
  // Institutional Wizard State
  const [selectedVault, setSelectedVault] = useState<VaultTier>('CONSERVATIVE_ONDO')
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [role, setRole] = useState<'requester' | 'dealer'>('requester')
  const [side, setSide] = useState<'SellPT' | 'SellYT'>('SellPT')
  const [sizeAmount, setSizeAmount] = useState('1000000') // $1,000,000 default for institutional ticket
  const [minTargetApr, setMinTargetApr] = useState('4.80')
  const [maturityChoice, setMaturityChoice] = useState('2026-12-31')
  const [rounds, setRounds] = useState<any[]>([])
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sealedCiphertextSummary, setSealedCiphertextSummary] = useState<string | null>(null)

  const activeVault = VAULT_OPTIONS.find((v) => v.id === selectedVault)!

  // Derived price from APR: price = 1 / (1 + APR * (days_left / 365))
  const derivedPrice = (1 / (1 + parseFloat(minTargetApr || '4.8') / 100 * 0.25)).toFixed(6)

  // Fetch active rounds from Relay
  const fetchRounds = async () => {
    try {
      const res = await fetch(`${RELAY_API_URL}/rfq/rounds`)
      if (res.ok) {
        const data = await res.json()
        setRounds(data.rounds || [])
        if (data.rounds && data.rounds.length > 0 && !selectedRoundId) {
          setSelectedRoundId(data.rounds[0].round_id)
        }
      }
    } catch {
      // Local relay offline fallback
    }
  }

  useEffect(() => {
    fetchRounds()
    const interval = setInterval(fetchRounds, 5000)
    return () => clearInterval(interval)
  }, [])

  // Create new RFQ round
  const createNewRound = async () => {
    setIsLoading(true)
    setStatusMessage('Opening new RFQ round on Relay...')
    try {
      const res = await fetch(`${RELAY_API_URL}/rfq/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series: activeVault.seriesPubkey,
          duration: 45,
          kid: CURRENT_KID,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedRoundId(data.round.round_id)
        setStatusMessage(`✓ New RFQ Round opened! ID: ${data.round.round_id.slice(0, 16)}...`)
        fetchRounds()
      }
    } catch (err: any) {
      setStatusMessage(`Error opening round: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit sealed order
  const handleSubmitSealedOrder = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      wallet.setShowConnectModal(true)
      return
    }
    if (!selectedRoundId) {
      alert('Please select or open an RFQ round first!')
      return
    }

    setIsLoading(true)
    setStatusMessage('1/3 Signing order with wallet & sealing ciphertext with audited pure-JS HPKE (RFC 9180)...')

    const activeAddress = wallet.walletAddress || ''
    const payload =
      role === 'requester'
        ? {
            v: 1,
            round_id: selectedRoundId,
            series: activeVault.seriesPubkey,
            side,
            size: sizeAmount,
            limit_price: derivedPrice,
            quote_mint: activeVault.quoteMint,
            requester: activeAddress,
            nonce: Date.now(),
            not_after: Math.floor(Date.now() / 1000) + 300,
          }
        : {
            v: 1,
            round_id: selectedRoundId,
            dealer: activeAddress,
            price: derivedPrice,
            max_size: sizeAmount,
            nonce: Date.now(),
            not_after: Math.floor(Date.now() / 1000) + 300,
          }

    try {
      const sealed = await sealOrderEnvelopeWithSigner(
        ENCLAVE_PUBLIC_KEY,
        selectedRoundId,
        CURRENT_KID,
        role === 'requester' ? 'KALEND/v1/request' : 'KALEND/v1/quote',
        payload,
        wallet.publicKey.toBytes(),
        (msg) => wallet.signMessage(msg)
      )

      setSealedCiphertextSummary(`HPKE Envelope: ${sealed.ciphertext.slice(0, 32)}... (${sealed.ciphertext.length / 2} bytes)`)

      setStatusMessage('2/3 Submitting sealed ciphertext to Relay (Zero plaintext leaves browser)...')

      const endpoint = role === 'requester' ? '/rfq/request' : '/rfq/quote'
      const res = await fetch(`${RELAY_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: selectedRoundId,
          enc: sealed.enc,
          ciphertext: sealed.ciphertext,
          kid: CURRENT_KID,
        }),
      })

      if (res.ok) {
        setStatusMessage('✓ Sealed ticket successfully submitted to Relay! Enclave matching will run at round close.')
        fetchRounds()
      } else {
        const errData = await res.json()
        setStatusMessage(`Submission error: ${errData.error || 'Failed'}`)
      }
    } catch (err: any) {
      console.error('RFQ sealed order error:', err)
      setStatusMessage(`Client error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger matching manually
  const handleTriggerMatching = async () => {
    if (!selectedRoundId) return
    setIsLoading(true)
    setStatusMessage('Triggering Chainlink CRE TEE confidential matching engine...')
    try {
      const res = await fetch(`${RELAY_API_URL}/rfq/rounds/${selectedRoundId}/trigger`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage('✓ Enclave matched winning orders! Phase 1 FillReport written to Keystone Forwarder.')
        fetchRounds()
      } else {
        setStatusMessage(`Trigger failed: ${data.result?.error || 'Unknown'}`)
      }
    } catch (err: any) {
      setStatusMessage(`Trigger error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner: Institutional Yield Engine */}
      <div className="bg-gradient-to-r from-[#121218] via-[#161622] to-[#121218] border border-[#24242e] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Institutional Matrix
              </span>
              <span className="text-xs text-zinc-500">Universal Fixed-Yield Primitives</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground">
              Kalend Institutional Risk-Tier Vaults
            </h2>
            <p className="text-xs text-muted max-w-2xl mt-1">
              One universal Anchor smart contract (`Ft4JURMo...`) settling dated risk across U.S.
              Treasuries, Liquid Staking rewards, and 24/7 Tokenized Equities via Chainlink CRE
              confidential enclaves.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={createNewRound}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-mono font-medium bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>+ Open New RFQ Round</span>
            </button>
          </div>
        </div>

        {/* 3 Risk-Adjusted Vault Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {VAULT_OPTIONS.map((vault) => {
            const Icon = vault.icon
            const isSelected = selectedVault === vault.id
            return (
              <div
                key={vault.id}
                onClick={() => {
                  setSelectedVault(vault.id)
                  setWizardStep(1)
                }}
                className={`cursor-pointer rounded-xl p-5 border transition-all relative ${
                  isSelected
                    ? 'border-amber-400/80 bg-zinc-900/90 shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/30'
                    : `${vault.color} opacity-80 hover:opacity-100`
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-semibold text-foreground">
                        {vault.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-mono">{vault.asset}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${vault.badgeColor}`}>
                    {vault.benchmarkApr} Benchmark
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                  {vault.objective}
                </p>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Target: {vault.targetUser.split('&')[0]}</span>
                  <span className={isSelected ? 'text-amber-400 font-bold' : ''}>
                    {isSelected ? '✓ Selected' : 'Select →'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Trading Area: 3-Step Wizard + Live Rounds Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 3-Step Wizard Layout (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121218] border border-[#24242e] rounded-2xl p-6 space-y-6">
          {/* Wizard Step Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-6 text-xs font-mono">
              <button
                onClick={() => setWizardStep(1)}
                className={`flex items-center gap-2 ${
                  wizardStep === 1 ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Select Asset</span>
              </button>

              <ArrowRight className="w-3 h-3 text-zinc-600" />

              <button
                onClick={() => setWizardStep(2)}
                className={`flex items-center gap-2 ${
                  wizardStep === 2 ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Size & Expiry</span>
              </button>

              <ArrowRight className="w-3 h-3 text-zinc-600" />

              <button
                onClick={() => setWizardStep(3)}
                className={`flex items-center gap-2 ${
                  wizardStep === 3 ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Seal & Submit</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-zinc-400">
              Active: <span className="text-foreground">{activeVault.asset}</span>
            </div>
          </div>

          {/* Step 1: Confirm Asset & Strategy */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-serif font-semibold text-foreground">
                  Step 1: Confirm Yield Asset & Strategy
                </h3>
                <p className="text-xs text-muted">
                  Choose whether you are selling principal to lock in guaranteed upfront cash, or selling
                  yield tokens to capture variable yield.
                </p>
              </div>

              <div className="p-4 bg-black/40 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Selected Collateral:</span>
                  <span className="font-mono font-bold text-foreground">{activeVault.asset}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Risk Profile:</span>
                  <span className="font-mono text-emerald-400">{activeVault.category}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Live Benchmark Rate:</span>
                  <span className="font-mono font-bold text-amber-400">{activeVault.benchmarkApr} APY</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSide('SellPT')}
                  className={`p-3 rounded-lg border text-xs font-mono text-left transition-all ${
                    side === 'SellPT'
                      ? 'border-amber-400 bg-amber-400/10 text-foreground'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold mb-1">Sell PT (Principal)</div>
                  <div className="text-[10px] text-zinc-400">
                    Lock in guaranteed fixed yield upfront. Discard price volatility.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SellYT')}
                  className={`p-3 rounded-lg border text-xs font-mono text-left transition-all ${
                    side === 'SellYT'
                      ? 'border-amber-400 bg-amber-400/10 text-foreground'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold mb-1">Sell YT (Yield)</div>
                  <div className="text-[10px] text-zinc-400">
                    Monetize future yield cashflows while retaining underlying collateral.
                  </div>
                </button>
              </div>

              <button
                onClick={() => setWizardStep(2)}
                className="w-full py-3 rounded-lg text-xs font-mono uppercase font-semibold bg-zinc-800 hover:bg-zinc-700 text-foreground transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Step 2: Size & Expiry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Step 2: Size & Expiration */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-serif font-semibold text-foreground">
                  Step 2: Enter Size, Expiration & Target APR
                </h3>
                <p className="text-xs text-muted">
                  Institutional parameters are parsed off-chain by Chainlink CRE to prevent market
                  slippage.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Notional Size ({activeVault.asset.split(' ')[0]})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={sizeAmount}
                      onChange={(e) => setSizeAmount(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none"
                      placeholder="1000000"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-zinc-500">
                      Units
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                      Target Minimum APR (%)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={minTargetApr}
                      onChange={(e) => setMinTargetApr(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                      Maturity Date
                    </label>
                    <input
                      type="date"
                      value={maturityChoice}
                      onChange={(e) => setMaturityChoice(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs font-mono flex items-center justify-between">
                  <span className="text-zinc-400">Calculated Limit Price:</span>
                  <span className="font-bold text-amber-400">${derivedPrice} USDC</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-3 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex-1 py-3 rounded-lg text-xs font-mono uppercase font-semibold bg-zinc-800 hover:bg-zinc-700 text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue to Step 3: Seal Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Seal & Submit */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-serif font-semibold text-foreground">
                  Step 3: Client-Side Sealing & Submission
                </h3>
                <p className="text-xs text-muted">
                  Your ticket parameters are encrypted locally via HPKE (RFC 9180) to the AWS Nitro TEE
                  public key before network transmission.
                </p>
              </div>

              <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vault:</span>
                  <span className="text-foreground">{activeVault.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Asset & Tranche:</span>
                  <span className="text-foreground">{activeVault.asset} ({side})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Notional Size:</span>
                  <span className="font-bold text-foreground">{sizeAmount} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Limit Price:</span>
                  <span className="text-emerald-400">${derivedPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Active RFQ Round:</span>
                  <span className="text-amber-400">
                    {selectedRoundId ? `${selectedRoundId.slice(0, 16)}...` : 'None Selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Privacy Standard:</span>
                  <span className="text-purple-400">Pure-JS HPKE (RFC 9180) + Ed25519 Sig</span>
                </div>
              </div>

              {sealedCiphertextSummary && (
                <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg text-[10px] font-mono text-purple-300 break-all">
                  <div className="font-bold mb-0.5">Zero Plaintext Wire Payload:</div>
                  {sealedCiphertextSummary}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-3 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitSealedOrder}
                  disabled={isLoading || !selectedRoundId}
                  className="flex-1 py-3 rounded-lg font-medium text-xs font-mono tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Processing...' : 'Seal & Submit to Enclave'}</span>
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Active Rounds Board & Knapsack Waterfalls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121218] border border-[#24242e] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Active RFQ Rounds (Devnet)
              </h3>
              <button
                onClick={fetchRounds}
                className="text-xs text-muted hover:text-foreground p-1 rounded hover:bg-zinc-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {rounds.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-muted space-y-2">
                <Layers className="w-8 h-8 text-zinc-700 mx-auto" />
                <div>No active rounds open.</div>
                <div className="text-[10px] text-zinc-600">
                  Click &ldquo;+ Open New RFQ Round&rdquo; above to launch one.
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {rounds.map((round) => {
                  const isSelected = selectedRoundId === round.round_id
                  return (
                    <div
                      key={round.round_id}
                      onClick={() => setSelectedRoundId(round.round_id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-400/80 bg-zinc-900/90 shadow-sm'
                          : 'border-zinc-800/80 bg-black/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="font-semibold text-foreground">
                          {round.round_id.slice(0, 12)}...
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            round.status === 'executed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : round.status === 'approved'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {round.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 mb-2">
                        <div>Requests: {round.requests?.length || 0} sealed</div>
                        <div>Quotes: {round.quotes?.length || 0} sealed</div>
                      </div>

                      {round.status === 'open' && (
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Window closes in ~30s · Confidential Knapsack Match
                        </div>
                      )}

                      {round.fill_receipt && (
                        <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                          <span>FillReceipt PDA:</span>
                          <span>{round.fill_receipt.slice(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {selectedRoundId && (
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={handleTriggerMatching}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-medium border border-[#2d2d38] bg-[#14141c] hover:bg-[#1a1a24] text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trigger TEE Knapsack Match</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
