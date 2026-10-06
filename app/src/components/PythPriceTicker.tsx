'use client'

import React, { useEffect, useState } from 'react'
import { Activity, ShieldAlert, TrendingUp } from 'lucide-react'

import {
  PYTH_HERMES_URL,
  PYTH_API_KEY,
  PYTH_FEED_SOL_USD,
  PYTH_FEED_BTC_USD,
} from '../lib/constants'

interface PriceData {
  id: string
  symbol: string
  price: string
  conf: string
  publishTime: number
  source: string
}

// Pyth Feeds for SOL/USD and BTC/USD
const PYTH_FEEDS = [
  {
    symbol: 'SOL/USD',
    feedId: PYTH_FEED_SOL_USD,
    pubkey: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
  },
  {
    symbol: 'BTC/USD',
    feedId: PYTH_FEED_BTC_USD,
    pubkey: 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J',
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
        // 1. Try Authenticated Pyth Hermes API
        if (PYTH_API_KEY) {
          const feedIdsQuery = PYTH_FEEDS.map((f) => `ids[]=${f.feedId}`).join('&')
          const hermesRes = await fetch(
            `${PYTH_HERMES_URL}/v2/updates/price/latest?${feedIdsQuery}&parsed=true`,
            {
              headers: {
                Authorization: `Bearer ${PYTH_API_KEY}`,
              },
            }
          ).catch(() => null)

          if (hermesRes && hermesRes.ok) {
            const data = await hermesRes.json()
            if (data?.parsed && Array.isArray(data.parsed)) {
              const results: PriceData[] = []
              for (const feed of PYTH_FEEDS) {
                const cleanId = feed.feedId.replace('0x', '')
                const item = data.parsed.find(
                  (p: any) => p.id === cleanId || `0x${p.id}` === feed.feedId
                )
                if (item?.price) {
                  const pNum = Number(item.price.price) * Math.pow(10, item.price.expo)
                  const confNum = Number(item.price.conf) * Math.pow(10, item.price.expo)
                  results.push({
                    id: feed.feedId,
                    symbol: feed.symbol,
                    price: pNum.toFixed(2),
                    conf: confNum.toFixed(2),
                    publishTime: item.price.publish_time,
                    source: 'Pyth Hermes Network (Live)',
                  })
                }
              }

              if (isMounted && results.length > 0) {
                setPrices(results)
                setIsLive(true)
                setLastUpdated(new Date().toLocaleTimeString())
                return
              }
            }
          }
        }

        // 2. Fallback to On-Chain Devnet Pyth Price Accounts
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
        const results: PriceData[] = []

        for (const feed of PYTH_FEEDS) {
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

          const base64Str = data.result.value.data[0]
          const binaryStr = atob(base64Str)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }

          const view = new DataView(bytes.buffer)
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
        console.error('Failed to read Pyth feeds:', err)
      }
    }

    fetchPythPrices()
    const interval = setInterval(fetchPythPrices, 8000)

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

      {prices.length === 0 ? (
        <div className="p-4 bg-black/40 border border-zinc-800/80 rounded-lg text-center font-mono text-xs text-zinc-500">
          Awaiting live oracle feed from on-chain Devnet Pyth program...
        </div>
      ) : (
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
      )}

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
