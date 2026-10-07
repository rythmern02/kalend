'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, ShieldCheck, UserCheck, LogOut } from 'lucide-react'
import { useWallet } from '../lib/wallet'

interface HeaderProps {
  walletAddress?: string | null
  userRole?: string
  connectWallet?: () => void
}

export function Header({
  walletAddress: propWalletAddress,
  userRole,
  connectWallet: propConnectWallet,
}: HeaderProps) {
  const pathname = usePathname()
  const wallet = useWallet()
  const activeWalletAddress = propWalletAddress !== undefined ? propWalletAddress : wallet.walletAddress
  const onConnect = propConnectWallet || wallet.connect

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/vaults', label: 'Series' },
    { href: '/rfq/new', label: 'Request Quote' },
    { href: '/dealer', label: 'Dealer Desk' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/receipts', label: 'Receipts' },
    { href: '/trust', label: 'Trust & Verification' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span
              className="text-3xl text-white font-normal tracking-normal select-none group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Kalend
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#a8a8a8] border border-white/10 group-hover:border-white/30 px-1.5 py-0.2 rounded-[2px] transition-colors">
              RFQ
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 rounded-[3px] text-xs font-sans transition-all duration-150 ${
                    isActive
                      ? 'text-white bg-white/10 font-medium border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                      : 'text-[#a3a3a3] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-[-1px] left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-[#4ade80] to-transparent" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Cluster Beacon, Role and Wallet Connection */}
        <div className="flex items-center gap-3">
          {/* Live Cluster Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-black/60 border border-white/10 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[#a3a3a3]">Solana Devnet</span>
          </div>

          {activeWalletAddress && userRole && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#0c1f13]/80 border border-[#1b4329] text-[#4ade80] text-xs font-mono">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{userRole}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onConnect}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-[3px] text-xs font-mono border border-white/15 hover:border-white bg-[#0f0f0f] hover:bg-[#141414] text-white shadow-sm transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-[#a8a8a8]" />
              {activeWalletAddress ? (
                <span className="font-medium flex items-center gap-1.5">
                  {wallet.walletName === 'Solflare' && <span className="text-[#fbbf24] text-[11px]">☀️</span>}
                  {activeWalletAddress.slice(0, 4)}...{activeWalletAddress.slice(-4)}
                </span>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
            {activeWalletAddress && (
              <button
                onClick={wallet.disconnect}
                title="Disconnect Wallet"
                className="p-1.5 rounded-[3px] border border-[#2b2b2b] hover:border-[#f87171] text-[#737373] hover:text-[#f87171] bg-[#0a0a0a] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
