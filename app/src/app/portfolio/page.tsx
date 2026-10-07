'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Program } from '@coral-xyz/anchor'
import { Header } from '../../components/Header'
import { ModeBar } from '../../components/ModeBar'
import { DataSourceTag } from '../../components/DataSourceTag'
import { fetchAllSeries } from '../../lib/api'
import { formatUnits, getMintDecimals } from '../../lib/solana'
import { withdrawEscrow } from '../../lib/kalend-client'
import { useWallet } from '../../lib/wallet'
import idl from '../../lib/idl/kalend.json'
import type { SeriesAccount } from '../../lib/types'

interface Holding {
  series: SeriesAccount
  decimals: number
  pt: bigint
  yt: bigint
}

interface EscrowRow {
  address: string
  series: string
  mint: string
  amount: bigint
  lockUntil: number
  decimals: number
  label: string
  isToken2022: boolean
}

const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`

export default function PortfolioPage() {
  const wallet = useWallet()
  const qc = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const owner = wallet.publicKey

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', wallet.walletAddress],
    enabled: !!owner,
    refetchInterval: 15_000,
    queryFn: async () => {
      const conn = wallet.connection
      const series = await fetchAllSeries()
      const decimals = new Map<string, number>()
      for (const s of series) {
        if (!decimals.has(s.collateral_mint)) decimals.set(s.collateral_mint, await getMintDecimals(conn, s.collateral_mint))
      }

      // PT/YT balances: one batched read of every ATA.
      const atas = series.flatMap((s) => [
        getAssociatedTokenAddressSync(new PublicKey(s.pt_mint), owner!, false, TOKEN_2022_PROGRAM_ID),
        getAssociatedTokenAddressSync(new PublicKey(s.yt_mint), owner!, false, TOKEN_2022_PROGRAM_ID),
      ])
      const infos = await conn.getMultipleAccountsInfo(atas)
      const amt = (i: number) => (infos[i] ? infos[i]!.data.readBigUInt64LE(64) : 0n)
      const holdings: Holding[] = series
        .map((s, i) => ({ series: s, decimals: decimals.get(s.collateral_mint)!, pt: amt(2 * i), yt: amt(2 * i + 1) }))
        .filter((h) => h.pt > 0n || h.yt > 0n)

      // Escrows owned by this wallet (Escrow.owner at offset 8).
      const program = new Program(idl as any, { connection: conn } as any)
      const escrowAccs = await (program.account as any).escrow.all([{ memcmp: { offset: 8, bytes: owner!.toBase58() } }])
      const escrows: EscrowRow[] = []
      for (const e of escrowAccs) {
        const a = e.account
        if (BigInt(a.amount.toString()) === 0n) continue
        const s = series.find((x) => x.pubkey === a.series.toBase58())
        const mint = a.mint.toBase58()
        const label = s ? (mint === s.pt_mint ? 'PT' : mint === s.yt_mint ? 'YT' : mint === s.quote_mint ? 'quote' : 'token') : 'token'
        const mintInfo = await conn.getAccountInfo(a.mint)
        escrows.push({
          address: e.publicKey.toBase58(),
          series: a.series.toBase58(),
          mint,
          amount: BigInt(a.amount.toString()),
          lockUntil: Number(a.lockUntil),
          decimals: mintInfo ? mintInfo.data[44] : 6,
          label,
          isToken2022: mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID) ?? false,
        })
      }
      return { holdings, escrows }
    },
  })

  async function withdraw(e: EscrowRow) {
    setBusy(e.address)
    setMsg(null)
    try {
      const sig = await withdrawEscrow(wallet, {
        seriesPubkey: e.series,
        mintPubkey: e.mint,
        amount: e.amount.toString(),
        isToken2022: e.isToken2022,
      })
      setMsg(`Withdrawn: ${sig}`)
      qc.invalidateQueries({ queryKey: ['portfolio'] })
    } catch (err: any) {
      setMsg(err.message ?? String(err))
    } finally {
      setBusy(null)
    }
  }

  const now = Math.floor(Date.now() / 1000)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div>
          <h1 className="font-serif text-3xl mb-1">Portfolio</h1>
          <p className="font-mono text-xs text-[#a8a8a8] break-all">{wallet.walletAddress ?? 'Wallet not connected'}</p>
        </div>

        {!wallet.connected ? (
          <button onClick={() => wallet.setShowConnectModal(true)} className="px-5 py-2.5 rounded-[3px] bg-white text-black text-sm">
            Connect wallet
          </button>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl">PT / YT holdings</h2>
                <DataSourceTag sourceName="Token-2022 accounts (on-chain)" />
              </div>
              <div className="rounded-[4px] border border-[#222] overflow-x-auto">
                <table className="w-full text-left font-mono text-xs min-w-[560px]">
                  <thead className="bg-[#0a0a0a] text-[#737373]">
                    <tr><th className="p-3">Series</th><th className="p-3">Maturity</th><th className="p-3">PT</th><th className="p-3">YT</th><th className="p-3 text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {isLoading && <tr><td className="p-3 text-[#737373]" colSpan={5}>Reading token accounts…</td></tr>}
                    {data && data.holdings.length === 0 && <tr><td className="p-3 text-[#737373]" colSpan={5}>No PT or YT in this wallet. <Link className="underline" href="/vaults">Strip a series</Link>.</td></tr>}
                    {data?.holdings.map((h) => (
                      <tr key={h.series.pubkey} className="border-t border-[#1a1a1a]">
                        <td className="p-3">{short(h.series.pubkey)}</td>
                        <td className="p-3">{new Date(h.series.maturity_ts * 1000).toISOString().slice(0, 16).replace('T', ' ')}</td>
                        <td className="p-3">{formatUnits(h.pt, h.decimals)}</td>
                        <td className="p-3">{formatUnits(h.yt, h.decimals)}</td>
                        <td className="p-3 text-right">
                          {h.series.maturity_ts <= now || h.series.status === 1
                            ? <Link className="underline" href={`/series/${h.series.pubkey}/redeem`}>Settle / redeem</Link>
                            : <Link className="underline" href={`/series/${h.series.pubkey}/strip`}>Merge</Link>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl">Escrows</h2>
                <DataSourceTag sourceName="Kalend Escrow accounts (on-chain)" />
              </div>
              <p className="text-xs text-[#a3a3a3] mb-3">
                Escrowed tokens back your requests and quotes. They cannot be withdrawn before lock_until, so an approved fill cannot be starved.
              </p>
              <div className="rounded-[4px] border border-[#222] overflow-x-auto">
                <table className="w-full text-left font-mono text-xs min-w-[560px]">
                  <thead className="bg-[#0a0a0a] text-[#737373]">
                    <tr><th className="p-3">Series</th><th className="p-3">Asset</th><th className="p-3">Amount</th><th className="p-3">Locked until</th><th className="p-3 text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {data && data.escrows.length === 0 && <tr><td className="p-3 text-[#737373]" colSpan={5}>No escrowed balances.</td></tr>}
                    {data?.escrows.map((e) => (
                      <tr key={e.address} className="border-t border-[#1a1a1a]">
                        <td className="p-3">{short(e.series)}</td>
                        <td className="p-3">{e.label}</td>
                        <td className="p-3">{formatUnits(e.amount, e.decimals)}</td>
                        <td className="p-3">{new Date(e.lockUntil * 1000).toISOString().slice(11, 19)} UTC</td>
                        <td className="p-3 text-right">
                          {e.lockUntil <= now ? (
                            <button onClick={() => withdraw(e)} disabled={busy !== null} className="underline disabled:opacity-50">
                              {busy === e.address ? 'Withdrawing…' : 'Withdraw'}
                            </button>
                          ) : (
                            <span className="text-[#737373]">locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {msg && <p className="mt-2 font-mono text-[11px] text-[#a3a3a3] break-all">{msg}</p>}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
