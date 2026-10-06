'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Header } from '../components/Header'
import { ModeBar, useModeBarState } from '../components/ModeBar'
import { DataSourceTag } from '../components/DataSourceTag'
import { StatusChip } from '../components/StatusChip'
import {
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Lock,
  Scale,
  Landmark,
  Sparkles,
  ExternalLink,
  ChevronRight,
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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header
        walletAddress={walletAddress}
        connectWallet={() => {}}
      />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Headline Section */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[2px] bg-[#121212] border border-[#262626] text-xs font-mono text-[#a8a8a8] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            <span>Institutional RFQ Desk · Zero Plaintext Exposure</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-white leading-[1.15] mb-6">
            Private request-for-quote exchange for dated yield on Solana.
          </h1>

          <p className="text-base text-[#a8a8a8] leading-relaxed mb-8 max-w-2xl">
            Split yield-bearing assets into Principal Tokens (PT) and Yield Tokens (YT).
            Quotes match confidentially inside an attested Chainlink CRE hardware enclave;
            only the signed fill and maturity settlement touch the public chain.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/rfq/new"
              className="px-5 py-2.5 rounded-[2px] bg-white text-black font-medium text-sm hover:bg-[#e6e6e6] transition-colors flex items-center gap-2"
            >
              <span>Request a Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/access"
              className="px-5 py-2.5 rounded-[2px] border border-[#333333] hover:border-white text-white text-sm transition-colors"
            >
              Check Eligibility
            </Link>
          </div>
        </div>

        {/* 4-Step Diagram (Strip, Ask, Match, Redeem) */}
        <div className="mb-20">
          <h2 className="font-serif text-xl text-white font-medium mb-6">
            Protocol Mechanics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-3">
                Step 1
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-white mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-base text-white mb-1.5">1. Strip</h3>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                Deposit raw collateral 1:1 to mint matching Principal Tokens (PT) and Yield Tokens (YT) on Solana base layer.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-3">
                Step 2
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-white mb-3">
                <Lock className="w-4 h-4 text-[#fbbf24]" />
              </div>
              <h3 className="font-serif text-base text-white mb-1.5">2. Ask</h3>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                Requesters seal order terms locally via HPKE (RFC 9180) to the enclave key. Relay routes ciphertexts only.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-3">
                Step 3
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-white mb-3">
                <Shield className="w-4 h-4 text-[#4ade80]" />
              </div>
              <h3 className="font-serif text-base text-white mb-1.5">3. Match</h3>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                Chainlink CRE enclave decrypts, verifies wallet signatures, and matches quotes using a knapsack waterfall algorithm.
              </p>
            </div>

            <div className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <span className="font-mono text-xs text-[#a8a8a8] uppercase block mb-3">
                Step 4
              </span>
              <div className="w-8 h-8 rounded-[2px] bg-[#141414] border border-[#2b2b2b] flex items-center justify-center text-white mb-3">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-base text-white mb-1.5">4. Redeem</h3>
              <p className="text-xs text-[#a8a8a8] leading-relaxed">
                At maturity, attested index settle report determines final payout. PT receives underlying; YT claims yield.
              </p>
            </div>
          </div>
        </div>

        {/* Three Institutional Vaults in a Row with Live Rates */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-xl text-white font-medium">
                Institutional Risk-Tier Vaults
              </h2>
              <p className="text-xs text-[#a8a8a8] mt-0.5">
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
            {/* Vault 1: Conservative */}
            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] hover:border-[#444444] transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#4ade80]" />
                    <span className="font-mono text-xs text-[#a8a8a8] uppercase">
                      Conservative
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#141414] border border-[#2b2b2b] text-[#a8a8a8]">
                    U.S. T-Bills
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white mb-1">
                  Ondo Finance USDY
                </h3>
                <p className="text-xs text-[#a8a8a8] mb-6">
                  Tokenized short-term U.S. Treasuries & bank deposits. Macro risk-free rate.
                </p>

                <div className="space-y-3 mb-6 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Benchmark Rate</span>
                    <span className="text-[#4ade80] font-medium">4.85% APY</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Compliance</span>
                    <span className="text-white">Transfer Hook KYC</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Active Series</span>
                    <span className="text-white">
                      {allSeries?.filter((s) => s.index_kind === 3).length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/vaults/conservative"
                className="w-full py-2 rounded-[2px] bg-[#141414] border border-[#2b2b2b] hover:border-white text-center text-xs font-mono text-white transition-colors block"
              >
                Inspect Vault
              </Link>
            </div>

            {/* Vault 2: Balanced */}
            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] hover:border-[#444444] transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#fbbf24]" />
                    <span className="font-mono text-xs text-[#a8a8a8] uppercase">
                      Balanced
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#141414] border border-[#2b2b2b] text-[#a8a8a8]">
                    Solana LSTs
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white mb-1">
                  JitoSOL / mSOL
                </h3>
                <p className="text-xs text-[#a8a8a8] mb-6">
                  Liquid staked Solana rewards with MEV boost. Protects against rate volatility.
                </p>

                <div className="space-y-3 mb-6 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Benchmark Rate</span>
                    <span className="text-[#fbbf24] font-medium">7.12% APY</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Index Source</span>
                    <span className="text-white">SPL Stake Pool</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Active Series</span>
                    <span className="text-white">
                      {allSeries?.filter((s) => s.index_kind === 0).length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/vaults/balanced"
                className="w-full py-2 rounded-[2px] bg-[#141414] border border-[#2b2b2b] hover:border-white text-center text-xs font-mono text-white transition-colors block"
              >
                Inspect Vault
              </Link>
            </div>

            {/* Vault 3: Alpha */}
            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] hover:border-[#444444] transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="font-mono text-xs text-[#a8a8a8] uppercase">
                      Alpha
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-[#141414] border border-[#2b2b2b] text-[#a8a8a8]">
                    Equities
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white mb-1">
                  Backpack Securities
                </h3>
                <p className="text-xs text-[#a8a8a8] mb-6">
                  Tokenized equities (AAPL, NVDA, TSLA). Strip corporate dividends 24/7 privately.
                </p>

                <div className="space-y-3 mb-6 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Dividend Yield</span>
                    <span className="text-white font-medium">3.40% Yield</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Corporate Actions</span>
                    <span className="text-white">Attested Multiplier</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181818]">
                    <span className="text-[#a8a8a8]">Active Series</span>
                    <span className="text-white">
                      {allSeries?.filter((s) => s.index_kind === 1).length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/vaults/alpha"
                className="w-full py-2 rounded-[2px] bg-[#141414] border border-[#2b2b2b] hover:border-white text-center text-xs font-mono text-white transition-colors block"
              >
                Inspect Vault
              </Link>
            </div>
          </div>
        </div>

        {/* Short "Why private" section using the $25M roll example */}
        <div className="p-8 rounded-[4px] bg-[#080808] border border-[#222222] mb-16">
          <div className="max-w-2xl">
            <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
              The Case for Confidential Execution
            </span>
            <h2 className="font-serif text-2xl text-white font-medium mb-4">
              Why Private: The \$25M Roll Example
            </h2>
            <p className="text-sm text-[#a8a8a8] leading-relaxed mb-4">
              When a fund rolls \$25,000,000 in expiring Treasury or staking yield on a public order book or AMM, front-runners observe the size, expiration date, and limit price immediately. Arbitrage bots front-run liquidity pools and widen spreads, extracting basis points of slippage on every roll.
            </p>
            <p className="text-sm text-[#a8a8a8] leading-relaxed">
              Kalend seals the order client-side. The public ledger and relay see only an opaque ciphertext. The Chainlink CRE enclave aggregates competitive quotes from authorized institutional dealers and executes an optimal multi-tranche fill without leaking pre-trade intentions.
            </p>
          </div>
        </div>

        {/* Live Pyth Reference Oracles */}
        <div className="border-t border-[#222222] pt-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#a8a8a8]">
          <div className="flex items-center gap-6">
            <span>Reference Oracles (Display Only):</span>
            {solFeed && (
              <span className="text-white">
                SOL/USD: ${solFeed.price.toFixed(2)} (±${solFeed.confidence.toFixed(2)})
              </span>
            )}
            {btcFeed && (
              <span className="text-white">
                BTC/USD: ${btcFeed.price.toFixed(2)} (±${btcFeed.confidence.toFixed(2)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DataSourceTag sourceName="Pyth Solana Devnet" updatedAt={solFeed?.publishTime} />
          </div>
        </div>
      </main>
    </div>
  )
}
