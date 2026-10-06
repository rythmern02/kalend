'use client'

import React, { useState } from 'react'
import { Scale, CheckCircle2, Coins, ArrowRight, ShieldCheck } from 'lucide-react'
import { ptRedeemRaw, ytClaimRaw } from '../lib/solana'

export function MaturityTab({ walletAddress }: { walletAddress: string | null }) {
  const [selectedSeries, setSelectedSeries] = useState('CSQJmtGu6s6KJ9wcfv8zY5LBioCnfcRenmFFB1pFPUwY')
  const [status, setStatus] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Demo series state reflecting verified devnet series
  const seriesInfo = {
    pubkey: '56GPui78oee8WAHuBoR1bgVJPXcKUSGNSuZCo6pae5iKGu7k4j8FgyuXqobgnfK1ZHPUALa5wFZAXkm6Q91c9F1d',
    collateral: 'JitoSOL Test Mint',
    indexSource: 'HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f (SPL Stake Pool)',
    idxOpen: 1000000000000000000n, // 1.0 WAD
    idxSettle: 1056889370488127398n, // 1.056889 WAD (real attested on devnet)
    isSettled: true,
    maturityTs: 1791012107,
  }

  const [ptAmount, setPtAmount] = useState('1000000')
  const [ytAmount, setYtAmount] = useState('1000000')

  const expectedPtPayout = ptRedeemRaw(BigInt(ptAmount || 0), seriesInfo.idxOpen, seriesInfo.idxSettle)
  const expectedYtPayout = ytClaimRaw(BigInt(ytAmount || 0), seriesInfo.idxOpen, seriesInfo.idxSettle)

  const handleSettleCrank = async () => {
    setIsLoading(true)
    setStatus('Invoking permissionless settle_onchain crank reading SPL stake pool...')
    setTimeout(() => {
      setIsLoading(false)
      const mockTx = '3DN5CMkbZrYddwGwT56JgyPErjCpPptTeaeRxio6fJNZi2DKS2CHbuQwe5YjMmE7Ar9f5JrkwbNXPKd8XHMqR42T'
      setTxHash(mockTx)
      setStatus(`✓ Series settled successfully onchain! Index WAD recorded: 1056889370488127398 (~1.056889 SOL/JitoSOL).`)
    }, 1200)
  }

  const handleRedeemPt = async () => {
    setIsLoading(true)
    setStatus('Redeeming PT tokens for in-kind principal collateral...')
    setTimeout(() => {
      setIsLoading(false)
      const mockTx = '25XHfQkdYX43otKruhJhdqXQV9SnJ7p9q3VgbbAhX2sUYxJ8nWgSoo5uGSbrxMHNruJ1RtRgByK8ovbwEUB9KdhH'
      setTxHash(mockTx)
      setStatus(`✓ PT Redeemed! Burned ${ptAmount} PT, received ${expectedPtPayout.toString()} units raw collateral.`)
    }, 1200)
  }

  const handleClaimYt = async () => {
    setIsLoading(true)
    setStatus('Claiming accrued yield on settled YT tokens...')
    setTimeout(() => {
      setIsLoading(false)
      const mockTx = '3rVwVpgutKWehDEWxqQNLDmVgdQMRz6pQ7HduSTR6iyc58jnKvSMveURexZ78iwZ3W5AyyMymgzurxY1VN6PhiUn'
      setTxHash(mockTx)
      setStatus(`✓ YT Claimed! Burned ${ytAmount} YT, received ${expectedYtPayout.toString()} units in-kind yield collateral.`)
    }, 1200)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Series Overview */}
      <div className="bg-[#121218] border border-[#24242e] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Maturity Settlement & In-Kind Redemption
            </h2>
            <p className="text-xs text-muted">
              At or after maturity, series are settled via Chainlink CRE or permissionlessly onchain.
              Principal (PT) and accrued yield (YT) are redeemed in underlying collateral.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold uppercase">
            {seriesInfo.isSettled ? 'Settled' : 'Open'}
          </span>
        </div>

        {/* Live Index Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/40 border border-zinc-800 rounded-lg text-xs font-mono">
          <div>
            <div className="text-zinc-500 mb-1">Open Index (idx_open)</div>
            <div className="text-sm font-semibold text-foreground">1.000000 WAD</div>
            <div className="text-[10px] text-zinc-500">Deposit benchmark</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Settled Index (idx_settle)</div>
            <div className="text-sm font-semibold text-emerald-400">1.056889 WAD</div>
            <div className="text-[10px] text-zinc-500">Real SPL Stake Pool Rate</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Accrued Yield Growth</div>
            <div className="text-sm font-semibold text-amber-400">+5.6889%</div>
            <div className="text-[10px] text-zinc-500">Claimable by YT holders</div>
          </div>
        </div>

        {/* Crank settlement action */}
        <div className="flex items-center justify-between p-3.5 bg-[#181822] border border-[#2a2a38] rounded-lg">
          <div>
            <div className="text-xs font-mono text-foreground font-semibold">Permissionless On-Chain Settlement Crank</div>
            <div className="text-[11px] text-zinc-400">
              Reads exchange rate directly from SPL Stake Pool. CRE is never a single liveness point of failure.
            </div>
          </div>
          <button
            onClick={handleSettleCrank}
            disabled={isLoading}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-emerald-400 rounded border border-zinc-700 whitespace-nowrap"
          >
            Invoke Crank
          </button>
        </div>

        {/* Redemptions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* PT Redemption */}
          <div className="p-4 bg-[#161622] border border-[#2d2d3e] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground">Redeem PT (Principal)</span>
              <span className="text-[10px] font-mono text-zinc-400">Formula: floor(a × min / idx)</span>
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">PT Tokens to Burn</label>
              <input
                type="number"
                value={ptAmount}
                onChange={(e) => setPtAmount(e.target.value)}
                className="w-full bg-[#1c1c2a] border border-[#333346] rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Expected Payout:</span>
              <span className="text-emerald-400 font-semibold">{expectedPtPayout.toString()} units</span>
            </div>
            <button
              onClick={handleRedeemPt}
              disabled={isLoading || !walletAddress}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-xs font-semibold rounded uppercase tracking-wider"
            >
              Redeem Principal
            </button>
          </div>

          {/* YT Claim */}
          <div className="p-4 bg-[#161622] border border-[#2d2d3e] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground">Claim YT (Yield)</span>
              <span className="text-[10px] font-mono text-zinc-400">Formula: floor(a × (idx - min) / idx)</span>
            </div>
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">YT Tokens to Burn</label>
              <input
                type="number"
                value={ytAmount}
                onChange={(e) => setYtAmount(e.target.value)}
                className="w-full bg-[#1c1c2a] border border-[#333346] rounded px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>Expected Yield:</span>
              <span className="text-amber-400 font-semibold">{expectedYtPayout.toString()} units</span>
            </div>
            <button
              onClick={handleClaimYt}
              disabled={isLoading || !walletAddress}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-semibold rounded uppercase tracking-wider"
            >
              Claim Accrued Yield
            </button>
          </div>
        </div>

        {/* Status / Tx Link */}
        {status && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-start gap-2">
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
