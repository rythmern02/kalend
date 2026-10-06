'use client'

import React, { useState } from 'react'
import { ArrowDownUp, Layers, CheckCircle2, AlertCircle } from 'lucide-react'

import { useWallet } from '../lib/wallet'
import { stripTokens, mergeTokens } from '../lib/kalend-client'
import { fetchAllSeries } from '../lib/api'

export function StripMergeTab({ walletAddress: propWalletAddress }: { walletAddress?: string | null }) {
  const wallet = useWallet()
  const [mode, setMode] = useState<'strip' | 'merge'>('strip')
  const [amount, setAmount] = useState('1000')
  const [status, setStatus] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    if (!wallet.connected) {
      wallet.setShowConnectModal(true)
      return
    }

    setIsLoading(true)
    setStatus(mode === 'strip' ? 'Stripping collateral on-chain into equal PT and YT...' : 'Merging PT and YT on-chain to release collateral...')
    setTxHash(null)
    setErrorMessage(null)

    try {
      const allSeries = await fetchAllSeries()
      const series = allSeries[0]
      if (!series) {
        throw new Error('No active on-chain series found in registry.')
      }

      const parsedAmount = BigInt(Math.floor(Number(amount) * 1e9))
      let sig: string
      if (mode === 'strip') {
        sig = await stripTokens(wallet, {
          seriesPubkey: series.pubkey,
          amount: parsedAmount,
        })
      } else {
        sig = await mergeTokens(wallet, {
          seriesPubkey: series.pubkey,
          amount: parsedAmount,
        })
      }

      setTxHash(sig)
      setStatus(
        mode === 'strip'
          ? `Successfully stripped ${amount} collateral tokens into PT and YT!`
          : `Successfully merged ${amount} PT and YT tokens back to raw collateral!`
      )
    } catch (err: any) {
      console.error('Strip/Merge transaction failed:', err)
      setErrorMessage(err.message || 'Transaction rejected on-chain')
      setStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Overview Card */}
      <div className="bg-[#121218] border border-[#24242e] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-serif font-semibold text-foreground">
              {mode === 'strip' ? 'Strip Collateral' : 'Merge PT & YT'}
            </h2>
            <p className="text-xs text-muted">
              {mode === 'strip'
                ? 'Split 1 unit of interest-bearing collateral into 1 Principal Token (PT) and 1 Yield Token (YT).'
                : 'Recombine equal 1:1 PT and YT before maturity to withdraw your underlying collateral.'}
            </p>
          </div>
          <div className="flex bg-[#1a1a24] p-1 rounded-lg border border-[#2d2d38]">
            <button
              onClick={() => setMode('strip')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'strip' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-muted'
              }`}
            >
              Strip
            </button>
            <button
              onClick={() => setMode('merge')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                mode === 'merge' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-muted'
              }`}
            >
              Merge
            </button>
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5">
              {mode === 'strip' ? 'Collateral Amount (e.g. JitoSOL)' : 'PT & YT Amount to Merge'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#181822] border border-[#2d2d38] rounded-lg px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-amber-500/50"
              />
              <div className="absolute right-3 top-3 text-xs font-mono text-zinc-400">UNITS</div>
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="p-3.5 bg-black/30 border border-zinc-800 rounded-lg space-y-2 text-xs font-mono">
            <div className="flex justify-between text-zinc-400">
              <span>Underlying Asset:</span>
              <span className="text-foreground">JitoSOL (SPL Stake Pool)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Expected Output:</span>
              <span className="text-foreground font-semibold">
                {mode === 'strip' ? `+${amount} PT & +${amount} YT` : `+${amount} Raw Collateral`}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Conservation Invariant:</span>
              <span className="text-emerald-400">INV1 Enforced (1:1 Ratio)</span>
            </div>
          </div>

          <button
            onClick={handleAction}
            disabled={isLoading || !amount || Number(amount) <= 0}
            className="w-full py-3 rounded-lg font-medium text-xs font-mono tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing Transaction...' : mode === 'strip' ? 'Strip to PT & YT' : 'Merge PT & YT'}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Transaction Error</p>
              <p className="font-mono text-[11px] break-all">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {status && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{status}</p>
              {txHash && (
                <a
                  href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-emerald-400 underline block"
                >
                  View on Solana Explorer →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
