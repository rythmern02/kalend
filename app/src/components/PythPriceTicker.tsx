'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, ShieldAlert } from 'lucide-react'
import { connection } from '../lib/api'
import { fetchPythPrices, PYTH_STALE_AFTER_SECS, type PythSymbol } from '../lib/pyth'

const SYMBOLS: PythSymbol[] = ['SOL/USD', 'JITOSOL/USD', 'BTC/USD']

export function PythPriceTicker() {
  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['pyth-ticker'],
    queryFn: () => fetchPythPrices(connection, SYMBOLS),
    refetchInterval: 10_000,
  })
  const now = Math.floor(Date.now() / 1000)

  return (
    <div className="bg-[#121218] border border-[#24242e] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-serif font-semibold text-foreground uppercase tracking-wider">
          Pyth reference prices
        </span>
      </div>

      {prices.length === 0 ? (
        <div className="p-4 bg-black/40 border border-zinc-800/80 rounded-lg text-center font-mono text-xs text-zinc-500">
          {isLoading ? 'Reading Pyth receiver accounts…' : 'No Pyth price available from devnet right now.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {prices.map((p) => {
            const age = now - p.publishTime
            const stale = age > PYTH_STALE_AFTER_SECS
            return (
              <div key={p.symbol} className="p-3 bg-black/40 border border-zinc-800/80 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">{p.symbol}</span>
                  <span className={`text-[10px] font-mono ${stale ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stale ? `stale ${age}s` : `${Math.max(age, 0)}s ago`}
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-foreground">${p.price.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-500 font-mono">±${p.conf.toFixed(3)}</div>
                {p.account && (
                  <a
                    className="text-[10px] font-mono text-purple-400 hover:underline"
                    href={`https://explorer.solana.com/address/${p.account}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {p.account.slice(0, 6)}…{p.account.slice(-4)}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-amber-400 font-semibold">Display only.</span> Read from Pyth Solana
          Receiver price-feed accounts on devnet (owner and feed ID checked). Settlement never uses
          Pyth: it uses the on-chain stake-pool exchange rate.
        </div>
      </div>
    </div>
  )
}
