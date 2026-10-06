'use client'

import React from 'react'
import { Wallet, Shield, Layers, Scale, Sparkles } from 'lucide-react'

interface HeaderProps {
  activeTab: 'strip' | 'rfq' | 'maturity' | 'transparency'
  setActiveTab: (tab: 'strip' | 'rfq' | 'maturity' | 'transparency') => void
  walletAddress: string | null
  connectWallet: () => void
}

export function Header({ activeTab, setActiveTab, walletAddress, connectWallet }: HeaderProps) {
  return (
    <header className="border-b border-[#24242e] bg-[#0c0c10]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-xl font-bold tracking-tight">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl tracking-tight text-foreground font-semibold">
                KALEND
              </span>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                v1.1
              </span>
            </div>
            <p className="text-[10px] text-muted -mt-0.5">Dated Yield Exchange · Solana × Chainlink CRE</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#121218] p-1 rounded-lg border border-[#24242e]">
          <button
            onClick={() => setActiveTab('strip')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'strip'
                ? 'bg-zinc-800 text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Strip & Merge
          </button>
          <button
            onClick={() => setActiveTab('rfq')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'rfq'
                ? 'bg-zinc-800 text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Sealed RFQ
          </button>
          <button
            onClick={() => setActiveTab('maturity')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'maturity'
                ? 'bg-zinc-800 text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            Maturity & Settle
          </button>
          <button
            onClick={() => setActiveTab('transparency')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'transparency'
                ? 'bg-zinc-800 text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Transparency
          </button>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium border border-[#2d2d38] bg-[#14141c] hover:bg-[#1a1a24] text-foreground transition-all"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            {walletAddress ? (
              <span>
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
