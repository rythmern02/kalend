'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Background: a perspective "calendar floor". Rows are days receding to a horizon and drift
 * slowly toward the viewer (time passing); every seventh row is brighter (a week). The
 * vanishing point follows the pointer a little. Drawn once and left static when the user
 * prefers reduced motion; paused while the tab is hidden.
 */
export function CalendarFloor() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let offset = 0
    let px = 0
    let tx = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const horizon = h * 0.42
      const vx = w / 2 + px * w * 0.04
      const depth = h - horizon

      // Columns: lines from the vanishing point to the bottom edge.
      const cols = 22
      for (let i = -cols; i <= cols; i++) {
        const xBottom = vx + (i / cols) * w * 1.6
        const g = ctx.createLinearGradient(0, horizon, 0, h)
        g.addColorStop(0, 'rgba(255,255,255,0)')
        g.addColorStop(1, `rgba(255,255,255,${i === 0 ? 0.07 : 0.035})`)
        ctx.strokeStyle = g
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(vx, horizon)
        ctx.lineTo(xBottom, h)
        ctx.stroke()
      }

      // Rows: perspective-spaced "days", drifting toward the viewer.
      const rows = 28
      for (let i = 0; i < rows; i++) {
        const t = ((i + offset) % rows) / rows // 0 far .. 1 near
        const y = horizon + depth * t * t
        const day = Math.floor(i + offset)
        const week = (rows - 1 - (day % rows)) % 7 === 0
        const a = (week ? 0.09 : 0.04) * t
        ctx.strokeStyle = `rgba(255,255,255,${a})`
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Horizon glow.
      const glow = ctx.createRadialGradient(vx, horizon, 0, vx, horizon, w * 0.45)
      glow.addColorStop(0, 'rgba(74,222,128,0.06)')
      glow.addColorStop(1, 'rgba(74,222,128,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)
    }

    const tick = () => {
      offset = (offset + 0.012) % 28
      px += (tx - px) * 0.04
      draw()
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / w - 0.5) * 2
    }
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && !reduce) raf = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduce) {
      draw()
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(tick)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <canvas ref={ref} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(0,0,0,0.65)_70%)]" />
    </div>
  )
}
