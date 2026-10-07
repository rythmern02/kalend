'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { SOLANA_RPC_URL } from './constants'
import { ed25519 } from '@noble/curves/ed25519.js'

export type WalletProviderType = 'solflare' | 'phantom' | 'backpack' | 'injected' | 'devnet_keypair'

export interface WalletContextValue {
  walletAddress: string | null
  publicKey: PublicKey | null
  connected: boolean
  isConnecting: boolean
  walletName: string | null
  connect: () => Promise<void>
  connectWithProvider: (type: WalletProviderType) => Promise<void>
  disconnect: () => void
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
  sendTransaction: (tx: Transaction, customConnection?: Connection) => Promise<string>
  showConnectModal: boolean
  setShowConnectModal: (show: boolean) => void
  useDevnetTestWallet: (privateKeyJsonOrBase58?: string) => boolean
  connection: Connection
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return ctx
}

function getProvider(type: WalletProviderType): any {
  if (typeof window === 'undefined') return null

  if (type === 'solflare') {
    return (window as any).solflare || ((window as any).solana?.isSolflare ? (window as any).solana : null)
  }
  if (type === 'phantom') {
    return (window as any).phantom?.solana || ((window as any).solana?.isPhantom ? (window as any).solana : null)
  }
  if (type === 'backpack') {
    return (window as any).backpack || ((window as any).solana?.isBackpack ? (window as any).solana : null)
  }
  return (window as any).solana
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connection] = useState(() => new Connection(SOLANA_RPC_URL, 'confirmed'))
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [walletName, setWalletName] = useState<string | null>(null)
  const [activeProviderType, setActiveProviderType] = useState<WalletProviderType | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [testKeypair, setTestKeypair] = useState<Keypair | null>(null)

  // Load saved session on mount
  useEffect(() => {
    try {
      const savedType = localStorage.getItem('kalend_wallet_type') as WalletProviderType | null
      const savedKey = localStorage.getItem('kalend_test_secret')

      if (savedType === 'solflare') {
        const solflare = getProvider('solflare')
        if (solflare) {
          solflare.connect({ onlyIfTrusted: true })
            .then(() => {
              if (solflare.publicKey) {
                setPublicKey(solflare.publicKey)
                setWalletName('Solflare')
                setActiveProviderType('solflare')
              }
            })
            .catch(() => {})
        }
      } else if (savedType === 'phantom') {
        const phantom = getProvider('phantom')
        if (phantom) {
          phantom.connect({ onlyIfTrusted: true })
            .then((res: any) => {
              const pk = res?.publicKey || phantom.publicKey
              if (pk) {
                setPublicKey(pk)
                setWalletName('Phantom')
                setActiveProviderType('phantom')
              }
            })
            .catch(() => {})
        }
      } else if (savedType === 'backpack') {
        const bp = getProvider('backpack')
        if (bp) {
          bp.connect({ onlyIfTrusted: true })
            .then((res: any) => {
              const pk = res?.publicKey || bp.publicKey
              if (pk) {
                setPublicKey(pk)
                setWalletName('Backpack')
                setActiveProviderType('backpack')
              }
            })
            .catch(() => {})
        }
      } else if (savedType === 'injected' && (window as any).solana) {
        const sol = (window as any).solana
        sol.connect({ onlyIfTrusted: true })
          .then((res: any) => {
            const pk = res?.publicKey || sol.publicKey
            if (pk) {
              setPublicKey(pk)
              setWalletName(sol.isSolflare ? 'Solflare' : sol.isPhantom ? 'Phantom' : 'Solana Wallet')
              setActiveProviderType('injected')
            }
          })
          .catch(() => {})
      } else if (savedType === 'devnet_keypair' && savedKey) {
        try {
          const secret = new Uint8Array(JSON.parse(savedKey))
          const kp = Keypair.fromSecretKey(secret)
          setTestKeypair(kp)
          setPublicKey(kp.publicKey)
          setWalletName('Devnet Local Wallet')
          setActiveProviderType('devnet_keypair')
        } catch (e) {
          console.warn('Failed to restore devnet keypair from storage:', e)
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const connectWithProvider = useCallback(async (type: WalletProviderType) => {
    setIsConnecting(true)
    try {
      const provider = getProvider(type)
      if (!provider) {
        if (type === 'solflare') {
          throw new Error('Solflare extension not found. Please install Solflare from https://solflare.com')
        }
        if (type === 'phantom') {
          throw new Error('Phantom extension not found. Please install Phantom from https://phantom.app')
        }
        if (type === 'backpack') {
          throw new Error('Backpack extension not found. Please install Backpack from https://backpack.app')
        }
        throw new Error('No Solana browser extension detected.')
      }

      const res = await provider.connect()
      const pk = res?.publicKey || provider.publicKey
      if (!pk) {
        throw new Error('Failed to retrieve public key from wallet.')
      }

      setPublicKey(pk)
      setTestKeypair(null)
      setActiveProviderType(type)
      const name = type === 'solflare' ? 'Solflare' : type === 'phantom' ? 'Phantom' : type === 'backpack' ? 'Backpack' : 'Solana Wallet'
      setWalletName(name)
      localStorage.setItem('kalend_wallet_type', type)
      localStorage.removeItem('kalend_test_secret')
      setShowConnectModal(false)
    } catch (err: any) {
      console.error(`Failed to connect with ${type}:`, err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const connect = useCallback(async () => {
    // Open selector modal so user can pick between Solflare, Phantom, Backpack, or Devnet
    setShowConnectModal(true)
  }, [])

  const disconnect = useCallback(() => {
    if (activeProviderType && activeProviderType !== 'devnet_keypair') {
      const provider = getProvider(activeProviderType)
      if (provider?.disconnect) {
        try {
          provider.disconnect()
        } catch {}
      }
    }
    setPublicKey(null)
    setTestKeypair(null)
    setWalletName(null)
    setActiveProviderType(null)
    try {
      localStorage.removeItem('kalend_wallet_type')
      localStorage.removeItem('kalend_test_secret')
    } catch {}
  }, [activeProviderType])

  const useDevnetTestWallet = useCallback((privateKeyJsonOrBase58?: string): boolean => {
    try {
      let kp: Keypair
      if (privateKeyJsonOrBase58) {
        let raw: Uint8Array
        if (privateKeyJsonOrBase58.startsWith('[')) {
          raw = new Uint8Array(JSON.parse(privateKeyJsonOrBase58))
        } else {
          raw = new Uint8Array(JSON.parse(privateKeyJsonOrBase58))
        }
        kp = Keypair.fromSecretKey(raw)
      } else {
        kp = Keypair.generate()
      }
      setTestKeypair(kp)
      setPublicKey(kp.publicKey)
      setWalletName('Devnet Test Wallet')
      setActiveProviderType('devnet_keypair')
      localStorage.setItem('kalend_wallet_type', 'devnet_keypair')
      localStorage.setItem('kalend_test_secret', JSON.stringify(Array.from(kp.secretKey)))
      setShowConnectModal(false)
      return true
    } catch (err) {
      console.error('Failed to initialize test keypair:', err)
      return false
    }
  }, [])

  const getActiveProviderInstance = useCallback(() => {
    if (activeProviderType) {
      const p = getProvider(activeProviderType)
      if (p) return p
    }
    // Fallback search: solflare first, then window.solana
    if (typeof window !== 'undefined') {
      return (window as any).solflare || (window as any).solana
    }
    return null
  }, [activeProviderType])

  const signTransaction = useCallback(
    async (tx: Transaction): Promise<Transaction> => {
      if (testKeypair) {
        tx.partialSign(testKeypair)
        return tx
      }
      const provider = getActiveProviderInstance()
      if (provider?.signTransaction) {
        return provider.signTransaction(tx)
      }
      throw new Error('No wallet connected to sign transaction')
    },
    [testKeypair, getActiveProviderInstance]
  )

  const signAllTransactions = useCallback(
    async (txs: Transaction[]): Promise<Transaction[]> => {
      if (testKeypair) {
        txs.forEach((tx) => tx.partialSign(testKeypair))
        return txs
      }
      const provider = getActiveProviderInstance()
      if (provider?.signAllTransactions) {
        return provider.signAllTransactions(txs)
      }
      throw new Error('No wallet connected to sign transactions')
    },
    [testKeypair, getActiveProviderInstance]
  )

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      if (testKeypair) {
        return ed25519.sign(message, testKeypair.secretKey.subarray(0, 32))
      }
      const provider = getActiveProviderInstance()
      if (provider?.signMessage) {
        try {
          // Solflare supports signMessage(Uint8Array, 'utf8') or signMessage(Uint8Array)
          const res = await provider.signMessage(message, 'utf8').catch(() => provider.signMessage(message))
          if (res?.signature) return new Uint8Array(res.signature)
          return new Uint8Array(res)
        } catch (e: any) {
          throw new Error(`Wallet signMessage rejected: ${e.message || e}`)
        }
      }
      throw new Error('No wallet connected to sign message')
    },
    [testKeypair, getActiveProviderInstance]
  )

  const sendTransaction = useCallback(
    async (tx: Transaction, customConnection?: Connection): Promise<string> => {
      const conn = customConnection || connection
      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed')
      tx.recentBlockhash = blockhash
      tx.lastValidBlockHeight = lastValidBlockHeight

      if (publicKey && !tx.feePayer) {
        tx.feePayer = publicKey
      }

      if (testKeypair) {
        tx.partialSign(testKeypair)
        const rawTx = tx.serialize()
        const txSig = await conn.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        await conn.confirmTransaction(
          { signature: txSig, blockhash, lastValidBlockHeight },
          'confirmed'
        )
        return txSig
      }

      const provider = getActiveProviderInstance()
      if (provider?.signTransaction) {
        const signedTx = await provider.signTransaction(tx)
        const rawTx = signedTx.serialize()
        const txSig = await conn.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        await conn.confirmTransaction(
          { signature: txSig, blockhash, lastValidBlockHeight },
          'confirmed'
        )
        return txSig
      }

      throw new Error('No wallet connected')
    },
    [connection, publicKey, testKeypair, getActiveProviderInstance]
  )

  const value: WalletContextValue = {
    walletAddress: publicKey ? publicKey.toBase58() : null,
    publicKey,
    connected: !!publicKey,
    isConnecting,
    walletName,
    connect,
    connectWithProvider,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    sendTransaction,
    showConnectModal,
    setShowConnectModal,
    useDevnetTestWallet,
    connection,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
      {showConnectModal && (
        <ConnectWalletModal
          onClose={() => setShowConnectModal(false)}
          onConnectProvider={connectWithProvider}
          onConnectDevnet={useDevnetTestWallet}
        />
      )}
    </WalletContext.Provider>
  )
}

function ConnectWalletModal({
  onClose,
  onConnectProvider,
  onConnectDevnet,
}: {
  onClose: () => void
  onConnectProvider: (type: WalletProviderType) => Promise<void>
  onConnectDevnet: (key?: string) => boolean
}) {
  const [customKey, setCustomKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSolflareAvailable = typeof window !== 'undefined' && Boolean((window as any).solflare || (window as any).solana?.isSolflare)
  const isPhantomAvailable = typeof window !== 'undefined' && Boolean((window as any).phantom?.solana || (window as any).solana?.isPhantom)
  const isBackpackAvailable = typeof window !== 'undefined' && Boolean((window as any).backpack)

  const handleProviderClick = async (type: WalletProviderType) => {
    setError(null)
    setIsSubmitting(true)
    try {
      await onConnectProvider(type)
    } catch (err: any) {
      setError(err.message || `Failed to connect to ${type}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDevnetConnect = () => {
    setError(null)
    const ok = onConnectDevnet(customKey.trim() || undefined)
    if (!ok) {
      setError('Invalid key format. Please enter a valid JSON byte array [1,2,3...] or leave empty for a new burner keypair.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#0c0c0c] border border-[#2b2b2b] rounded-[4px] max-w-md w-full p-6 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div>
            <h3 className="font-serif text-xl font-medium text-white">Select Solana Wallet</h3>
            <p className="text-[11px] font-mono text-[#737373] mt-0.5">Connect to Solana Devnet</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#a8a8a8] hover:text-white font-mono text-sm p-1 rounded hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[#1e0d0d] border border-[#521c1c] text-xs font-mono text-[#f87171] leading-relaxed rounded-[2px]">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          {/* Solflare Option - Highlighted */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleProviderClick('solflare')}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-[#121008] hover:bg-[#1c180a] border border-[#4d3810] hover:border-[#fbbf24] rounded-[2px] transition-all text-left group shadow-[0_0_15px_-3px_rgba(251,191,36,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#fbbf24] flex items-center justify-center text-black font-bold text-xs shadow-sm">
                ☀️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-white group-hover:text-[#fbbf24] transition-colors">
                    Solflare Wallet
                  </span>
                  {isSolflareAvailable ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80]">
                      Detected
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#1f190b] border border-[#4d3810] text-[#fbbf24]">
                      Extension
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-[#737373] block mt-0.5">
                  Institutional & hardware-compatible Solana wallet
                </span>
              </div>
            </div>
            <span className="text-white group-hover:translate-x-0.5 transition-transform font-mono text-xs">
              →
            </span>
          </button>

          {/* Phantom Option */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleProviderClick('phantom')}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] hover:bg-[#181818] border border-[#2b2b2b] hover:border-[#404040] rounded-[2px] transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#ab9ff2] flex items-center justify-center text-black font-bold text-xs">
                👻
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-white">
                    Phantom Wallet
                  </span>
                  {isPhantomAvailable && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80]">
                      Detected
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-[#737373] block mt-0.5">
                  Standard browser extension
                </span>
              </div>
            </div>
            <span className="text-[#a8a8a8] group-hover:text-white font-mono text-xs">
              →
            </span>
          </button>

          {/* Backpack Option */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleProviderClick('backpack')}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] hover:bg-[#181818] border border-[#2b2b2b] hover:border-[#404040] rounded-[2px] transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[2px] bg-[#e54040] flex items-center justify-center text-white font-bold text-xs">
                🎒
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-white">
                    Backpack Wallet
                  </span>
                  {isBackpackAvailable && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#0c1f13] border border-[#1b4329] text-[#4ade80]">
                      Detected
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-[#737373] block mt-0.5">
                  xNFT & regulated securities terminal
                </span>
              </div>
            </div>
            <span className="text-[#a8a8a8] group-hover:text-white font-mono text-xs">
              →
            </span>
          </button>

          {/* Devnet Burner Keypair (Instant Fallback) */}
          <div className="pt-4 border-t border-[#222222] mt-4">
            <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-1.5 font-semibold">
              Devnet Quick Test (Zero Extension Required)
            </span>
            <p className="text-[11px] text-[#737373] mb-3 leading-relaxed">
              Generate a local burner keypair or paste an existing secret key array to sign and submit real on-chain transactions directly on Devnet.
            </p>

            <input
              type="text"
              placeholder="Optional: Paste secret key JSON array [1,2,3...]"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="w-full bg-[#121212] border border-[#2b2b2b] px-3 py-2 text-xs font-mono text-white placeholder-[#555] mb-3 focus:outline-none focus:border-white rounded-[2px]"
            />

            <button
              onClick={handleDevnetConnect}
              className="w-full py-2.5 bg-white text-black font-mono text-xs font-semibold rounded-[2px] hover:bg-[#e5e5e5] transition-colors"
            >
              {customKey.trim() ? 'Import Devnet Keypair' : 'Generate Devnet Burner Keypair'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
