'use client'

import React, { useEffect, useRef } from 'react'

export function CyberGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let mouseX = width / 2
    let mouseY = height / 2
    let targetMouseX = mouseX
    let targetMouseY = mouseY

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX
      targetMouseY = e.clientY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)

    // Holographic floating particles with 3D coordinates
    interface Particle {
      x: number
      y: number
      z: number
      baseSize: number
      color: string
      vx: number
      vy: number
      vz: number
    }

    const colors = [
      'rgba(74, 222, 128, 0.45)', // emerald
      'rgba(6, 182, 212, 0.4)',  // cyan
      'rgba(251, 191, 36, 0.35)', // amber
      'rgba(255, 255, 255, 0.25)', // silver
    ]

    const particles: Particle[] = Array.from({ length: 48 }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 800 + 200,
      baseSize: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.5,
    }))

    let time = 0

    const render = () => {
      time += 0.015

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      ctx.clearRect(0, 0, width, height)

      const fov = 500
      const centerX = width / 2 + (mouseX - width / 2) * 0.04
      const centerY = height * 0.45 + (mouseY - height / 2) * 0.04

      // Draw subtle horizon grid lines in 3D perspective
      ctx.lineWidth = 1
      const gridCount = 9
      const horizonY = centerY + 100

      for (let i = 0; i < gridCount; i++) {
        const p = i / (gridCount - 1)
        const lineY = horizonY + Math.pow(p, 2.2) * (height - horizonY)
        const alpha = Math.min(0.08, p * 0.1)

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.moveTo(0, lineY)
        ctx.lineTo(width, lineY)
        ctx.stroke()
      }

      // Draw perspective vanishing rays
      const rays = 12
      for (let i = -rays; i <= rays; i++) {
        const rayAngle = (i / rays) * (Math.PI * 0.4)
        const startX = centerX
        const startY = horizonY
        const endX = centerX + Math.tan(rayAngle) * width * 0.8
        const endY = height

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)'
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }

      // Render 3D Floating Nodes
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i]

        pt.x += pt.vx
        pt.y += pt.vy
        pt.z += pt.vz

        // Wrap around bounds
        if (pt.z < 100) pt.z = 1000
        if (pt.z > 1000) pt.z = 100

        const scale = fov / pt.z
        const projX = centerX + pt.x * scale
        const projY = centerY + pt.y * scale

        if (projX < -50 || projX > width + 50 || projY < -50 || projY > height + 50) {
          continue
        }

        const size = Math.max(0.8, pt.baseSize * scale)
        const alpha = Math.min(0.6, (1 - pt.z / 1000) * 0.7)

        // Draw node glow
        ctx.fillStyle = pt.color.replace(/[\d\.]+\)$/, `${alpha})`)
        ctx.beginPath()
        ctx.arc(projX, projY, size, 0, Math.PI * 2)
        ctx.fill()

        // Subtle connection lines between near nodes
        for (let j = i + 1; j < particles.length; j++) {
          const pt2 = particles[j]
          const dist = Math.hypot(pt.x - pt2.x, pt.y - pt2.y, (pt.z - pt2.z) * 0.5)

          if (dist < 180) {
            const scale2 = fov / pt2.z
            const projX2 = centerX + pt2.x * scale2
            const projY2 = centerY + pt2.y * scale2

            const lineAlpha = (1 - dist / 180) * 0.05 * Math.min(alpha, 0.3)
            ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`
            ctx.beginPath()
            ctx.moveTo(projX, projY)
            ctx.lineTo(projX2, projY2)
            ctx.stroke()
          }
        }
      }

      // Ambient radial gradient glow in center
      const grad = ctx.createRadialGradient(centerX, centerY - 60, 20, centerX, centerY, width * 0.6)
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.035)')
      grad.addColorStop(0.4, 'rgba(6, 182, 212, 0.015)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Vignette gradient overlay for crisp readability */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 pointer-events-none" />
      {/* Subtle cyber grid pattern overlay */}
      <div className="absolute inset-0 cyber-grid-texture opacity-60 pointer-events-none" />
    </div>
  )
}
