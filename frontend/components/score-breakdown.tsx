import React from 'react'
import { ScoreBreakdown as ScoreBreakdownType, getScoreColor } from '../lib/health-algorithm'

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType
  t: (key: string) => string
  loading?: boolean
}

const metrics: { key: keyof Omit<ScoreBreakdownType, 'total'>; label: string; weight: string }[] = [
  { key: 'salesVelocity', label: 'salesVelocity', weight: '25%' },
  { key: 'revenueTrend', label: 'revenueTrend', weight: '25%' },
  { key: 'inventoryHealth', label: 'inventoryHealth', weight: '20%' },
  { key: 'anomalyRate', label: 'anomalyRate', weight: '15%' },
  { key: 'customerMix', label: 'customerMix', weight: '15%' },
]

export default function ScoreBreakdown({ breakdown, t, loading }: ScoreBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="w-24 h-3 bg-surface-2 rounded animate-pulse" />
              <div className="w-8 h-3 bg-surface-2 rounded animate-pulse" />
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {metrics.map(({ key, label, weight }) => {
        const value = breakdown[key]
        const color = getScoreColor(value)
        const percentage = (value / 10) * 100

        return (
          <div key={key} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                  {t(label)}
                </span>
                <span className="text-xs text-text-tertiary">({weight})</span>
              </div>
              <span className="text-xs font-mono font-medium" style={{ color }}>
                {value.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${color}80, ${color})`,
                  boxShadow: `0 0 8px ${color}40`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
