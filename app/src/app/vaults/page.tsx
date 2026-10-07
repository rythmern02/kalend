'use client'

import React from 'react'
import { Header } from '../../components/Header'
import { ModeBar } from '../../components/ModeBar'
import { SeriesTable } from '../../components/SeriesTable'
import { PythPriceTicker } from '../../components/PythPriceTicker'

export default function SeriesIndexPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Header />
      <ModeBar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div>
          <h1 className="font-serif text-3xl mb-2">Series</h1>
          <p className="text-sm text-[#a3a3a3] max-w-2xl">
            Each series locks one collateral mint until one maturity date. Strip mints equal PT and YT; merge burns both
            before maturity. After settlement PT redeems principal and YT claims growth, both in kind.
          </p>
        </div>
        <SeriesTable />
        <PythPriceTicker />
      </main>
    </div>
  )
}
