'use client'

import React from 'react'
import { ShieldCheck, Lock, Cpu, EyeOff, Terminal, CheckCircle2 } from 'lucide-react'
import {
  PROGRAM_ID,
  CONFIG_PDA,
  REGISTRY_PDA,
  KEYSTONE_FORWARDER_PROGRAM,
  KEYSTONE_FORWARDER_STATE,
  ENCLAVE_PUBLIC_KEY,
  ENCLAVE_KEY_HASH,
  CURRENT_KID,
} from '../lib/constants'

export function TransparencyTab() {
  const invariants = [
    { id: 'INV1', name: 'Conservation of Funds', desc: 'Vault raw collateral ≥ outstanding PT supply before settlement. PT redemptions + YT claims ≤ vault balance at settlement.' },
    { id: 'INV2', name: 'Strip & Merge Symmetry', desc: 'pt_supply == yt_supply strictly before settlement; merging burns 1:1 without value destruction.' },
    { id: 'INV3', name: 'Non-Extractive Admin', desc: 'Zero instruction exists allowing admin or authority to move, withdraw, or drain user collateral, escrows, or vault balances.' },
    { id: 'INV4', name: 'Replay Protection', desc: 'Each round_id is accepted at most once via init on FillReceipt PDA; settlement state transitions strictly once.' },
    { id: 'INV5', name: 'Clock Validation', desc: 'Clock checks are on-chain via Solana Clock sysvar; maturity cannot be accelerated by any offchain or oracle report.' },
    { id: 'INV6', name: 'Time-Locked Escrow', desc: 'Withdrawals are impossible before lock_until, preventing malicious front-running of matching fills.' },
    { id: 'INV7', name: 'Zero Plaintext Exposure', desc: 'Quotes and requests are sealed client-side via HPKE (RFC 9180); relay and CRE DON nodes observe only ciphertexts.' },
  ]

  const trustActors = [
    {
      actor: 'Relay Operator',
      can: 'Delay or drop rounds; observe ciphertext sizes and timing metadata.',
      cannot: 'Read plaintext orders, forge fills, or move user funds.',
    },
    {
      actor: 'Workflow DON Nodes',
      can: 'Observe trigger payload ciphertexts and consensus sign the fill report.',
      cannot: 'Inspect plaintext quotes or secret keys inside the attested TEE.',
    },
    {
      actor: 'Kalend Core Team',
      can: 'Deploys code and publishes enclave public keys.',
      cannot: 'Withdraw collateral or escrow balances (fail closed; no admin drain paths).',
    },
    {
      actor: 'Oracle / Forwarder',
      can: 'Deliver attested maturity rates verified by threshold signatures.',
      cannot: 'Mature a series before the on-chain Clock timestamp.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cryptographic Key Disclosure */}
      <div className="bg-[#121218] border border-[#24242e] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          Enclave Cryptographic Keys (Published for Verification)
        </h2>
        <p className="text-xs text-muted">
          Per Prime Directive 2 and Section 8.2 of the Kalend specification, the TEE public key and its SHA-256
          hash are transparently published in the Solana `Config` PDA and UI for deterministic independent verification.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-black/40 border border-zinc-800 rounded-lg">
            <div className="text-zinc-500 mb-1">Key Identifier (kid)</div>
            <div className="text-amber-400 font-semibold">{CURRENT_KID}</div>
          </div>
          <div className="p-3 bg-black/40 border border-zinc-800 rounded-lg">
            <div className="text-zinc-500 mb-1">HPKE Cipher Suite</div>
            <div className="text-foreground">X25519-HKDF-SHA256 + ChaCha20Poly1305</div>
          </div>
          <div className="p-3 bg-black/40 border border-zinc-800 rounded-lg md:col-span-2">
            <div className="text-zinc-500 mb-1">Enclave Public Key (X25519)</div>
            <div className="text-zinc-300 break-all">{ENCLAVE_PUBLIC_KEY}</div>
          </div>
          <div className="p-3 bg-black/40 border border-zinc-800 rounded-lg md:col-span-2">
            <div className="text-zinc-500 mb-1">Config Enclave Key Hash (On-Chain)</div>
            <div className="text-zinc-300 break-all">{ENCLAVE_KEY_HASH}</div>
          </div>
        </div>
      </div>

      {/* Trust & Threat Model */}
      <div className="bg-[#121218] border border-[#24242e] rounded-xl p-6 space-y-4">
        <h3 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-blue-400" />
          Formal Threat & Trust Model
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 pr-4 font-medium">Actor</th>
                <th className="py-2 pr-4 font-medium text-amber-400/80">Can</th>
                <th className="py-2 font-medium text-emerald-400/80">Cannot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {trustActors.map((a, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-semibold text-foreground">{a.actor}</td>
                  <td className="py-3 pr-4 text-zinc-400">{a.can}</td>
                  <td className="py-3 text-zinc-300 font-medium">{a.cannot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified On-Chain Invariants */}
      <div className="bg-[#121218] border border-[#24242e] rounded-xl p-6 space-y-4">
        <h3 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Verified Invariants (INV1 - INV7)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {invariants.map((inv) => (
            <div key={inv.id} className="p-3 bg-[#161622] border border-[#282838] rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs font-semibold text-emerald-300">{inv.id}:</span>
                <span className="font-mono text-xs text-foreground font-medium">{inv.name}</span>
              </div>
              <p className="text-[11px] text-zinc-400 pl-5.5 leading-relaxed">{inv.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* On-Chain Addresses */}
      <div className="bg-[#121218] border border-[#24242e] rounded-xl p-6 space-y-3 font-mono text-xs">
        <h3 className="text-sm font-serif font-semibold text-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          Live Deployed Addresses (Solana Devnet)
        </h3>
        <div className="space-y-2 text-zinc-400">
          <div className="flex justify-between py-1 border-b border-zinc-800">
            <span>Program ID:</span>
            <span className="text-foreground">{PROGRAM_ID.toBase58()}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-800">
            <span>Config PDA:</span>
            <span className="text-foreground">{CONFIG_PDA.toBase58()}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-800">
            <span>Keystone Forwarder Program:</span>
            <span className="text-foreground">{KEYSTONE_FORWARDER_PROGRAM.toBase58()}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-800">
            <span>Keystone Forwarder State:</span>
            <span className="text-foreground">{KEYSTONE_FORWARDER_STATE.toBase58()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
