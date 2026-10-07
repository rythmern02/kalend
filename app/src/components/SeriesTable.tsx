'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { DataSourceTag } from './DataSourceTag'
import { StatusChip } from './StatusChip'
import { fetchAllSeries } from '../lib/api'

const STATUS = ['OPEN', 'SETTLED', 'DISPUTED', 'PAUSED']
const explorer = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`

/** Every series in the on-chain Registry, read live. */
export function SeriesTable() {
  const { data: allSeries = [], isLoading } = useQuery({ queryKey: ['series'], queryFn: fetchAllSeries, refetchInterval: 15_000 })
  const now = Math.floor(Date.now() / 1000)
  const series = [...allSeries].sort((a, b) => a.maturity_ts - b.maturity_ts)
  const open = series.filter((s) => s.status === 0 && s.maturity_ts > now)

  return (
    <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Series on devnet</h2>
            <DataSourceTag sourceName="Kalend Registry account (on-chain)" />
          </div>
          <div className="rounded-[4px] border border-[#222] overflow-x-auto">
            <table className="w-full text-left font-mono text-xs min-w-[640px]">
              <thead className="bg-[#0a0a0a] text-[#737373]">
                <tr>
                  <th className="p-3">Series</th>
                  <th className="p-3">Maturity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Index</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td className="p-3 text-[#737373]" colSpan={5}>Reading Registry…</td></tr>
                )}
                {!isLoading && series.length === 0 && (
                  <tr><td className="p-3 text-[#737373]" colSpan={5}>No series registered.</td></tr>
                )}
                {series.map((s) => {
                  const matured = s.maturity_ts <= now
                  return (
                    <tr key={s.pubkey} className="border-t border-[#1a1a1a]">
                      <td className="p-3">
                        <a href={explorer(s.pubkey)} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                          {s.pubkey.slice(0, 8)}… <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-3">{new Date(s.maturity_ts * 1000).toISOString().replace('T', ' ').slice(0, 16)} UTC</td>
                      <td className="p-3"><StatusChip status={matured && s.status === 0 ? 'MATURED' : STATUS[s.status] ?? '?'} /></td>
                      <td className="p-3 text-[#a3a3a3]">
                        {s.status === 1 ? `settled ${(Number(BigInt(s.idx_settle) / 10n ** 12n) / 1e6).toFixed(6)}` : `open ${(Number(BigInt(s.idx_open) / 10n ** 12n) / 1e6).toFixed(6)}`}
                      </td>
                      <td className="p-3 text-right space-x-3">
                        {s.status === 0 && !matured && <Link className="underline" href={`/series/${s.pubkey}/strip`}>Strip / merge</Link>}
                        <Link className="underline" href={`/series/${s.pubkey}/redeem`}>{s.status === 1 ? 'Redeem / claim' : 'Maturity'}</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 font-mono text-[11px] text-[#737373]">
            {open.length} open · collateral on devnet is a labeled TEST mint; no real asset backs these series.
          </p>
    </>
  )
}
