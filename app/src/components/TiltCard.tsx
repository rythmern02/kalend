'use client'

import React, { useRef } from 'react'
import { clsx } from 'clsx'

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  accent?: 'default' | 'emerald' | 'amber' | 'cyan' | 'rose'
  /** Max tilt in degrees (capped at 4 so content stays readable). */
  intensity?: number
  enableGlare?: boolean
  enableBrackets?: boolean
}

const ACCENT: Record<NonNullable<TiltCardProps['accent']>, string> = {
  default: 'rgba(255,255,255,0.22)',
  emerald: 'rgba(74,222,128,0.45)',
  amber: 'rgba(251,191,36,0.45)',
  cyan: 'rgba(34,211,238,0.45)',
  rose: 'rgba(251,113,133,0.45)',
}

/**
 * Card with a light 3D tilt toward the pointer. Pointer position is written to CSS variables
 * on the element (no React re-render per mousemove). Tilt and glare only apply on hover-capable
 * devices without reduced motion (see .tilt-card in globals.css).
 */
export function TiltCard({
  children,
  className = '',
  accent = 'default',
  intensity = 3,
  enableGlare = true,
  enableBrackets: _brackets,
  style,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const max = Math.min(intensity, 4)

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--tilt-x', `${((0.5 - y) * 2 * max).toFixed(2)}deg`)
    el.style.setProperty('--tilt-y', `${((x - 0.5) * 2 * max).toFixed(2)}deg`)
    el.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div className={clsx('tilt-wrap', className)} {...props}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={clsx('tilt-card depth-card relative w-full h-full', enableGlare && 'tilt-card--glare')}
        style={{ ...style, ['--tilt-accent' as string]: ACCENT[accent] }}
      >
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </div>
  )
}
