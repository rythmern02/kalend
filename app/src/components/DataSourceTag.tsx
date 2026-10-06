'use client'

import React, { useState, useEffect } from 'react'
import { Database, Clock } from 'lucide-react'

interface DataSourceTagProps {
  sourceName: string
  updatedAt?: number // timestamp in ms or seconds
  verified?: boolean
}

export function DataSourceTag({
  sourceName,
  updatedAt,
  verified = true,
}: DataSourceTagProps) {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    if (!updatedAt) return
    const update = () => {
      const now = Date.now()
      const ts = updatedAt > 1e11 ? updatedAt : updatedAt * 1000
      setSecondsAgo(Math.max(0, Math.floor((now - ts) / 1000)))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [updatedAt])

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#121212] border border-[#2b2b2b] text-[11px] font-mono text-[#a8a8a8]">
      <Database className="w-3 h-3 text-[#737373]" />
      <span>Source: {sourceName}</span>
      {updatedAt ? (
        <>
          <span className="text-[#404040]">·</span>
          <span className="text-[#737373] flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {secondsAgo}s ago
          </span>
        </>
      ) : null}
      {verified && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" title="Attested" />
      )}
    </div>
  )
}
