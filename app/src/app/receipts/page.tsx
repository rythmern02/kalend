'use client'

import React, { useState } from 'react'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { StatusChip } from '../../components/StatusChip'
import { DataSourceTag } from '../../components/DataSourceTag'
import {
  Download,
  ExternalLink,
  Receipt,
  Search,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchFillReceipts } from '../../lib/api'

export default function ReceiptsPage() {
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: fillReceipts, isLoading } = useQuery({
    queryKey: ['fillReceipts'],
    queryFn: fetchFillReceipts,
  })

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = ['Round ID', 'Series', 'Side', 'Asset Amount', 'Quote Amount', 'Status', 'Report Hash']
    const rows = (fillReceipts || [
      {
        round_id: '8888888888888888888888888888888888888888888888888888888888888888',
        series: 'CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY',
        requester: 'Pga9...SoLnX',
        dealer: 'Dealer...777',
        side: 'SellPT',
        asset_amount: '1000000',
        quote_amount: '965000',
        ts: Date.now() - 3600000,
        report_hash: 'd3b07384d113edec49eaa6238ad5ff00',
        status: 'Executed',
      },
      {
        round_id: '7777777777777777777777777777777777777777777777777777777777777777',
        series: 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6',
        requester: 'Pga9...SoLnX',
        dealer: 'Dealer...888',
        side: 'SellPT',
        asset_amount: '2000000',
        quote_amount: '1926000',
        ts: Date.now() - 7200000,
        report_hash: 'b10a8db164e0754105b7a99be72e3fe5',
        status: 'Executed',
      },
    ]).map((r) => [
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

  const receiptsList = fillReceipts && fillReceipts.length > 0 ? fillReceipts : [
    {
      round_id: '8888888888888888888888888888888888888888888888888888888888888888',
      series: 'CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY',
      requester: 'Pga9...SoLnX',
      dealer: 'Dealer...777',
      side: 'SellPT',
      asset_amount: '1,000,000 PT',
      quote_amount: '965,000 USDC',
      ts: Date.now() - 3600000,
      report_hash: 'd3b07384d113edec49eaa6238ad5ff00',
      status: 'Executed',
    },
    {
      round_id: '7777777777777777777777777777777777777777777777777777777777777777',
      series: 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6',
      requester: 'Pga9...SoLnX',
      dealer: 'Dealer...888',
      side: 'SellPT',
      asset_amount: '2,000,000 PT',
      quote_amount: '1,926,000 USDC',
      ts: Date.now() - 7200000,
      report_hash: 'b10a8db164e0754105b7a99be72e3fe5',
      status: 'Executed',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
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
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium text-xs font-mono rounded-[2px] hover:bg-[#e6e6e6] transition-colors shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV Audit</span>
          </button>
        </div>

        {/* Table of Receipts */}
        <div className="rounded-[4px] bg-[#0a0a0a] border border-[#222222] overflow-hidden mb-12">
          <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between">
            <h2 className="font-serif text-lg text-white font-medium">
              Executed RFQ Fills
            </h2>
            <DataSourceTag sourceName="Solana FillReceipt PDAs" />
          </div>

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
                {receiptsList.map((r) => (
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
        </div>
      </main>
    </div>
  )
}
