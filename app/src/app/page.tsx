'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '../components/Header'
import { ModeBar, useModeBarState } from '../components/ModeBar'
import { DataSourceTag } from '../components/DataSourceTag'
import { StatusChip } from '../components/StatusChip'
import { TiltCard } from '../components/TiltCard'
import { YieldCurve3D } from '../components/YieldCurve3D'
import {
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Lock,
  Scale,
  Landmark,
  Sparkles,
  ChevronRight,
  Cpu,
  Fingerprint,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllSeries, fetchConfig, fetchPythFeed } from '../lib/api'

export default function HomePage() {
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
  })

  const { data: allSeries } = useQuery({
    queryKey: ['series'],
    queryFn: fetchAllSeries,
  })

  const { data: solFeed } = useQuery({
    queryKey: ['pyth', 'SOL/USD'],
    queryFn: () => fetchPythFeed('SOL/USD'),
  })

  const { data: btcFeed } = useQuery({
    queryKey: ['pyth', 'BTC/USD'],
    queryFn: () => fetchPythFeed('BTC/USD'),
  })

  return (
    <div className="min-h-screen text-white flex flex-col font-sans relative">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Section */}
        <div className="max-w-4xl mb-16">
          {/* Futuristic Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] bg-[#0c130d]/80 border border-[#1f3a23] text-xs font-mono text-[#4ade80] mb-6 shadow-[0_0_20px_rgba(74,222,128,0.12)]">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span>Chainlink CRE Enclave (AWS Nitro) · Confidential RFQ Matching</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.1] mb-6">
            Private request-for-quote exchange for dated yield on Solana.
          </h1>

          <p className="text-base sm:text-lg text-[#a3a3a3] leading-relaxed mb-8 max-w-2xl font-sans">
            Strip dated yield into Principal Tokens (PT) and Yield Tokens (YT).
            Quotes match privately inside an attested Chainlink CRE confidential enclave;
            only the signed fill and maturity settlement touch the public chain.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/rfq/new"
              className="px-6 py-3 rounded-[3px] bg-white hover:bg-[#e6e6e6] text-black font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
            >
              <span>Request a Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/vaults"
              className="px-6 py-3 rounded-[3px] border border-white/20 hover:border-white bg-[#0f0f0f]/80 text-white text-sm transition-all duration-200 hover:scale-[1.02]"
            >
              Explore Vaults
            </Link>

            <Link
              href="/access"
              className="px-6 py-3 rounded-[3px] border border-[#262626] hover:border-[#555] bg-transparent text-[#a3a3a3] hover:text-white text-sm transition-colors"
            >
              Check KYC Eligibility
            </Link>
          </div>
        </div>

        {/* Institutional Specification Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16 font-mono text-xs">
          <div className="p-3.5 rounded-[4px] bg-[#0c0c0c]/80 border border-white/10 flex items-center gap-3">
            <Cpu className="w-4 h-4 text-[#4ade80] shrink-0" />
            <div>
              <span className="text-[#737373] block text-[10px]">Confidential DON</span>
              <span className="text-white font-medium">Chainlink CRE TEE</span>
            </div>
          </div>

          <div className="p-3.5 rounded-[4px] bg-[#0c0c0c]/80 border border-white/10 flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-[#06b6d4] shrink-0" />
            <div>
              <span className="text-[#737373] block text-[10px]">Cryptography</span>
              <span className="text-white font-medium">RFC 9180 HPKE</span>
            </div>
          </div>

          <div className="p-3.5 rounded-[4px] bg-[#0c0c0c]/80 border border-white/10 flex items-center gap-3">
            <Layers className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <div>
              <span className="text-[#737373] block text-[10px]">Token Standard</span>
              <span className="text-white font-medium">SPL Token-2022</span>
            </div>
          </div>

          <div className="p-3.5 rounded-[4px] bg-[#0c0c0c]/80 border border-white/10 flex items-center gap-3">
            <Activity className="w-4 h-4 text-[#a855f7] shrink-0" />
            <div>
              <span className="text-[#737373] block text-[10px]">Market Oracles</span>
              <span className="text-white font-medium">Pyth Hermes Live</span>
            </div>
          </div>
        </div>

        {/* 3D Yield Curve Visualizer */}
        <div className="mb-20">
          <YieldCurve3D solPrice={solFeed?.price} />
        </div>

        {/* 4-Step Diagram (Strip, Ask, Match, Redeem) with 3D Tilt */}
        <div className="mb-20">
          <h2 className="font-serif text-2xl text-white font-medium mb-6">
            Protocol Mechanics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TiltCard accent="default" intensity={8} className="h-full">
              <div className="p-5 flex flex-col h-full">
                <span className="font-mono text-xs text-[#737373] uppercase block mb-3">
                  Step 1
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-white mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base text-white mb-1.5 font-medium">1. Strip</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Deposit raw collateral 1:1 to mint matching Principal Tokens (PT) and Yield Tokens (YT) on Solana base layer.
                </p>
              </div>
            </TiltCard>

            <TiltCard accent="amber" intensity={8} className="h-full">
              <div className="p-5 flex flex-col h-full">
                <span className="font-mono text-xs text-[#737373] uppercase block mb-3">
                  Step 2
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-[#fbbf24] mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base text-white mb-1.5 font-medium">2. Ask</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Requesters seal order terms locally via HPKE (RFC 9180) to the enclave key. Relay routes ciphertexts only.
                </p>
              </div>
            </TiltCard>

            <TiltCard accent="emerald" intensity={8} className="h-full">
              <div className="p-5 flex flex-col h-full">
                <span className="font-mono text-xs text-[#737373] uppercase block mb-3">
                  Step 3
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-[#4ade80] mb-3">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base text-white mb-1.5 font-medium">3. Match</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  Chainlink CRE enclave decrypts, verifies wallet signatures, and matches quotes using an optimal knapsack waterfall algorithm.
                </p>
              </div>
            </TiltCard>

            <TiltCard accent="cyan" intensity={8} className="h-full">
              <div className="p-5 flex flex-col h-full">
                <span className="font-mono text-xs text-[#737373] uppercase block mb-3">
                  Step 4
                </span>
                <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-[#06b6d4] mb-3">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base text-white mb-1.5 font-medium">4. Redeem</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed">
                  At maturity, attested index settle report determines final payout. PT receives underlying; YT claims yield.
                </p>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Three Institutional Vaults in a Row with 3D Tilt Cards */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl text-white font-medium">
                Institutional Risk-Tier Vaults
              </h2>
              <p className="text-xs text-[#a3a3a3] mt-0.5">
                Fixed-yield structures tailored to institutional risk mandates
              </p>
            </div>
            <Link
              href="/vaults"
              className="text-xs font-mono text-white hover:underline flex items-center gap-1"
            >
              <span>View all series</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vault 1: Conservative (Amber Accent) */}
            <TiltCard accent="amber" intensity={12} className="h-full">
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#fbbf24]" />
                      <span className="font-mono text-xs text-[#fbbf24] uppercase font-semibold">
                        Conservative
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#1a140a] border border-[#3b2a10] text-[#fbbf24]">
                      Reg S Non-U.S.
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-white mb-1 font-medium">
                    Ondo Finance USDY
                  </h3>
                  <p className="text-xs text-[#a3a3a3] mb-6 leading-relaxed">
                    Tokenized short-term U.S. Treasuries & bank demand deposits. Macro risk-free rate structure.
                  </p>

                  <div className="space-y-3 mb-6 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Benchmark Rate</span>
                      <span className="text-[#fbbf24] font-medium">4.85% APY</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Compliance</span>
                      <span className="text-white">Transfer Hook KYC</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Active Series</span>
                      <span className="text-white">
                        {allSeries?.filter((s) => s.index_kind === 3).length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/vaults/conservative"
                  className="w-full py-2.5 rounded-[3px] bg-[#141414] hover:bg-white text-white hover:text-black border border-white/10 hover:border-white text-center text-xs font-mono font-medium transition-all block mt-2"
                >
                  Inspect Conservative Vault
                </Link>
              </div>
            </TiltCard>

            {/* Vault 2: Balanced (Emerald Accent) */}
            <TiltCard accent="emerald" intensity={12} className="h-full">
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#4ade80]" />
                      <span className="font-mono text-xs text-[#4ade80] uppercase font-semibold">
                        Balanced
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80]">
                      Solana LSTs
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-white mb-1 font-medium">
                    JitoSOL / mSOL
                  </h3>
                  <p className="text-xs text-[#a3a3a3] mb-6 leading-relaxed">
                    Liquid staked Solana rewards with MEV boost. Protects against staking rate volatility.
                  </p>

                  <div className="space-y-3 mb-6 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Benchmark Rate</span>
                      <span className="text-[#4ade80] font-medium">7.12% APY</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Index Source</span>
                      <span className="text-white">SPL Stake Pool</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Active Series</span>
                      <span className="text-white">
                        {allSeries?.filter((s) => s.index_kind === 0).length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/vaults/balanced"
                  className="w-full py-2.5 rounded-[3px] bg-[#141414] hover:bg-white text-white hover:text-black border border-white/10 hover:border-white text-center text-xs font-mono font-medium transition-all block mt-2"
                >
                  Inspect Balanced Vault
                </Link>
              </div>
            </TiltCard>

            {/* Vault 3: Alpha (Cyan Accent) */}
            <TiltCard accent="cyan" intensity={12} className="h-full">
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#06b6d4]" />
                      <span className="font-mono text-xs text-[#06b6d4] uppercase font-semibold">
                        Alpha Equities
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#0c1c24] border border-[#163847] text-[#06b6d4]">
                      1,190 Assets
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-white mb-1 font-medium">
                    Backpack Securities
                  </h3>
                  <p className="text-xs text-[#a3a3a3] mb-6 leading-relaxed">
                    Tokenized equities (AAPL, NVDA, TSLA). Strip corporate dividend growth 24/7 privately.
                  </p>

                  <div className="space-y-3 mb-6 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">API Verified</span>
                      <span className="text-[#06b6d4] font-medium">Spike C Pass</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Corporate Actions</span>
                      <span className="text-white">Token-2022 Multiplier</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-[#737373]">Status</span>
                      <span className="text-[#fbbf24]">Deferred (Decision 4)</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/vaults/alpha"
                  className="w-full py-2.5 rounded-[3px] bg-[#141414] hover:bg-white text-white hover:text-black border border-white/10 hover:border-white text-center text-xs font-mono font-medium transition-all block mt-2"
                >
                  View 1,190 Securities
                </Link>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Case for Confidential Execution */}
        <div className="p-8 rounded-[4px] bg-[#080808]/90 border border-white/10 mb-16 backdrop-blur-md">
          <div className="max-w-2xl">
            <span className="font-mono text-xs text-[#a3a3a3] uppercase tracking-wider block mb-2">
              The Case for Confidential Execution
            </span>
            <h2 className="font-serif text-2xl text-white font-medium mb-4">
              Why Private: The \$25M Roll Example
            </h2>
            <p className="text-sm text-[#a3a3a3] leading-relaxed mb-4 font-sans">
              When an institution rolls \$25,000,000 in expiring Treasury or staking yield on a public order book or AMM, front-runners observe the size, expiration date, and limit price immediately. Arbitrage bots front-run liquidity pools and widen spreads, extracting basis points of slippage on every roll.
            </p>
            <p className="text-sm text-[#a3a3a3] leading-relaxed font-sans">
              Kalend seals the order client-side. The public ledger and relay see only an opaque ciphertext. The Chainlink CRE enclave aggregates competitive quotes from authorized institutional dealers and executes an optimal multi-tranche fill without leaking pre-trade intentions.
            </p>
          </div>
        </div>

        {/* Live Pyth Reference Oracles Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#a3a3a3]">
          <div className="flex items-center gap-6">
            <span>Authenticated Pyth Reference Oracles:</span>
            {solFeed && (
              <span className="text-white font-medium">
                SOL/USD: ${solFeed.price.toFixed(2)} (±${solFeed.confidence.toFixed(2)})
              </span>
            )}
            {btcFeed && (
              <span className="text-white font-medium">
                BTC/USD: ${btcFeed.price.toFixed(2)} (±${btcFeed.confidence.toFixed(2)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DataSourceTag
              sourceName="Pyth Hermes Network (Live)"
              updatedAt={solFeed?.publishTime}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
