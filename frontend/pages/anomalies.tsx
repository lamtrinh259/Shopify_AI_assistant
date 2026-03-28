import React, { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import KPICard from '../components/KPICard'
import BarChart from '../components/charts/BarChart'
import { cn } from '../lib/utils'

// ── Deterministic Mock Data ───────────────────────────────────────────────────

const BASELINE_HOURLY_ORDERS = [
  2, 1, 1, 1, 2, 3, 5, 8, 12, 15, 18, 20,
  22, 19, 16, 14, 13, 15, 18, 16, 12, 8, 5, 3,
]

const HOUR_LABELS = [
  '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am',
  '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm',
  '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm',
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Deterministic "actual" data for last 7 days (rows=days, cols=hours)
// Each value is a multiplier of baseline, kept realistic except for anomaly spikes
const WEEKLY_MULTIPLIERS: number[][] = [
  [1.0, 0.8, 1.2, 0.9, 1.0, 1.1, 0.9, 1.0, 1.1, 0.9, 1.0, 1.2, 1.0, 0.8, 1.1, 1.0, 0.9, 1.1, 1.0, 1.2, 0.9, 1.0, 1.1, 0.8],
  [0.9, 1.0, 0.8, 1.1, 1.0, 0.9, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 1.0, 0.9, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.0],
  [1.1, 0.9, 1.0, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 3.8, 1.0, 0.9, 1.1, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.0, 1.1], // anomaly at 10am
  [1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9],
  [0.8, 1.0, 1.1, 0.9, 1.0, 1.0, 1.1, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 4.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.0, 1.2], // anomaly at 2pm
  [1.0, 0.9, 1.0, 1.1, 0.9, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 1.0, 0.9, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.0, 1.1],
  [1.2, 1.0, 0.9, 1.0, 1.1, 0.8, 1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 4.0, 1.0, 0.9, 1.1, 1.0, 0.9, 1.0, 1.1, 0.8, 1.2, 0.9, 1.0], // today: anomaly at current demo hour (12pm)
]

// Current demo hour forced to 14 (2pm) for consistent anomaly display
const DEMO_CURRENT_HOUR = 14
const CURRENT_ORDERS_MULTIPLIER = 4.1 // 4.1x baseline = clear anomaly

const RECENT_ANOMALIES = [
  {
    id: 1,
    timestamp: '2026-03-28T14:23:00Z',
    hour: 14,
    baseline: 16,
    actual: 66,
    deviation: 312.5,
    description: 'Spike at 2:00 PM — 4.1x normal volume. Possible viral referral or bot activity.',
    severity: 'critical' as const,
  },
  {
    id: 2,
    timestamp: '2026-03-26T14:10:00Z',
    hour: 14,
    baseline: 16,
    actual: 67,
    deviation: 318.8,
    description: 'Order surge at 2:00 PM Friday — 4.2x baseline. Correlated with Instagram story post.',
    severity: 'critical' as const,
  },
  {
    id: 3,
    timestamp: '2026-03-24T10:45:00Z',
    hour: 10,
    baseline: 18,
    actual: 68,
    deviation: 277.8,
    description: 'Unusual 10:00 AM activity Wednesday — 3.8x normal. Newsletter campaign sent at 9:50 AM.',
    severity: 'warning' as const,
  },
  {
    id: 4,
    timestamp: '2026-03-22T20:30:00Z',
    hour: 20,
    baseline: 12,
    actual: 26,
    deviation: 116.7,
    description: 'Elevated 8:00 PM orders — 2.2x baseline. TikTok product mention detected.',
    severity: 'warning' as const,
  },
]

// ── Helper Components ─────────────────────────────────────────────────────────

function StatusIndicator({ isAnomaly }: { isAnomaly: boolean }) {
  return (
    <div className={cn(
      'relative flex items-center justify-center rounded-xl border p-6',
      isAnomaly
        ? 'bg-paint-red/5 border-paint-red/20'
        : 'bg-paint-green/5 border-paint-green/20'
    )}>
      {/* Pulsing ring for anomaly */}
      {isAnomaly && (
        <div className="absolute inset-0 rounded-xl border border-paint-red/30 animate-ping" style={{ animationDuration: '2s' }} />
      )}
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-4 h-4 rounded-full',
          isAnomaly ? 'bg-paint-red animate-pulse' : 'bg-paint-green'
        )} />
        <div>
          <p className={cn(
            'text-3xl font-bold tracking-tight font-headline',
            isAnomaly ? 'text-paint-red' : 'text-paint-green'
          )}>
            {isAnomaly ? 'ANOMALY DETECTED' : 'ALL SYSTEMS NORMAL'}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {isAnomaly
              ? 'Order volume significantly exceeds baseline for this hour'
              : 'Order patterns within expected range'}
          </p>
        </div>
      </div>
    </div>
  )
}

function HeatMapInline({
  data,
  xLabels,
  yLabels,
  baseline,
}: {
  data: number[][]
  xLabels: string[]
  yLabels: string[]
  baseline: number[]
}) {
  const getColor = (actual: number, baselineVal: number) => {
    if (baselineVal === 0) return 'bg-surface-2'
    const ratio = actual / baselineVal
    if (ratio >= 3.0) return 'bg-paint-red'
    if (ratio >= 2.0) return 'bg-[#FFB224]'
    if (ratio >= 1.3) return 'bg-paint-green/60'
    if (ratio >= 0.7) return 'bg-paint-green/25'
    return 'bg-surface-2'
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-[700px]">
        {/* X labels */}
        <div className="flex ml-10">
          {xLabels.map((label, i) => (
            <div key={i} className="flex-1 text-center text-[10px] text-text-tertiary mb-1">
              {i % 3 === 0 ? label : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {data.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-0.5 mb-0.5">
            <span className="w-10 text-[11px] text-text-tertiary text-right pr-2 shrink-0">
              {yLabels[rowIdx]}
            </span>
            {row.map((val, colIdx) => {
              const baselineVal = baseline[colIdx]
              const actualOrders = Math.round(baselineVal * val)
              return (
                <div
                  key={colIdx}
                  className={cn(
                    'flex-1 h-6 rounded-sm transition-colors duration-150',
                    getColor(actualOrders, baselineVal)
                  )}
                  title={`${yLabels[rowIdx]} ${xLabels[colIdx]}: ${actualOrders} orders (baseline: ${baselineVal})`}
                />
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 ml-10">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-surface-2" />
            <span className="text-[10px] text-text-tertiary">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-paint-green/25" />
            <span className="text-[10px] text-text-tertiary">Slightly above</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-paint-green/60" />
            <span className="text-[10px] text-text-tertiary">Above avg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#FFB224]" />
            <span className="text-[10px] text-text-tertiary">&gt;2x baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-paint-red" />
            <span className="text-[10px] text-text-tertiary">&gt;3x baseline</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'critical' | 'warning' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide',
      severity === 'critical'
        ? 'bg-paint-red/10 text-paint-red'
        : 'bg-[#FFB224]/10 text-[#FFB224]'
    )}>
      {severity === 'critical' ? 'Critical' : 'Warning'}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnomaliesPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Current hour data
  const currentHour = DEMO_CURRENT_HOUR
  const baselineAvg = BASELINE_HOURLY_ORDERS[currentHour]
  const currentOrders = Math.round(baselineAvg * CURRENT_ORDERS_MULTIPLIER)
  const deviation = ((currentOrders - baselineAvg) / baselineAvg) * 100
  const isAnomaly = currentOrders > baselineAvg * 2

  // Bar chart data: 24 hours, highlight current hour
  const barChartData = BASELINE_HOURLY_ORDERS.map((baseline, i) => {
    const actual = i === currentHour
      ? currentOrders
      : Math.round(baseline * (WEEKLY_MULTIPLIERS[6][i] || 1))
    return {
      label: HOUR_LABELS[i],
      value: actual,
      color: i === currentHour
        ? (isAnomaly ? '#F0B90B' : '#00E676')
        : 'rgba(0, 230, 118, 0.25)',
    }
  })

  // Heatmap data: convert multipliers to actual values
  const heatmapData = WEEKLY_MULTIPLIERS.map(row =>
    row.map((mult, colIdx) => mult)
  )

  if (!mounted) {
    return (
      <Shell title="Anomalies">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-surface-1 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-surface-1 rounded-lg" />
            <div className="h-24 bg-surface-1 rounded-lg" />
            <div className="h-24 bg-surface-1 rounded-lg" />
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Anomalies">
      <div className="space-y-6">
        {/* Status Indicator — this IS the header */}
        <StatusIndicator isAnomaly={isAnomaly} />

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            title="Current Hour Orders"
            value={currentOrders}
            suffix="orders"
          />
          <KPICard
            title="Baseline Average"
            value={baselineAvg}
            suffix={`avg @ ${HOUR_LABELS[currentHour]}`}
          />
          <div className="bg-surface-1 border border-border rounded-lg p-4 pollock-glow">
            <p className="text-label mb-2">Deviation</p>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                'text-3xl font-bold font-mono',
                isAnomaly ? 'text-paint-red' : 'text-paint-green'
              )}>
                +{deviation.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isAnomaly ? 'bg-paint-red animate-pulse' : 'bg-paint-green'
              )} />
              <span className={cn(
                'text-xs font-medium',
                isAnomaly ? 'text-paint-red' : 'text-paint-green'
              )}>
                {isAnomaly ? 'Anomaly threshold exceeded' : 'Within normal range'}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Orders by Hour */}
          <Card
            title="Orders by Hour — Today"
            subtitle={`Current hour (${HOUR_LABELS[currentHour]}) highlighted`}
          >
            <BarChart data={barChartData} height={220} />
          </Card>

          {/* Heatmap - Weekly Pattern */}
          <Card
            title="Weekly Pattern Heatmap"
            subtitle="Expected vs actual — last 7 days"
          >
            <HeatMapInline
              data={heatmapData}
              xLabels={HOUR_LABELS}
              yLabels={DAY_LABELS}
              baseline={BASELINE_HOURLY_ORDERS}
            />
          </Card>
        </div>

        {/* Recent Anomaly Events */}
        <Card
          title="Recent Anomaly Events"
          subtitle="Detected deviations exceeding 2x baseline threshold"
        >
          <div className="space-y-3">
            {RECENT_ANOMALIES.map((anomaly) => (
              <div
                key={anomaly.id}
                className={cn(
                  'flex items-start gap-4 p-3 rounded-lg border transition-colors duration-150',
                  anomaly.severity === 'critical'
                    ? 'bg-paint-red/[0.03] border-paint-red/10'
                    : 'bg-[#FFB224]/[0.03] border-[#FFB224]/10'
                )}
              >
                {/* Indicator dot */}
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  anomaly.severity === 'critical' ? 'bg-paint-red' : 'bg-[#FFB224]'
                )} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={anomaly.severity} />
                    <span className="text-[11px] text-text-tertiary font-mono">
                      {new Date(anomaly.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(anomaly.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {anomaly.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[11px] text-text-tertiary">
                      Baseline: <span className="text-text-secondary font-mono font-bold">{anomaly.baseline}</span>
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      Actual: <span className={cn(
                        'font-mono font-bold',
                        anomaly.severity === 'critical' ? 'text-paint-red' : 'text-[#FFB224]'
                      )}>{anomaly.actual}</span>
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      Deviation: <span className={cn(
                        'font-mono font-bold',
                        anomaly.severity === 'critical' ? 'text-paint-red' : 'text-[#FFB224]'
                      )}>+{anomaly.deviation.toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  )
}
