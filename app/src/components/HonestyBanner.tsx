'use client'

import React from 'react'
import { ShieldCheck, Info, Cpu, Network } from 'lucide-react'

export function HonestyBanner() {
  return (
    <div className="bg-[#101014] border-b border-[#24242e] px-4 py-2.5 text-xs text-muted">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-foreground font-medium">Cluster:</span>
          <span className="text-muted font-mono">Solana Devnet</span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-foreground font-medium">CRE Forwarder:</span>
          <span className="text-emerald-400 font-mono">Keystone Active</span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-foreground font-medium">Privacy:</span>
          <span className="text-amber-400 font-mono">TEE Enclave (AWS Nitro us-west-2 / HPKE)</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-black/40 px-2.5 py-1 rounded border border-zinc-800">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-foreground">Honest Disclosure:</strong> Sealed orders use HPKE (RFC 9180);
            yield is computed from real attested Jito stake pool index data.
          </span>
        </div>
      </div>
    </div>
  )
}
