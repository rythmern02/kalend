import './globals.css'
import type { Metadata } from 'next'
import { Newsreader, Pinyon_Script, Caveat, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { QueryProvider } from '../components/QueryProvider'
import { WalletProvider } from '../lib/wallet'
import { CalendarFloor } from '../components/CalendarFloor'

const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' })
const script = Pinyon_Script({ subsets: ['latin'], weight: '400', variable: '--font-pinyon', display: 'swap' })
const hand = Caveat({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-hand', display: 'swap' })
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Kalend · Private RFQ for dated yield',
  description: 'A private request-for-quote desk for dated yield on Solana, matched through Chainlink CRE.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${serif.variable} ${script.variable} ${hand.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="bg-black text-white min-h-screen flex flex-col antialiased selection:bg-white selection:text-black relative">
        <CalendarFloor />
        <div className="relative z-10 flex-1 flex flex-col">
          <QueryProvider>
            <WalletProvider>{children}</WalletProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  )
}
