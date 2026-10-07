'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Lock, Cpu, Layers, CalendarClock, ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { ModeBar } from '../components/ModeBar'
import { PythPriceTicker } from '../components/PythPriceTicker'
import { SeriesTable } from '../components/SeriesTable'
import { fetchConfig, fetchLiveStakePoolRate } from '../lib/api'
import { PROGRAM_ID } from '../lib/constants'

const explorer = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`

export default function HomePage() {
  const { data: config } = useQuery({ queryKey: ['config'], queryFn: fetchConfig })
  const { data: pool } = useQuery({ queryKey: ['stakePool'], queryFn: fetchLiveStakePoolRate })


  const steps = [
    { icon: Layers, title: 'Strip', body: 'Deposit collateral into a series vault; receive equal PT (principal) and YT (yield) for one maturity date.' },
    { icon: Lock, title: 'Seal', body: 'Requester and invited dealers sign and HPKE-seal orders in the browser. The relay only ever holds ciphertext.' },
    { icon: Cpu, title: 'Match', body: 'A Chainlink CRE workflow decrypts the round, picks the best quote within the limit and signs a fill. Losing quotes go nowhere.' },
    { icon: CalendarClock, title: 'Settle', body: 'On Solana, the fill moves escrowed tokens. At maturity the index is read on-chain; PT redeems principal, YT claims growth, in kind.' },
  ]

  return (
    <div className="min-h-screen text-white flex flex-col font-sans relative">
      <Header />
      <ModeBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <section className="max-w-4xl mb-14">
          <p className="font-mono text-xs text-[#a3a3a3] mb-4">Kalend · every risk has a date</p>
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight leading-[1.1] mb-6">
            A private request-for-quote desk for dated yield on Solana.
          </h1>
          <p className="text-base sm:text-lg text-[#a3a3a3] leading-relaxed mb-8 max-w-2xl">
            Split a yield-bearing asset into principal and yield tokens, then ask dealers for a sealed quote.
            Only the signed fill and the maturity result touch the public chain.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/rfq/new" className="px-6 py-3 rounded-[3px] bg-white text-black font-medium text-sm flex items-center gap-2 hover:bg-[#e6e6e6]">
              Request a quote <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dealer" className="px-6 py-3 rounded-[3px] border border-white/20 hover:border-white text-sm">
              Dealer desk
            </Link>
            <Link href="/trust" className="px-6 py-3 rounded-[3px] border border-[#262626] hover:border-[#555] text-[#a3a3a3] hover:text-white text-sm">
              What is and is not private
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="p-5 rounded-[4px] bg-[#0a0a0a] border border-[#222]">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#4ade80]" />
                <span className="font-mono text-[10px] text-[#737373]">0{i + 1}</span>
                <span className="font-serif text-base">{title}</span>
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <section className="mb-14">
          <SeriesTable />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222] font-mono text-xs space-y-3">
            <h2 className="font-serif text-lg">Live index source</h2>
            {pool ? (
              <>
                <div className="flex justify-between"><span className="text-[#737373]">Stake pool exchange rate</span><span>{pool.exchangeRate.toFixed(9)}</span></div>
                <div className="flex justify-between"><span className="text-[#737373]">Growth since pool launch</span><span>{pool.growthSinceInceptionPct.toFixed(4)}%</span></div>
                <a className="underline text-[#a3a3a3]" href={explorer(pool.sourceAccount)} target="_blank" rel="noreferrer">SPL stake pool {pool.sourceAccount.slice(0, 8)}…</a>
                <p className="text-[#737373] leading-relaxed">
                  settle_onchain reads total_lamports / pool_token_supply from this account itself, so CRE is not a liveness
                  dependency for staking series. The rate moves once per epoch (2 to 3 days); a series that crosses no epoch shows zero yield.
                </p>
              </>
            ) : (
              <p className="text-[#737373]">Reading stake pool…</p>
            )}
          </div>
          <PythPriceTicker />
        </section>

        <footer className="border-t border-white/10 pt-6 font-mono text-[11px] text-[#737373] flex flex-wrap gap-x-6 gap-y-2">
          <a className="hover:text-white" href={explorer(PROGRAM_ID.toBase58())} target="_blank" rel="noreferrer">Program {PROGRAM_ID.toBase58().slice(0, 8)}…</a>
          <span>Protocol {config ? (config.paused ? 'PAUSED' : 'active') : '…'}</span>
          <span>Forwarders registered: {config?.forwarder_count ?? '…'}</span>
          <span>Enclave key hash {config ? `${config.enclave_key_hash.slice(0, 12)}…` : '…'}</span>
        </footer>
      </main>
    </div>
  )
}
