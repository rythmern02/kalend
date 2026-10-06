'use client'

import React, { useState } from 'react'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import { DataSourceTag } from '../../components/DataSourceTag'
import { TiltCard } from '../../components/TiltCard'
import {
  Download,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  ShieldCheck,
  Inbox,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchFillReceipts } from '../../lib/api'
import { useWallet } from '../../lib/wallet'

export default function ReceiptsPage() {
  const modeBarState = useModeBarState()
  const wallet = useWallet()

  const { data: fillReceipts, isLoading } = useQuery({
    queryKey: ['fillReceipts'],
    queryFn: fetchFillReceipts,
  })

  // Export to CSV function
  const handleExportCSV = () => {
    if (!fillReceipts || fillReceipts.length === 0) return
    const headers = ['Round ID', 'Series', 'Side', 'Asset Amount', 'Quote Amount', 'Status', 'Report Hash']
    const rows = fillReceipts.map((r: any) => [
      r.round_id,
      r.series,
      r.side,
      r.asset_amount,
      r.quote_amount,
      r.status,
      r.report_hash,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `kalend_receipts_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const receiptsList = fillReceipts || []

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-10 border-b border-[#222222] gap-4">
          <div>
            <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
              Institutional Trade Confirmation
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-2">
              Settlement Receipts & Audit
            </h1>
            <p className="text-sm text-[#a8a8a8] max-w-xl">
              Immutable on-chain FillReceipt PDAs and settlement records verified by Chainlink Keystone Forwarder reports.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={receiptsList.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[2px] font-mono text-xs font-semibold transition-all shrink-0 ${
              receiptsList.length > 0
                ? 'bg-white text-black hover:bg-[#e6e6e6] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                : 'bg-[#181818] text-[#555] cursor-not-allowed border border-[#262626]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Audit</span>
          </button>
        </div>

        {/* Table of Receipts */}
        <TiltCard accent="default" intensity={3} enableGlare={false}>
          <div className="overflow-hidden">
            <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between">
              <h2 className="font-serif text-lg text-white font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                Executed RFQ Fills
              </h2>
              <DataSourceTag sourceName="Solana FillReceipt PDAs" />
            </div>

            {isLoading ? (
              <div className="p-12 text-center font-mono text-xs text-[#a8a8a8]">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Querying on-chain FillReceipt PDAs...</span>
              </div>
            ) : receiptsList.length === 0 ? (
              <div className="p-16 text-center font-mono text-xs">
                <div className="w-12 h-12 rounded-[2px] bg-[#141414] border border-[#262626] flex items-center justify-center text-[#737373] mx-auto mb-4">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium text-white mb-1">No Fills Found on Chain</h3>
                <p className="text-[#737373] text-[11px] max-w-md mx-auto leading-relaxed">
                  No executed settlement receipts found on Solana Devnet for this wallet. Completed RFQ fills settled through Chainlink Keystone Forwarder will appear here with cryptographic report hashes and on-chain explorer links.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] text-[#737373] bg-[#0d0d0d]">
                      <th className="py-3 px-5">Round ID</th>
                      <th className="py-3 px-5">Series</th>
                      <th className="py-3 px-5">Side</th>
                      <th className="py-3 px-5">Asset Size</th>
                      <th className="py-3 px-5">Proceeds</th>
                      <th className="py-3 px-5">Report Hash</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818]">
                    {receiptsList.map((r: any) => (
                      <tr key={r.round_id} className="hover:bg-[#121212] transition-colors">
                        <td className="py-4 px-5 text-white">
                          <span className="truncate block max-w-[120px]">
                            {r.round_id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-5 text-[#a8a8a8]">
                          <span className="truncate block max-w-[120px]">
                            {r.series.slice(0, 4)}...{r.series.slice(-4)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-white">{r.side}</td>
                        <td className="py-4 px-5 text-white font-medium">{r.asset_amount}</td>
                        <td className="py-4 px-5 text-[#4ade80] font-medium">{r.quote_amount}</td>
                        <td className="py-4 px-5 text-[#737373] font-mono text-[11px]">
                          {r.report_hash.slice(0, 10)}...
                        </td>
                        <td className="py-4 px-5">
                          <StatusChip status={r.status} />
                        </td>
                        <td className="py-4 px-5 text-right">
                          <a
                            href={`https://explorer.solana.com/address/227GaCtKiP4mFch4AtZBLAviLcJBgJYeCpxXPWAQfNS1?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#a8a8a8] hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TiltCard>
      </main>
    </div>
  )
}
