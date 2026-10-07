'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Header } from '../../components/Header'
import { ModeBar } from '../../components/ModeBar'
import { fetchAllowEntry } from '../../lib/api'
import { useWallet } from '../../lib/wallet'

const ROLES = [
  { bit: 1, name: 'Strip', what: 'deposit collateral and mint PT + YT' },
  { bit: 2, name: 'Redeem', what: 'redeem PT after settlement' },
  { bit: 4, name: 'Claim', what: 'claim YT growth after settlement' },
  { bit: 8, name: 'Requester', what: 'escrow PT/YT and request sealed quotes' },
  { bit: 16, name: 'Dealer', what: 'escrow quote asset and submit sealed quotes' },
]

export default function AccessPage() {
  const wallet = useWallet()
  const { data: entry, isLoading } = useQuery({
    queryKey: ['allow', wallet.walletAddress],
    queryFn: () => fetchAllowEntry(wallet.walletAddress!),
    enabled: !!wallet.walletAddress,
  })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <h1 className="font-serif text-3xl mb-2">Access</h1>
          <p className="text-sm text-[#a3a3a3] leading-relaxed">
            Kalend is permissioned. Each wallet needs an on-chain AllowEntry, set by the protocol authority, with the
            roles it uses and an expiry. There is no external KYC provider in v1; dealers do not see each other.
          </p>
        </div>

        {!wallet.connected ? (
          <button onClick={() => wallet.setShowConnectModal(true)} className="px-5 py-2.5 rounded-[3px] bg-white text-black text-sm font-medium">
            Connect wallet to check access
          </button>
        ) : (
          <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222] font-mono text-xs space-y-4">
            <div className="flex justify-between gap-4">
              <span className="text-[#737373]">Wallet</span>
              <span className="truncate">{wallet.walletAddress}</span>
            </div>
            {isLoading ? (
              <p className="text-[#737373]">Reading AllowEntry…</p>
            ) : !entry ? (
              <p className="text-[#fbbf24]">No AllowEntry on-chain for this wallet. Ask the authority to add it (Admin page).</p>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Expires</span>
                  <span className={entry.is_valid ? 'text-[#4ade80]' : 'text-[#f87171]'}>
                    {new Date(entry.expiry_ts * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC {entry.is_valid ? '' : '(expired)'}
                  </span>
                </div>
                <ul className="space-y-2">
                  {ROLES.map((r) => {
                    const has = (entry.roles & r.bit) !== 0 && entry.is_valid
                    return (
                      <li key={r.name} className="flex items-center gap-2">
                        {has ? <CheckCircle2 className="w-4 h-4 text-[#4ade80]" /> : <XCircle className="w-4 h-4 text-[#555]" />}
                        <span className={has ? 'text-white' : 'text-[#555]'}>{r.name}</span>
                        <span className="text-[#737373]">· {r.what}</span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
