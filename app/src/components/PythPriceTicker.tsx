'use client'

import React, { useEffect, useState } from 'react'
import { Activity, ShieldAlert, TrendingUp } from 'lucide-react'

interface PriceData {
  id: string
  symbol: string
  price: string
  conf: string
  publishTime: number
}

const PYTH_FEEDS = [
  {
    id: '0xef0d8b0f970e37f7f4231dbab72b87e45243458cd803a345e3d79ef3037f7f42',
    symbol: 'SOL/USD',
  },
  {
    id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    symbol: 'BTC/USD',
  },
]

export function PythPriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('Connecting...')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchPythPrices() {
      try {
        const ids = PYTH_FEEDS.map((f) => f.id)
        const query = ids.map((id) => `ids[]=${id}`).join('&')
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?${query}`, {
          cache: 'no-store',
        })
        if (!res.ok) return

        const data = await res.json()
        if (data.parsed && Array.isArray(data.parsed)) {
          const parsedPrices: PriceData[] = data.parsed.map((item: any) => {
            const feedMeta = PYTH_FEEDS.find((f) => f.id.toLowerCase() === item.id.toLowerCase())
            const expo = item.price.expo
            const rawPrice = BigInt(item.price.price)
            const rawConf = BigInt(item.price.conf)

            const formattedPrice = (Number(rawPrice) * Math.pow(10, expo)).toFixed(2)
            const formattedConf = (Number(rawConf) * Math.pow(10, expo)).toFixed(2)

            return {
              id: item.id,
              symbol: feedMeta?.symbol || 'UNKNOWN',
              price: formattedPrice,
              conf: formattedConf,
              publishTime: item.price.publish_time,
            }
          })

          if (isMounted) {
            setPrices(parsedPrices)
            setIsLive(true)
            setLastUpdated(new Date().toLocaleTimeString())
          }
        }
      } catch (err) {
        // Fallback for offline / isolated environments
        if (isMounted && prices.length === 0) {
          setPrices([
            {
              id: PYTH_FEEDS[0].id,
              symbol: 'SOL/USD',
              price: '154.20',
              conf: '0.08',
              publishTime: Math.floor(Date.now() / 1000),
            },
            {
              id: PYTH_FEEDS[1].id,
              symbol: 'BTC/USD',
              price: '64850.00',
              conf: '12.50',
              publishTime: Math.floor(Date.now() / 1000),
            },
          ])
          setIsLive(false)
          setLastUpdated('Simulated Feed')
        }
      }
    }

    fetchPythPrices()
    const interval = setInterval(fetchPythPrices, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="bg-[#121218] border border-[#24242e] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-serif font-semibold text-foreground uppercase tracking-wider">
            Pyth Reference Oracles
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Tier 1
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <span>Updated: {lastUpdated}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {prices.map((p) => (
          <div
            key={p.id}
            className="p-3 bg-black/40 border border-zinc-800/80 rounded-lg flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-mono font-medium text-zinc-300">{p.symbol}</div>
              <div className="text-[10px] text-zinc-500 font-mono">±${p.conf} conf</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-foreground">${p.price}</div>
              <div className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                Live
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-amber-400 font-semibold">Display Price Only:</span> Pyth feeds are
          shown for reference and display. Per Prime Directive 2, settlement math is{' '}
          <span className="underline">never</span> derived from Pyth prices, but solely from attested
          on-chain stake pool or token multiplier exchange rates.
        </div>
      </div>
    </div>
  )
}
