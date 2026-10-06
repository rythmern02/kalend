'use client'

import React, { useState } from 'react'
import { HonestyBanner } from '@/components/HonestyBanner'
import { Header } from '@/components/Header'
import { StripMergeTab } from '@/components/StripMergeTab'
import { RfqExchangeTab } from '@/components/RfqExchangeTab'
import { MaturityTab } from '@/components/MaturityTab'
import { TransparencyTab } from '@/components/TransparencyTab'
import { Lock, Shield, Cpu, ExternalLink } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'strip' | 'rfq' | 'maturity' | 'transparency'>('rfq')
  const [walletAddress, setWalletAddress] = useState<string | null>(
    'Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX'
  )

  const toggleWallet = () => {
    if (walletAddress) {
      setWalletAddress(null)
    } else {
      setWalletAddress('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <HonestyBanner />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletAddress={walletAddress}
        connectWallet={toggleWallet}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h1 className="text-3xl font-serif tracking-tight text-foreground font-semibold">
            Private Dated-Yield Exchange
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            Strip and merge on Solana base layer. Match quotes privately inside a Chainlink CRE confidential enclave.
            Only the cryptographic fill and the final attested maturity touch the public chain.
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === 'strip' && <StripMergeTab walletAddress={walletAddress} />}
        {activeTab === 'rfq' && <RfqExchangeTab walletAddress={walletAddress} />}
        {activeTab === 'maturity' && <MaturityTab walletAddress={walletAddress} />}
        {activeTab === 'transparency' && <TransparencyTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1e28] bg-[#09090d] py-6 px-4 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Kalend Protocol</span>
            <span>·</span>
            <span>Anchor 1.0 (Solana Devnet)</span>
            <span>·</span>
            <span>Chainlink CRE TS SDK</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <a
              href="https://explorer.solana.com/address/Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527?cluster=devnet"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground flex items-center gap-1"
            >
              <span>Program Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.chain.link/cre"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground flex items-center gap-1"
            >
              <span>CRE Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
