'use client'

import React from 'react'
import { CheckCircle2, Lock, AlertTriangle, Clock, XCircle } from 'lucide-react'

export type StatusType =
  | 'open'
  | 'settled'
  | 'paused'
  | 'sealed'
  | 'executed'
  | 'matching'
  | 'failed'

interface StatusChipProps {
  status: StatusType | string
}

export function StatusChip({ status }: StatusChipProps) {
  const normalized = status.toLowerCase()

  switch (normalized) {
    case 'open':
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80] text-xs font-mono">
          <CheckCircle2 className="w-3 h-3" />
          <span>Open</span>
        </span>
      )

    case 'sealed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80] text-xs font-mono">
          <Lock className="w-3 h-3" />
          <span>Sealed</span>
        </span>
      )

    case 'settled':
    case 'executed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1a1a1a] border border-[#333333] text-[#a8a8a8] text-xs font-mono">
          <CheckCircle2 className="w-3 h-3 text-[#737373]" />
          <span>{normalized === 'executed' ? 'Executed' : 'Settled'}</span>
        </span>
      )

    case 'matching':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f1505] border border-[#4d360d] text-[#fbbf24] text-xs font-mono">
          <Clock className="w-3 h-3 animate-spin" />
          <span>Matching</span>
        </span>
      )

    case 'paused':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#1f1505] border border-[#4d360d] text-[#fbbf24] text-xs font-mono">
          <AlertTriangle className="w-3 h-3" />
          <span>Paused</span>
        </span>
      )

    case 'failed':
    case 'disputed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#240e0e] border border-[#4d1c1c] text-[#f87171] text-xs font-mono">
          <XCircle className="w-3 h-3" />
          <span>{normalized === 'failed' ? 'Failed' : 'Disputed'}</span>
        </span>
      )

    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#141414] border border-[#2b2b2b] text-[#a8a8a8] text-xs font-mono">
          <span>{status}</span>
        </span>
      )
  }
}
