'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RELAY_API_URL } from '../lib/constants'

/**
 * Global mode banner (spec section 10, non-negotiable): states exactly what is running.
 * CRE mode is read from the relay's /health; everything else is fixed by what is deployed.
 */

export interface ModeBarState {
  isPrivacyMode: boolean
}

/** Kept for existing callers. Token privacy is Plain for every deployed series. */
export function useModeBarState(): ModeBarState {
  return { isPrivacyMode: false }
}

function Item({ k, v, tone = 'neutral' }: { k: string; v: string; tone?: 'ok' | 'warn' | 'neutral' }) {
  const color = tone === 'ok' ? 'text-[#4ade80]' : tone === 'warn' ? 'text-[#fbbf24]' : 'text-white'
  return (
    <span className="whitespace-nowrap">
      <span className="text-[#737373]">{k}: </span>
      <span className={color}>{v}</span>
    </span>
  )
}

export function ModeBar(_props: { state?: ModeBarState }) {
  const { data: health, isError } = useQuery({
    queryKey: ['relay-health'],
    queryFn: async () => {
      const r = await fetch(`${RELAY_API_URL}/health`)
      if (!r.ok) throw new Error('relay down')
      return r.json()
    },
    refetchInterval: 15_000,
    retry: 2,
  })

  // Keep the last good reading through a transient failed poll.
  const cre = !health
    ? { v: isError ? 'Relay offline' : 'checking…', tone: 'warn' as const }
    : health.cre?.mode === 'simulator'
      ? { v: 'Simulator (mock forwarder, not an enclave)', tone: 'warn' as const }
      : { v: 'Unavailable', tone: 'warn' as const }

  return (
    <div className="w-full border-b border-[#222222] bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-mono">
        <Item k="Cluster" v="devnet" tone="warn" />
        <Item k="CRE" v={cre.v} tone={cre.tone} />
        <Item k="Orders" v="HPKE-sealed in browser" tone="ok" />
        <Item k="Token privacy" v="Plain" />
        <Item k="Index data" v="live stake-pool rate · TEST collateral mints" />
      </div>
    </div>
  )
}
