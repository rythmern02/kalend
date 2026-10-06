'use client'

import React, { useState } from 'react'
import { Shield, AlertTriangle, RefreshCw, Settings, CheckCircle2 } from 'lucide-react'

export interface ModeBarState {
  isPrivacyMode: boolean
  isFallbackActive: boolean
  refuseFallback: boolean
  setRefuseFallback: (val: boolean) => void
  togglePrivacyMode: () => void
  retryPrivacy: () => void
}

export function useModeBarState(): ModeBarState {
  const [isPrivacyMode, setIsPrivacyMode] = useState(true)
  const [isFallbackActive, setIsFallbackActive] = useState(false)
  const [refuseFallback, setRefuseFallback] = useState(true)

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev)
    setIsFallbackActive(false)
  }

  const retryPrivacy = () => {
    setIsFallbackActive(false)
    setIsPrivacyMode(true)
  }

  return {
    isPrivacyMode,
    isFallbackActive,
    refuseFallback,
    setRefuseFallback,
    togglePrivacyMode,
    retryPrivacy,
  }
}

export function ModeBar({
  state,
}: {
  state: ModeBarState
}) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="w-full border-b border-[#222222] bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
        {/* Left: Mode Status */}
        <div className="flex items-center gap-3">
          {state.isPrivacyMode && !state.isFallbackActive ? (
            <div className="flex items-center gap-2 text-[#4ade80] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium text-white">Privacy mode: On</span>
              <span className="text-[#a8a8a8] hidden sm:inline">
                (HPKE sealed client-side · TEE enclave execution)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#fbbf24] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-medium text-white">Plain fallback: amounts visible</span>
              <span className="text-[#a8a8a8] hidden sm:inline">
                (Standard on-chain escrow · public amounts on Solana)
              </span>
            </div>
          )}
        </div>

        {/* Right: Settings and Toggles */}
        <div className="flex items-center gap-3 font-mono">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 text-[#a8a8a8] hover:text-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Policy</span>
          </button>

          <button
            onClick={state.togglePrivacyMode}
            className="px-2 py-0.5 rounded-[2px] border border-[#333333] hover:border-white text-white text-[11px] transition-colors"
          >
            {state.isPrivacyMode ? 'Switch to Plain Mode' : 'Enable Privacy Mode'}
          </button>
        </div>
      </div>

      {/* Fallback Warning Banner if triggered */}
      {state.isFallbackActive && (
        <div className="bg-[#1f1505] border-t border-b border-[#4d360d] px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#fbbf24]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Warning:</strong> Confidential proof generation unavailable. Transaction amounts will be visible on the public Solana ledger.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={state.retryPrivacy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#332205] border border-[#66440a] text-[#fbbf24] hover:bg-[#4d3308] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry privacy
              </button>
              {!state.refuseFallback && (
                <button
                  onClick={() => {}}
                  className="px-2.5 py-1 rounded-[2px] bg-[#222222] text-white hover:bg-[#333333] transition-colors"
                >
                  Continue in plain mode
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Institutional Policy Settings Drawer */}
      {showSettings && (
        <div className="bg-[#0a0a0a] border-t border-[#222222] p-4 text-xs font-mono">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-white font-medium block">
                Strict Institutional Privacy Policy
              </span>
              <span className="text-[#a8a8a8] block">
                Refuse transactions if confidential enclave proof generation fails. Never settle in plain text.
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.refuseFallback}
                onChange={(e) => state.setRefuseFallback(e.target.checked)}
                className="rounded bg-[#1a1a1a] border-[#333333] text-[#4ade80] focus:ring-0"
              />
              <span className="text-white">Refuse Fallback</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
