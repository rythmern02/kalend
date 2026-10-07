'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Lock, Cpu, Layers, CalendarClock, ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { ModeBar } from '../components/ModeBar'
import { PythPriceTicker } from '../components/PythPriceTicker'
import { SeriesTable } from '../components/SeriesTable'
import { StripObject3D } from '../components/StripObject3D'
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
        <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] items-center gap-6 lg:gap-10 mb-16">
          <div>
            <p className="font-pinyon text-3xl text-white/80 mb-3">Every risk has a date</p>
            <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight leading-[1.05] mb-6">
              A private request-for-quote desk for{' '}
              <span className="relative inline-block whitespace-nowrap">
                dated yield
                <svg aria-hidden className="hand-underline absolute left-0 -bottom-2 w-full h-4" viewBox="0 0 300 16" preserveAspectRatio="none" fill="none">
                  <path d="M3 11c38-6 84-8 132-6 52 2 104 1 162-5" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>{' '}
              on Solana.
            </h1>
            <p className="text-base sm:text-lg text-[#b5b5b5] leading-relaxed mb-8 max-w-xl">
              Split a yield-bearing asset into principal and yield tokens, then ask dealers for a sealed quote.
              Only the signed fill and the maturity result touch the public chain.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/rfq/new" className="group px-6 py-3 rounded-[4px] bg-white text-black font-medium text-sm flex items-center gap-2 transition-colors hover:bg-[#e6e6e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                Request a quote <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
              </Link>
              <Link href="/dealer" className="px-6 py-3 rounded-[4px] border border-white/20 text-sm transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Dealer desk
              </Link>
              <Link href="/trust" className="px-6 py-3 rounded-[4px] text-[#b5b5b5] text-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                What is and is not private →
              </Link>
            </div>
          </div>
          <div className="relative">
            <StripObject3D />
            <p className="font-hand text-xl text-white/70 text-center -mt-2 -rotate-2">
              one deposit → <span className="text-[#4ade80]">principal</span> + <span className="text-[#fbbf24]">yield</span>, same date
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-16">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="depth-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center bg-black/40">
                  <Icon className="w-4 h-4 text-[#4ade80]" aria-hidden />
                </span>
                <span className="font-hand text-2xl text-white/35">{i + 1}</span>
              </div>
              <h3 className="font-serif text-xl mb-1.5">{title}</h3>
              <p className="text-[13px] text-[#b5b5b5] leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <section className="mb-14">
          <SeriesTable />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="depth-card p-6 font-mono text-xs space-y-3">
            <h2 className="font-serif text-xl">Live index source</h2>
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
