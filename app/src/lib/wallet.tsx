'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import { SOLANA_RPC_URL } from './constants'

export interface WalletContextValue {
  walletAddress: string | null
  publicKey: PublicKey | null
  connected: boolean
  isConnecting: boolean
  walletName: string | null
  connect: () => Promise<void>
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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connection] = useState(() => new Connection(SOLANA_RPC_URL, 'confirmed'))
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [walletName, setWalletName] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [testKeypair, setTestKeypair] = useState<Keypair | null>(null)

  // Load saved session on mount
  useEffect(() => {
    try {
      const savedType = localStorage.getItem('kalend_wallet_type')
      const savedKey = localStorage.getItem('kalend_test_secret')

      if (savedType === 'injected' && typeof window !== 'undefined' && (window as any).solana) {
        const sol = (window as any).solana
        if (sol.isPhantom || sol.isBackpack || sol.publicKey) {
          sol.connect({ onlyIfTrusted: true })
            .then((res: any) => {
              if (res?.publicKey) {
                setPublicKey(res.publicKey)
                setWalletName(sol.isPhantom ? 'Phantom' : sol.isBackpack ? 'Backpack' : 'Solana Wallet')
              }
            })
            .catch(() => {
              // Not pre-trusted, user will connect manually
            })
        }
      } else if (savedType === 'devnet_keypair' && savedKey) {
        try {
          const secret = new Uint8Array(JSON.parse(savedKey))
          const kp = Keypair.fromSecretKey(secret)
          setTestKeypair(kp)
          setPublicKey(kp.publicKey)
          setWalletName('Devnet Local Wallet')
        } catch (e) {
          console.warn('Failed to restore devnet keypair from storage:', e)
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    try {
      if (typeof window !== 'undefined' && (window as any).solana) {
        const sol = (window as any).solana
        const res = await sol.connect()
        const pk = res?.publicKey || sol.publicKey
        if (pk) {
          setPublicKey(pk)
          setTestKeypair(null)
          setWalletName(sol.isPhantom ? 'Phantom' : sol.isBackpack ? 'Backpack' : 'Solana Wallet')
          localStorage.setItem('kalend_wallet_type', 'injected')
          localStorage.removeItem('kalend_test_secret')
          setShowConnectModal(false)
          return
        }
      }
      // If no injected wallet found, open modal to let user choose or use devnet wallet
      setShowConnectModal(true)
    } catch (err: any) {
      console.error('Wallet connection failed:', err)
      setShowConnectModal(true)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        ;(window as any).solana.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    }
    setPublicKey(null)
    setTestKeypair(null)
    setWalletName(null)
    try {
      localStorage.removeItem('kalend_wallet_type')
      localStorage.removeItem('kalend_test_secret')
    } catch {
      // Ignore
    }
  }, [])

  const useDevnetTestWallet = useCallback((privateKeyJsonOrBase58?: string): boolean => {
    try {
      let kp: Keypair
      if (privateKeyJsonOrBase58) {
        let raw: Uint8Array
        if (privateKeyJsonOrBase58.startsWith('[')) {
          raw = new Uint8Array(JSON.parse(privateKeyJsonOrBase58))
        } else {
          // Fallback to json parse
          raw = new Uint8Array(JSON.parse(privateKeyJsonOrBase58))
        }
        kp = Keypair.fromSecretKey(raw)
      } else {
        // Generate new devnet burner keypair
        kp = Keypair.generate()
      }
      setTestKeypair(kp)
      setPublicKey(kp.publicKey)
      setWalletName('Devnet Test Wallet')
      localStorage.setItem('kalend_wallet_type', 'devnet_keypair')
      localStorage.setItem('kalend_test_secret', JSON.stringify(Array.from(kp.secretKey)))
      setShowConnectModal(false)
      return true
    } catch (err) {
      console.error('Failed to initialize test keypair:', err)
      return false
    }
  }, [])

  const signTransaction = useCallback(
    async (tx: Transaction): Promise<Transaction> => {
      if (testKeypair) {
        tx.partialSign(testKeypair)
        return tx
      }
      if (typeof window !== 'undefined' && (window as any).solana) {
        return (window as any).solana.signTransaction(tx)
      }
      throw new Error('No wallet connected to sign transaction')
    },
    [testKeypair]
  )

  const signAllTransactions = useCallback(
    async (txs: Transaction[]): Promise<Transaction[]> => {
      if (testKeypair) {
        txs.forEach((tx) => tx.partialSign(testKeypair))
        return txs
      }
      if (typeof window !== 'undefined' && (window as any).solana) {
        return (window as any).solana.signAllTransactions(txs)
      }
      throw new Error('No wallet connected to sign transactions')
    },
    [testKeypair]
  )

  const signMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array> => {
      if (testKeypair) {
        const nacl = await import('@noble/curves/ed25519.js')
        return nacl.ed25519.sign(message, testKeypair.secretKey.subarray(0, 32))
      }
      if (typeof window !== 'undefined' && (window as any).solana) {
        const res = await (window as any).solana.signMessage(message)
        return res?.signature ? new Uint8Array(res.signature) : new Uint8Array(res)
      }
      throw new Error('No wallet connected to sign message')
    },
    [testKeypair]
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

      if (typeof window !== 'undefined' && (window as any).solana) {
        const signedTx = await (window as any).solana.signTransaction(tx)
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
    [connection, publicKey, testKeypair]
  )

  const value: WalletContextValue = {
    walletAddress: publicKey ? publicKey.toBase58() : null,
    publicKey,
    connected: !!publicKey,
    isConnecting,
    walletName,
    connect,
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
          onConnectInjected={connect}
          onConnectDevnet={useDevnetTestWallet}
        />
      )}
    </WalletContext.Provider>
  )
}

function ConnectWalletModal({
  onClose,
  onConnectInjected,
  onConnectDevnet,
}: {
  onClose: () => void
  onConnectInjected: () => void
  onConnectDevnet: (key?: string) => boolean
}) {
  const [customKey, setCustomKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDevnetConnect = () => {
    setError(null)
    const ok = onConnectDevnet(customKey.trim() || undefined)
    if (!ok) {
      setError('Invalid key format. Please enter a valid JSON byte array [1,2,3...] or leave empty for a new keypair.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[#0e0e0e] border border-[#2b2b2b] rounded-none max-w-md w-full p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <h3 className="font-serif text-xl font-medium">Connect Solana Wallet</h3>
          <button
            onClick={onClose}
            className="text-[#a8a8a8] hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).solana) {
                onConnectInjected()
              } else {
                setError('No browser wallet detected. Install Phantom, Backpack, or Solflare, or use the Devnet Test Wallet below.')
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#161616] hover:bg-[#202020] border border-[#333333] transition-colors font-mono text-xs"
          >
            <span>Browser Wallet (Phantom / Backpack / Solflare)</span>
            <span className="text-[#a8a8a8]">→</span>
          </button>

          <div className="pt-4 border-t border-[#222222]">
            <span className="font-mono text-xs text-[#a8a8a8] uppercase tracking-wider block mb-2">
              Devnet Quick Connect (Zero Extension Required)
            </span>
            <p className="text-xs text-[#737373] mb-3 leading-relaxed">
              Instantly create a real Devnet burner keypair or paste an existing secret key array to sign and submit real on-chain transactions directly to Solana Devnet.
            </p>

            <input
              type="text"
              placeholder="Optional: Paste secret key JSON array [1,2,3...]"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="w-full bg-[#121212] border border-[#2b2b2b] px-3 py-2 text-xs font-mono text-white placeholder-[#555] mb-3 focus:outline-none focus:border-white"
            />

            {error && (
              <p className="text-xs font-mono text-[#f87171] mb-3">{error}</p>
            )}

            <button
              onClick={handleDevnetConnect}
              className="w-full py-2.5 bg-white text-black font-mono text-xs font-semibold hover:bg-[#e5e5e5] transition-colors"
            >
              {customKey.trim() ? 'Import Devnet Keypair' : 'Generate Devnet Burner Keypair'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
