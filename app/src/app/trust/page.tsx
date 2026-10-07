'use client'

import React, { useState } from 'react'
import { Header } from '../../components/Header'
import { ModeBar, useModeBarState } from '../../components/ModeBar'
import { DataSourceTag } from '../../components/DataSourceTag'
import { StatusChip } from '../../components/StatusChip'
import {
  ShieldCheck,
  Lock,
  ExternalLink,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Key,
  Layers,
  FileText,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '../../lib/api'
import {
  PROGRAM_ID,
  CONFIG_PDA,
  REGISTRY_PDA,
  RENT_VAULT_PDA,
  KEYSTONE_FORWARDER_PROGRAM,
  ENCLAVE_KEY_HASH,
} from '../../lib/constants'

export default function TrustPage() {
  const modeBarState = useModeBarState()
  const [walletAddress] = useState<string>('Pga9oB2E7XqJwaZijcczrL24b7YgXGfR3sXC2ySoLnX')

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
  })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header walletAddress={walletAddress} connectWallet={() => {}} />
      <ModeBar state={modeBarState} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
            Prime Directive 2 · Radical Transparency
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-3">
            Trust & Verification
          </h1>
          <p className="text-sm text-[#a8a8a8] max-w-2xl leading-relaxed">
            What each party can and cannot see or do, stated plainly. Where something is simulated or trusted, it says so.
          </p>
        </div>

        {/* Live On-Chain Config PDA Audit */}
        <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222] mb-12">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1f1f1f]">
            <div>
              <h2 className="font-serif text-xl text-white font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                Live On-Chain Config PDA State
              </h2>
              <span className="font-mono text-xs text-[#a8a8a8]">
                {CONFIG_PDA.toBase58()}
              </span>
            </div>
            <DataSourceTag sourceName="Solana Devnet RPC" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs mb-6">
            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Protocol Authority</span>
              <span className="text-white truncate block">
                {config?.authority ?? 'reading…'}
              </span>
            </div>

            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Emergency Circuit Breaker</span>
              <span className={config?.paused ? 'text-[#fbbf24]' : 'text-[#4ade80]'}>
                {config?.paused ? 'PAUSED' : 'ACTIVE (UNPAUSED)'}
              </span>
            </div>

            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Keystone Forwarder Program</span>
              <span className="text-white truncate block">
                {KEYSTONE_FORWARDER_PROGRAM.toBase58()}
              </span>
            </div>

            <div className="p-3 bg-[#121212] rounded-[2px] border border-[#1e1e1e]">
              <span className="text-[#737373] block mb-1">Published Enclave Key Hash</span>
              <span className="text-white truncate block">
                {ENCLAVE_KEY_HASH}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#0d0d0d] border border-[#242424] rounded-[2px] font-mono text-xs">
            <span className="text-[#a8a8a8] uppercase text-[10px] block mb-1">
              Enclave key rotation
            </span>
            <p className="text-[#a8a8a8] leading-relaxed text-[11px]">
              The browser seals orders to this X25519 public key; its sha256 is committed on-chain in Config.enclave_key_hash and rotated by the authority with set_enclave_key_hash (an EnclaveKeyRotated event, no time lock). Compare the two before sealing. Users cannot yet verify enclave attestation themselves.
            </p>
          </div>
        </div>

        {/* Honest Trust Boundary Disclosures: What is Trusted vs What is Not */}
        <div className="mb-12">
          <h2 className="font-serif text-xl text-white font-medium mb-4">
            Honest Threat Model: What is Trusted vs What is Not
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <div className="flex items-center gap-2 text-[#4ade80] mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="font-serif text-base text-white font-medium">What is Strictly Guaranteed</h3>
              </div>
              <ul className="space-y-3 font-mono text-xs text-[#a8a8a8]">
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  <span><strong>No admin withdrawal (INV7):</strong> no instruction lets the authority move vault or escrow balances; they only go to the owner or counterparty by the program's formulas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  <span><strong>Collateral backing (INV1, INV2):</strong> before settlement the vault holds at least the outstanding PT supply, and PT supply equals YT supply.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  <span><strong>Relay sees ciphertext only:</strong> it learns timing and ciphertext sizes, and can delay or drop a round, but cannot read orders or choose where a fill pays out.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white">•</span>
                  <span><strong>Replay prevention (INV5):</strong> a FillReceipt PDA keyed by round_id can be created once; execute_fill runs once.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-[4px] bg-[#0a0a0a] border border-[#222222]">
              <div className="flex items-center gap-2 text-[#fbbf24] mb-3">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-serif text-base text-white font-medium">Assumptions & Residual Trust</h3>
              </div>
              <ul className="space-y-3 font-mono text-xs text-[#a8a8a8]">
                <li className="flex items-start gap-2">
                  <span className="text-[#fbbf24]">•</span>
                  <span><strong>The team can read orders.</strong> We generated and hold the enclave decryption key. On devnet the RFQ workflow runs in the Chainlink CRE local simulator, which is not a hardware enclave. A deployed confidential workflow (AWS Nitro, pending CRE enrollment) would protect orders from the public, the relay and node operators, not from the team.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#fbbf24]">•</span>
                  <span><strong>Forwarder trust:</strong> deployed reports rely on Chainlink DON signatures checked by the Keystone Forwarder. Simulator runs go through the CRE mock forwarder, which devnet Config also accepts; a mainnet build rejects it at compile time. The program re-checks clocks and index bounds, so a bad report can delay a series but not mature it early.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#fbbf24]">•</span>
                  <span><strong>Escrows are public:</strong> escrowed amounts and fill amounts are visible on Solana. Sealing hides limits, losing quotes and who bid, not the executed trade.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Audit Status */}
        <div className="p-6 rounded-[4px] bg-[#0d0d0d] border border-[#262626] font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif text-base text-white">External Security Audits</span>
            <span className="text-[11px] text-[#fbbf24] px-2 py-0.5 rounded-[2px] bg-[#1a1408] border border-[#4d3810]">
              Phase 5 Milestone
            </span>
          </div>
          <p className="text-[#a8a8a8] leading-relaxed mb-4">
            Security audits by external security firms scheduled ahead of Stage B/C mainnet-beta capped pilots. Full audit reports and formal verification proofs will be published directly to this page.
          </p>
          <div className="flex items-center gap-4 text-[#737373]">
            <span>Kalend Core Anchor: Target v1.0.2</span>
            <span>·</span>
            <span>SPL Transfer Hook: Complete</span>
            <span>·</span>
            <span>CRE Confidential Workflows: Complete</span>
          </div>
        </div>
      </main>
    </div>
  )
}
