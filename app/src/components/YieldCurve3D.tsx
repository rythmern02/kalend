'use client'

import React, { useState } from 'react'
import { TrendingUp, ShieldCheck, Zap } from 'lucide-react'

interface TermNode {
  term: string
  days: number
  apr: number
  ptPrice: number
  ytYield: number
  label: string
}

const TERM_STRUCTURE: TermNode[] = [
  { term: '1M', days: 30, apr: 4.78, ptPrice: 0.9961, ytYield: 0.39, label: '30-Day Liquidity' },
  { term: '3M', days: 90, apr: 4.85, ptPrice: 0.9882, ytYield: 1.19, label: 'Quarterly Benchmark' },
  { term: '6M', days: 180, apr: 4.92, ptPrice: 0.9763, ytYield: 2.43, label: 'Semi-Annual Lock' },
  { term: '1Y', days: 365, apr: 4.98, ptPrice: 0.9526, ytYield: 4.98, label: 'Annual Treasury/LST' },
]

export function YieldCurve3D({ solPrice }: { solPrice?: number }) {
  const [selectedTerm, setSelectedTerm] = useState<TermNode>(TERM_STRUCTURE[1])
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)

  return (
    <div className="relative rounded-[4px] bg-[#080808]/90 border border-[#222222] p-6 backdrop-blur-md overflow-hidden">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 cyber-grid-texture opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <h3 className="font-serif text-lg font-medium text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#4ade80]" />
              3D Reference Term Structure & Yield Curve
            </h3>
          </div>
          <p className="text-xs text-[#888888] font-mono">
            Interactive institutional discount curve across dated maturities (PT implied clearing vs YT coupon)
          </p>
        </div>

        {solPrice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#141414] border border-[#262626] text-xs font-mono">
            <span className="text-[#888888]">Pyth SOL:</span>
            <span className="text-white font-medium">${solPrice.toFixed(2)}</span>
            <span className="text-[10px] text-[#4ade80] ml-1">Live</span>
          </div>
        )}
      </div>

      {/* Interactive 3D Term Structure Visualizer */}
      <div className="relative z-10 my-4 p-4 rounded-[4px] bg-[#0c0c0c] border border-[#1a1a1a]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TERM_STRUCTURE.map((item) => {
            const isSelected = selectedTerm.term === item.term
            const isHovered = hoveredTerm === item.term

            return (
              <button
                key={item.term}
                onClick={() => setSelectedTerm(item)}
                onMouseEnter={() => setHoveredTerm(item.term)}
                onMouseLeave={() => setHoveredTerm(null)}
                className={`relative text-left p-3.5 rounded-[3px] border transition-all duration-200 transform-style-3d ${
                  isSelected
                    ? 'bg-[#141414] border-white shadow-[0_0_20px_rgba(255,255,255,0.08)] scale-[1.02]'
                    : isHovered
                    ? 'bg-[#111111] border-[#444444] scale-[1.01]'
                    : 'bg-[#0a0a0a] border-[#1f1f1f]'
                }`}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4ade80] via-[#06b6d4] to-white" />
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#a3a3a3] font-semibold">
                    {item.term} ({item.days}d)
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? 'text-[#4ade80]' : 'text-white'
                    }`}
                  >
                    {item.apr.toFixed(2)}%
                  </span>
                </div>

                <div className="font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-[#737373]">
                    <span>PT Price:</span>
                    <span className="text-white font-medium">${item.ptPrice.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-[#737373]">
                    <span>YT Yield:</span>
                    <span className="text-[#06b6d4] font-medium">+{item.ytYield.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-[#666666] truncate font-sans">
                  {item.label}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Term Detail Card */}
        <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#171717] border border-[#2b2b2b] flex items-center justify-center text-[#4ade80]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-medium block">
                {selectedTerm.term} Dated Series ({selectedTerm.days} Days to Maturity)
              </span>
              <span className="text-[#888888] text-[11px]">
                Underlying: 1.0 SOL ➔ 1.0 PT (${selectedTerm.ptPrice.toFixed(4)}) + 1.0 YT (+{selectedTerm.ytYield.toFixed(2)}% return)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#737373] text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Enclave-Verified Sanity Bounds (Prime Directive 2)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
