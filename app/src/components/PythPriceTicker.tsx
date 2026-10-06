'use client'

import React, { useEffect, useState } from 'react'
import { Activity, ShieldAlert, TrendingUp } from 'lucide-react'

interface PriceData {
  id: string
  symbol: string
  price: string
  conf: string
  publishTime: number
  source: string
}

// Real on-chain Pyth Price Accounts on Solana Devnet
// (Program: gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s)
const PYTH_ONCHAIN_FEEDS = [
  {
    symbol: 'SOL/USD',
    pubkey: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
  },
  {
    symbol: 'BTC/USD',
    pubkey: 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J',
  },
]

export function PythPriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('Connecting...')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function fetchPythOnChainPrices() {
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
        const results: PriceData[] = []

        for (const feed of PYTH_ONCHAIN_FEEDS) {
          const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getAccountInfo',
              params: [feed.pubkey, { encoding: 'base64' }],
            }),
          })

          if (!res.ok) continue
          const data = await res.json()
          if (!data?.result?.value?.data?.[0]) continue

          // Decode Pyth On-Chain Price Account Buffer (Base64)
          const base64Str = data.result.value.data[0]
          const binaryStr = atob(base64Str)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }

          const view = new DataView(bytes.buffer)
          // Pyth Account Layout:
          // offset 0..4: magic (0xa1b2c3d4)
          // offset 20..24: expo (int32 LE)
          // offset 208..216: agg.price (int64 LE)
          // offset 216..224: agg.conf (uint64 LE)
          // offset 224..232: agg.pub_slot (uint64 LE)
          const magic = view.getUint32(0, true)
          if (magic !== 0xa1b2c3d4) continue

          const expo = view.getInt32(20, true)
          const rawPrice = view.getBigInt64(208, true)
          const rawConf = view.getBigUint64(216, true)

          const formattedPrice = (Number(rawPrice) * Math.pow(10, expo)).toFixed(2)
          const formattedConf = (Number(rawConf) * Math.pow(10, expo)).toFixed(2)

          results.push({
            id: feed.pubkey,
            symbol: feed.symbol,
            price: formattedPrice,
            conf: formattedConf,
            publishTime: Math.floor(Date.now() / 1000),
            source: 'Solana Devnet On-Chain Pyth',
          })
        }

        if (isMounted && results.length > 0) {
          setPrices(results)
          setIsLive(true)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err) {
        console.error('Failed to read on-chain Pyth accounts:', err)
      }
    }

    fetchPythOnChainPrices()
    const interval = setInterval(fetchPythOnChainPrices, 8000)

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
            {isLive ? 'Live On-Chain (Devnet)' : 'Connecting...'}
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
                Live On-Chain
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-400 flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-amber-400 font-semibold">Display Price Only:</span> Read directly from
          the on-chain Pyth oracle program (`gSbePebfvPy7...`) on Solana. Per Prime Directive 2,
          settlement math is <span className="underline">never</span> derived from Pyth prices, but
          solely from attested stake pool / token multiplier exchange rates.
        </div>
      </div>
    </div>
  )
}
