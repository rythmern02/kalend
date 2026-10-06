'use client'

import React, { useRef, useState } from 'react'
import { clsx } from 'clsx'

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  accent?: 'default' | 'emerald' | 'amber' | 'cyan' | 'rose'
  intensity?: number
  enableGlare?: boolean
  enableBrackets?: boolean
}

export function TiltCard({
  children,
  className = '',
  accent = 'default',
  intensity = 10,
  enableGlare = true,
  enableBrackets = true,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    const xPct = (clientX / rect.width - 0.5) * 2 // -1 to 1
    const yPct = (clientY / rect.height - 0.5) * 2 // -1 to 1

    setRotateX(-yPct * intensity)
    setRotateY(xPct * intensity)

    if (enableGlare) {
      setGlarePosition({
        x: (clientX / rect.width) * 100,
        y: (clientY / rect.height) * 100,
        opacity: 0.15,
      })
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }))
  }

  const accentBorderMap = {
    default: 'hover:border-white/30 hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.08)]',
    emerald: 'hover:border-emerald-400/50 hover:shadow-[0_0_30px_-5px_rgba(74,222,128,0.18)]',
    amber: 'hover:border-amber-400/50 hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.18)]',
    cyan: 'hover:border-cyan-400/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.18)]',
    rose: 'hover:border-rose-400/50 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.18)]',
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'perspective-1000 transition-transform duration-200 ease-out',
        enableBrackets && 'corner-bracket',
        className
      )}
      {...props}
    >
      <div
        className={clsx(
          'relative w-full h-full rounded-[4px] bg-[#0c0c0c]/80 backdrop-blur-md border border-[#202020] transition-all duration-200 ease-out transform-style-3d',
          accentBorderMap[accent],
          isHovered ? 'scale-[1.015]' : 'scale-100'
        )}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        {/* Holographic Specular Glare Layer */}
        {enableGlare && (
          <div
            className="absolute inset-0 rounded-[4px] pointer-events-none transition-opacity duration-300 z-30"
            style={{
              opacity: glarePosition.opacity,
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`,
            }}
          />
        )}

        {/* Content Container */}
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </div>
  )
}
