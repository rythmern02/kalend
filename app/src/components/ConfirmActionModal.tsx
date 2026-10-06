'use client'

import React from 'react'
import { AlertCircle, Globe, Check, ExternalLink, X } from 'lucide-react'

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  actionName: string // e.g. "Lock 2,000,000 USDC to quote"
  whatWillHappen: string
  whatItCosts: string
  whatBecomesPublic: string
  isSubmitting?: boolean
  txReceiptUrl?: string
  error?: string | null
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionName,
  whatWillHappen,
  whatItCosts,
  whatBecomesPublic,
  isSubmitting = false,
  txReceiptUrl,
  error,
}: ConfirmActionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border border-[#333333] rounded-[4px] max-w-lg w-full p-6 text-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a8a8a8] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {txReceiptUrl ? (
          <div>
            <div className="w-10 h-10 rounded-full bg-[#0c1f13] border border-[#1b4329] flex items-center justify-center mb-4 text-[#4ade80]">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl text-white mb-2">Transaction Confirmed</h3>
            <p className="text-[#a8a8a8] mb-5">
              Your transaction was processed successfully and settled on Solana.
            </p>
            <a
              href={txReceiptUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[2px] bg-[#1a1a1a] border border-[#333333] hover:border-white text-white font-mono text-xs mb-4"
            >
              <span>View Explorer Receipt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="w-full py-2 bg-white text-black font-medium rounded-[2px] hover:bg-[#e6e6e6] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <h3 className="font-serif text-xl text-white mb-4">Confirm Action</h3>

            <div className="space-y-4 mb-6">
              <div className="p-3 bg-[#121212] border border-[#222222] rounded-[2px]">
                <span className="text-xs font-mono text-[#a8a8a8] uppercase block mb-1">
                  1. What will happen
                </span>
                <p className="text-white text-xs leading-relaxed">{whatWillHappen}</p>
              </div>

              <div className="p-3 bg-[#121212] border border-[#222222] rounded-[2px]">
                <span className="text-xs font-mono text-[#a8a8a8] uppercase block mb-1">
                  2. What it costs
                </span>
                <p className="text-white text-xs font-mono">{whatItCosts}</p>
              </div>

              <div className="p-3 bg-[#171408] border border-[#3d2e10] rounded-[2px]">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#fbbf24] uppercase mb-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>3. What becomes public on Solana</span>
                </div>
                <p className="text-[#f5f5f5] text-xs leading-relaxed">{whatBecomesPublic}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#240c0c] border border-[#5c1d1d] text-[#f87171] text-xs font-mono rounded-[2px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="break-all">{error}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-[2px] border border-[#333333] text-[#a8a8a8] hover:text-white hover:border-[#555] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-[2px] bg-white text-black font-medium hover:bg-[#e6e6e6] transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{actionName}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
