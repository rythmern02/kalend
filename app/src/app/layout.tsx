import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kalend · Private RFQ Exchange for Dated Yield',
  description: 'Private request-for-quote exchange for dated yield on Solana, settled confidentially via Chainlink CRE.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0c] text-foreground min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
