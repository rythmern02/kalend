'use client'

import React from 'react'
import { Lock, Eye, ShieldCheck, Globe, HelpCircle } from 'lucide-react'
import { VisibilityItem } from '../lib/types'

interface VisibilityPanelProps {
  items: VisibilityItem[]
  title?: string
  subtitle?: string
}

export function VisibilityPanel({
  items,
  title = 'Who can see this',
  subtitle = 'Cryptographic boundary audit per RFQ transaction',
}: VisibilityPanelProps) {
  return (
    <div className="bg-[#0a0a0a] border border-[#333333] rounded-[4px] p-5 text-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#222222]">
        <div>
          <h3 className="font-serif text-lg text-white font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
            {title}
          </h3>
          <p className="text-xs text-[#a8a8a8] mt-0.5">{subtitle}</p>
        </div>
        <div className="text-[11px] font-mono text-[#a8a8a8] uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded-[2px] border border-[#262626]">
          Zero Plaintext
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between py-2 border-b border-[#181818] last:border-b-0 gap-4"
          >
            <div className="min-w-0">
              <span className="text-xs font-mono text-[#a8a8a8] block uppercase">
                {item.label}
              </span>
              <span className="font-mono text-xs text-white truncate block max-w-[180px]">
                {item.value || '—'}
              </span>
              {item.description && (
                <span className="text-[11px] text-[#737373] block mt-0.5">
                  {item.description}
                </span>
              )}
            </div>

            <div className="shrink-0 flex items-center">
              {item.visibility === 'sealed' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80] text-xs font-mono">
                  <Lock className="w-3 h-3" />
                  <span>Sealed</span>
                </div>
              )}

              {item.visibility === 'enclave_only' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#1a1408] border border-[#4d3810] text-[#fbbf24] text-xs font-mono">
                  <Eye className="w-3 h-3" />
                  <span>In Enclave only</span>
                </div>
              )}

              {item.visibility === 'public_solana' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[#161616] border border-[#333333] text-[#d4d4d4] text-xs font-mono">
                  <Globe className="w-3 h-3" />
                  <span>Public on Solana</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-[#222222] bg-[#0d0d0d] -mx-5 -mb-5 p-4 rounded-b-[4px]">
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#a8a8a8]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#333333]" />
            <span>Public chain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
            <span>Relay (Ciphertext)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span>CRE workflow</span>
          </div>
        </div>
      </div>
    </div>
  )
}
