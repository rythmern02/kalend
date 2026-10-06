'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, ShieldCheck, UserCheck } from 'lucide-react'

interface HeaderProps {
  walletAddress: string | null
  userRole?: string
  connectWallet: () => void
}

export function Header({
  walletAddress,
  userRole = 'Institutional Requester',
  connectWallet,
}: HeaderProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/vaults', label: 'Vaults' },
    { href: '/rfq/new', label: 'Request Quote' },
    { href: '/dealer', label: 'Dealer Desk' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/receipts', label: 'Receipts' },
    { href: '/trust', label: 'Trust & Verification' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <header className="border-b border-[#222222] bg-black sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span
              className="text-3xl text-white font-normal tracking-normal select-none"
              style={{ fontFamily: "'Pinyon Script', cursive" }}
            >
              Kalend
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#a8a8a8] border border-[#262626] px-1.5 py-0.2 rounded-[2px]">
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
                  className={`px-3 py-1.5 rounded-[2px] text-xs font-sans transition-colors ${
                    isActive
                      ? 'text-white bg-[#141414] font-medium border border-[#2b2b2b]'
                      : 'text-[#a8a8a8] hover:text-white hover:bg-[#0a0a0a]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Role and Wallet Connection */}
        <div className="flex items-center gap-3">
          {walletAddress && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80] text-xs font-mono">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{userRole}</span>
            </div>
          )}

          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] text-xs font-mono border border-[#333333] hover:border-white bg-[#0a0a0a] text-white transition-colors"
          >
            <Wallet className="w-3.5 h-3.5 text-[#a8a8a8]" />
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
