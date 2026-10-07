'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Hero illustration of the core mechanic: one collateral deposit splits into a PT plate and a
 * YT plate for the same maturity date, then merges back. Pure CSS 3D (see globals.css), with a
 * small pointer tilt. Decorative: hidden from assistive tech; static under reduced motion.
 */
export function StripObject3D() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth
        const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight
        el.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`)
        el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  // 30 day ticks around a slightly irregular, hand-drawn ring.
  const ticks = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2
    const r1 = 152
    const r2 = i % 7 === 0 ? 140 : 146
    return { x1: 166 + Math.cos(a) * r1, y1: 166 + Math.sin(a) * r1, x2: 166 + Math.cos(a) * r2, y2: 166 + Math.sin(a) * r2, week: i % 7 === 0 }
  })

  return (
    <div ref={ref} aria-hidden className="strip3d flex items-center justify-center select-none py-10">
      <div className="strip3d-tilt">
        <div className="strip3d-scene">
          <svg className="strip3d-ring" viewBox="0 0 332 332" fill="none">
            <path
              d="M166 10c88 1 157 70 156 157-2 87-72 155-158 155C78 321 9 252 11 164 13 79 81 9 166 10Z"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M166 22c80 0 145 64 144 145-1 79-66 143-146 142-79-1-142-66-141-145 1-78 65-142 143-142Z"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.week ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)'} strokeWidth={t.week ? 1.4 : 1} />
            ))}
            <circle cx="318" cy="166" r="5" fill="#4ade80" />
            <text x="300" y="150" fill="#4ade80" fontFamily="var(--font-hand)" fontSize="20">T</text>
          </svg>

          <div className="strip3d-plate strip3d-plate--base">
            <Label text="collateral" sub="vault · in kind" />
          </div>
          <div className="strip3d-plate strip3d-plate--yt">
            <Label text="YT" sub="all growth until T" tone="#fbbf24" />
          </div>
          <div className="strip3d-plate strip3d-plate--pt">
            <Label text="PT" sub="principal at T" tone="#4ade80" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ text, sub, tone = 'rgba(255,255,255,0.75)' }: { text: string; sub: string; tone?: string }) {
  return (
    <div className="absolute left-5 bottom-5 leading-tight">
      <div className="font-serif text-3xl" style={{ color: tone }}>{text}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/50">{sub}</div>
    </div>
  )
}
