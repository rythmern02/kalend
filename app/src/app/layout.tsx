import './globals.css'
import type { Metadata } from 'next'
import { QueryProvider } from '../components/QueryProvider'

export const metadata: Metadata = {
  title: 'Kalend · Private RFQ Exchange for Dated Yield',
  description: 'Private request-for-quote exchange for dated yield on Solana, settled confidentially via Chainlink CRE.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col antialiased selection:bg-white selection:text-black">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
