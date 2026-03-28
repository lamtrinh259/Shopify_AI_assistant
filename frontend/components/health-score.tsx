import React, { useEffect, useState } from 'react'
import { getScoreColor, getScoreLabel } from '../lib/health-algorithm'

interface HealthScoreProps {
  score: number
  label: string
  loading?: boolean
}

export default function HealthScore({ score, label, loading }: HealthScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (loading) return

    let start = 0
    const end = score
    const duration = 1200
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased
      setAnimatedScore(Math.round(current * 10) / 10)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [score, loading])

  const color = getScoreColor(animatedScore)
  const size = 220
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = animatedScore / 10
  const dashOffset = circumference * (1 - progress * 0.75) // 270 degrees arc
  const startAngle = 135 // Start from bottom-left

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="animate-pulse">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              strokeLinecap="round"
              transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-8 bg-surface-2 rounded animate-pulse" />
            <div className="w-12 h-4 bg-surface-2 rounded mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background arc */}
        <svg width={size} height={size}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
          />

          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
            filter="url(#glow)"
            style={{
              transition: mounted ? 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
            }}
          />

          {/* Tick marks */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => {
            const angle = startAngle + (tick / 10) * 270
            const rad = (angle * Math.PI) / 180
            const innerR = radius - strokeWidth / 2 - 6
            const outerR = radius - strokeWidth / 2 - 2
            const x1 = size / 2 + innerR * Math.cos(rad)
            const y1 = size / 2 + innerR * Math.sin(rad)
            const x2 = size / 2 + outerR * Math.cos(rad)
            const y2 = size / 2 + outerR * Math.sin(rad)
            return (
              <line
                key={tick}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={tick <= animatedScore ? color : 'rgba(255,255,255,0.15)'}
                strokeWidth={tick % 5 === 0 ? 2 : 1}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.3s ease-out' }}
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold font-mono tracking-tight"
            style={{ color }}
          >
            {animatedScore.toFixed(1)}
          </span>
          <span className="text-sm text-text-secondary mt-1 font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>

      {/* Score scale labels */}
      <div className="flex justify-between w-48 mt-2 px-2">
        <span className="text-xs text-text-tertiary">0</span>
        <span className="text-xs text-text-tertiary">5</span>
        <span className="text-xs text-text-tertiary">10</span>
      </div>
    </div>
  )
}
