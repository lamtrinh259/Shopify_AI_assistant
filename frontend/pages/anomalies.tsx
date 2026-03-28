import React, { useState, useEffect, useCallback } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import KPICard from '../components/KPICard'
import BarChart from '../components/charts/BarChart'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
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

const WEEKLY_MULTIPLIERS: number[][] = [
  [1.0, 0.8, 1.2, 0.9, 1.0, 1.1, 0.9, 1.0, 1.1, 0.9, 1.0, 1.2, 1.0, 0.8, 1.1, 1.0, 0.9, 1.1, 1.0, 1.2, 0.9, 1.0, 1.1, 0.8],
  [0.9, 1.0, 0.8, 1.1, 1.0, 0.9, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 1.0, 0.9, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.0],
  [1.1, 0.9, 1.0, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 3.8, 1.0, 0.9, 1.1, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.0, 1.1],
  [1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9],
  [0.8, 1.0, 1.1, 0.9, 1.0, 1.0, 1.1, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 4.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 0.9, 1.0, 1.2],
  [1.0, 0.9, 1.0, 1.1, 0.9, 1.0, 0.8, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.1, 1.0, 0.9, 1.2, 1.0, 0.9, 1.1, 1.0, 0.8, 1.0, 1.1],
  [1.2, 1.0, 0.9, 1.0, 1.1, 0.8, 1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 4.0, 1.0, 0.9, 1.1, 1.0, 0.9, 1.0, 1.1, 0.8, 1.2, 0.9, 1.0],
]

const DEMO_CURRENT_HOUR = 14
const CURRENT_ORDERS_MULTIPLIER = 4.1

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
    type: 'spike' as const,
    daysAgo: 0,
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
    type: 'spike' as const,
    daysAgo: 2,
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
    type: 'bot' as const,
    daysAgo: 4,
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
    type: 'spike' as const,
    daysAgo: 6,
  },
]

type SeverityFilter = 'all' | 'critical' | 'warning'
type TimeRange = 'today' | '7d' | '30d'
type ActionStatus = 'idle' | 'loading' | 'done'

const TIME_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

const SEVERITY_PILLS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning' },
]

// ── Helper Components ─────────────────────────────────────────────────────────

function StatusIndicator({ isAnomaly, liveOrderCount }: { isAnomaly: boolean; liveOrderCount: number }) {
  return (
    <div className={cn(
      'relative flex items-center justify-between rounded-xl border px-6 py-5 overflow-hidden',
      isAnomaly
        ? 'bg-paint-red/5 border-paint-red/20'
        : 'bg-paint-green/5 border-paint-green/20'
    )}>
      {/* Animated scan line */}
      {isAnomaly && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,61,87,0.06) 50%, transparent 100%)',
            animation: 'scanline 3s ease-in-out infinite',
          }}
        />
      )}
      {/* Pulsing border ring */}
      {isAnomaly && (
        <div className="absolute inset-0 rounded-xl border border-paint-red/30 animate-ping" style={{ animationDuration: '2s' }} />
      )}

      {/* Left: Status */}
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          'w-4 h-4 rounded-full shrink-0',
          isAnomaly ? 'bg-paint-red animate-pulse' : 'bg-paint-green'
        )} />
        <div>
          <p className={cn(
            'text-2xl sm:text-3xl font-bold tracking-tight font-headline',
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

      {/* Right: Live order counter */}
      <div className="flex items-center gap-3 relative z-10 shrink-0">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-paint-green animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest text-text-tertiary font-medium">Live</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black font-mono text-paint-yellow tabular-nums">
              {liveOrderCount}
            </span>
            <span className="text-xs text-text-tertiary">orders/hr</span>
          </div>
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
      <div className="inline-block min-w-[500px]">
        {/* X labels */}
        <div className="flex ml-8">
          {xLabels.map((label, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-text-tertiary mb-0.5">
              {i % 4 === 0 ? label : ''}
            </div>
          ))}
        </div>
        {/* Rows */}
        {data.map((row, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-px mb-px">
            <span className="w-8 text-[10px] text-text-tertiary text-right pr-1.5 shrink-0">
              {yLabels[rowIdx]}
            </span>
            {row.map((val, colIdx) => {
              const baselineVal = baseline[colIdx]
              const actualOrders = Math.round(baselineVal * val)
              return (
                <div
                  key={colIdx}
                  className={cn(
                    'flex-1 h-5 rounded-sm transition-colors duration-150',
                    getColor(actualOrders, baselineVal)
                  )}
                  title={`${yLabels[rowIdx]} ${xLabels[colIdx]}: ${actualOrders} orders (baseline: ${baselineVal})`}
                />
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 ml-8">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-surface-2" />
            <span className="text-[9px] text-text-tertiary">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-paint-green/25" />
            <span className="text-[9px] text-text-tertiary">+30%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-paint-green/60" />
            <span className="text-[9px] text-text-tertiary">+100%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#FFB224]" />
            <span className="text-[9px] text-text-tertiary">&gt;2x</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-paint-red" />
            <span className="text-[9px] text-text-tertiary">&gt;3x</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'critical' | 'warning' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
      severity === 'critical'
        ? 'bg-paint-red/10 text-paint-red'
        : 'bg-[#FFB224]/10 text-[#FFB224]'
    )}>
      {severity === 'critical' ? 'Critical' : 'Warning'}
    </span>
  )
}

function ActionButton({
  label,
  loadingLabel,
  doneLabel,
  status,
  onClick,
  variant = 'secondary',
}: {
  label: string
  loadingLabel: string
  doneLabel: string
  status: ActionStatus
  onClick: () => void
  variant?: 'secondary' | 'ghost'
}) {
  return (
    <Button
      size="sm"
      variant={status === 'done' ? 'ghost' : variant}
      disabled={status !== 'idle'}
      onClick={onClick}
      className={cn(
        'text-[11px] transition-all duration-300',
        status === 'done' && 'text-paint-green',
        status === 'loading' && 'animate-pulse'
      )}
    >
      {status === 'loading' ? loadingLabel : status === 'done' ? doneLabel : label}
    </Button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnomaliesPage() {
  const [mounted, setMounted] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [liveOrderCount, setLiveOrderCount] = useState(47)
  const [actionStates, setActionStates] = useState<Record<string, ActionStatus>>({})

  useEffect(() => { setMounted(true) }, [])

  // Live order counter — ticks up every 3-8 seconds with random increment
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 5000
      return setTimeout(() => {
        setLiveOrderCount(prev => prev + Math.floor(Math.random() * 3) + 1)
        timerId = scheduleNext()
      }, delay)
    }
    let timerId = scheduleNext()
    return () => clearTimeout(timerId)
  }, [])

  const handleAction = useCallback((anomalyId: number, action: string) => {
    const key = `${anomalyId}-${action}`
    setActionStates(prev => ({ ...prev, [key]: 'loading' }))
    setTimeout(() => {
      setActionStates(prev => ({ ...prev, [key]: 'done' }))
    }, 1200 + Math.random() * 800)
  }, [])

  const getActionStatus = useCallback((anomalyId: number, action: string): ActionStatus => {
    return actionStates[`${anomalyId}-${action}`] || 'idle'
  }, [actionStates])

  // Current hour data
  const currentHour = DEMO_CURRENT_HOUR
  const baselineAvg = BASELINE_HOURLY_ORDERS[currentHour]
  const currentOrders = Math.round(baselineAvg * CURRENT_ORDERS_MULTIPLIER)
  const deviation = ((currentOrders - baselineAvg) / baselineAvg) * 100
  const isAnomaly = currentOrders > baselineAvg * 2

  // Bar chart data
  const barChartData = BASELINE_HOURLY_ORDERS.map((baseline, i) => {
    const actual = i === currentHour
      ? currentOrders
      : i > currentHour
        ? 0
        : Math.round(baseline * (WEEKLY_MULTIPLIERS[6][i] || 1))
    return {
      label: HOUR_LABELS[i],
      value: actual,
      color: i === currentHour
        ? (isAnomaly ? '#FF3D57' : '#00E676')
        : i > currentHour
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(0, 230, 118, 0.2)',
    }
  })

  // Heatmap data
  const heatmapData = WEEKLY_MULTIPLIERS.map(row =>
    row.map((mult) => mult)
  )

  // Filter anomalies
  const filteredAnomalies = RECENT_ANOMALIES.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (timeRange === 'today' && a.daysAgo !== 0) return false
    if (timeRange === '7d' && a.daysAgo > 7) return false
    return true
  })

  if (!mounted) {
    return (
      <Shell title="Anomalies">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-surface-1 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-surface-1 rounded-lg" />
            <div className="h-20 bg-surface-1 rounded-lg" />
            <div className="h-20 bg-surface-1 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-surface-1 rounded-lg" />
            <div className="h-64 bg-surface-1 rounded-lg" />
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Anomalies">
      {/* Scanline keyframe animation */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <div className="space-y-5">
        {/* 1. Status Banner with live counter */}
        <StatusIndicator isAnomaly={isAnomaly} liveOrderCount={liveOrderCount} />

        {/* 2. KPI Row */}
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

        {/* 3. Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* Bar Chart — compact */}
            <Card
              title="Orders by Hour — Today"
              subtitle={`Current hour (${HOUR_LABELS[currentHour]}) highlighted in red`}
            >
              <BarChart data={barChartData} height={180} />
            </Card>

            {/* Recent Anomaly Events */}
            <Card title="Recent Anomaly Events">
              {/* Filter row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {SEVERITY_PILLS.map((pill) => (
                    <button
                      key={pill.value}
                      onClick={() => setSeverityFilter(pill.value)}
                      className={cn(
                        'px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150',
                        severityFilter === pill.value
                          ? pill.value === 'critical'
                            ? 'bg-paint-red/20 text-paint-red font-bold ring-1 ring-paint-red/30'
                            : pill.value === 'warning'
                              ? 'bg-[#FFB224]/20 text-[#FFB224] font-bold ring-1 ring-[#FFB224]/30'
                              : 'bg-paint-yellow text-surface-0 font-bold'
                          : 'bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
                <Select
                  options={TIME_RANGE_OPTIONS}
                  value={timeRange}
                  onChange={(v) => setTimeRange(v as TimeRange)}
                />
              </div>

              {/* Event list */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredAnomalies.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary text-sm">
                    No anomalies match the current filters.
                  </div>
                ) : (
                  filteredAnomalies.map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className={cn(
                        'p-3 rounded-lg border transition-all duration-200',
                        anomaly.severity === 'critical'
                          ? 'bg-paint-red/[0.03] border-paint-red/10 hover:border-paint-red/25'
                          : 'bg-[#FFB224]/[0.03] border-[#FFB224]/10 hover:border-[#FFB224]/25'
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            anomaly.severity === 'critical' ? 'bg-paint-red animate-pulse' : 'bg-[#FFB224]'
                          )} />
                          <SeverityBadge severity={anomaly.severity} />
                          <span className="text-[10px] text-text-tertiary font-mono">
                            {anomaly.daysAgo === 0 ? 'Today' : `${anomaly.daysAgo}d ago`}{' '}
                            {new Date(anomaly.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className={cn(
                          'text-sm font-bold font-mono',
                          anomaly.severity === 'critical' ? 'text-paint-red' : 'text-[#FFB224]'
                        )}>
                          +{anomaly.deviation.toFixed(0)}%
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[13px] text-text-primary leading-relaxed mb-2">
                        {anomaly.description}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mb-2.5">
                        <span className="text-[10px] text-text-tertiary">
                          Baseline: <span className="text-text-secondary font-mono font-bold">{anomaly.baseline}</span>
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          Actual: <span className={cn(
                            'font-mono font-bold',
                            anomaly.severity === 'critical' ? 'text-paint-red' : 'text-[#FFB224]'
                          )}>{anomaly.actual}</span>
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <ActionButton
                          label="Investigate"
                          loadingLabel="Pulling orders..."
                          doneLabel="Investigated"
                          status={getActionStatus(anomaly.id, 'investigate')}
                          onClick={() => handleAction(anomaly.id, 'investigate')}
                        />
                        <ActionButton
                          label="Pause Ads"
                          loadingLabel="Pausing..."
                          doneLabel="Ads Paused"
                          status={getActionStatus(anomaly.id, 'pause-ads')}
                          onClick={() => handleAction(anomaly.id, 'pause-ads')}
                        />
                        {anomaly.type === 'bot' && (
                          <ActionButton
                            label="Block IPs"
                            loadingLabel="Blocking..."
                            doneLabel="3 IPs Blocked"
                            status={getActionStatus(anomaly.id, 'block-ips')}
                            onClick={() => handleAction(anomaly.id, 'block-ips')}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* Weekly Pattern Heatmap */}
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

            {/* AI Analysis Card */}
            <div className="bg-surface-1 border border-border rounded-card p-5 pollock-glow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-paint-yellow/10 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F0B90B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                    <line x1="9" y1="21" x2="15" y2="21" />
                    <line x1="10" y1="24" x2="14" y2="24" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-text-primary font-headline">AI Analysis</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-paint-yellow/10 text-paint-yellow font-medium ml-auto">Live</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-surface-0/50 border border-border/50">
                  <p className="text-[13px] text-text-primary leading-relaxed">
                    <span className="text-paint-yellow font-bold">Pattern match:</span>{' '}
                    Current spike correlates with Instagram story posted at 1:45 PM. Similar pattern seen on Friday (+318% deviation at same hour).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-0/50 border border-border/50">
                  <p className="text-[13px] text-text-primary leading-relaxed">
                    <span className="text-paint-green font-bold">Signal:</span>{' '}
                    Order source analysis shows 73% organic traffic (not bot). Average order value $42.50 matches store baseline. Low fraud risk.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-0/50 border border-border/50">
                  <p className="text-[13px] text-text-primary leading-relaxed">
                    <span className="text-[#448AFF] font-bold">Recommendation:</span>{' '}
                    Monitor for 30 min before pausing ad spend. If volume sustains above 3x baseline past 3:00 PM, consider enabling rate limiting. Revenue impact: +$2,100 estimated this hour.
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-text-tertiary">Confidence</span>
                  <span className="text-[11px] font-mono font-bold text-paint-green">87%</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-paint-green rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-1 border border-border rounded-lg p-3 pollock-glow">
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Anomalies Today</p>
                <p className="text-2xl font-black font-mono text-paint-red">1</p>
              </div>
              <div className="bg-surface-1 border border-border rounded-lg p-3 pollock-glow">
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">7-Day Total</p>
                <p className="text-2xl font-black font-mono text-[#FFB224]">4</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
