import React, { useState, useMemo, useRef } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import KPICard from '../components/KPICard'
import DataTable, { Column } from '../components/DataTable'
import Badge from '../components/ui/Badge'
import { formatCurrency } from '../lib/utils'

// --- Mock Data Generator ---
function generateMockRevenue(days: number): { date: string; revenue: number }[] {
  const data: { date: string; revenue: number }[] = []
  const now = new Date()
  const baseRevenue = 1800
  const dailyGrowth = 12
  const weeklyAmplitude = 350

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const trendComponent = baseRevenue + dailyGrowth * (days - i)
    const weekdayBoost = dayOfWeek === 0 || dayOfWeek === 6 ? -weeklyAmplitude : 0
    const midweekPeak = dayOfWeek === 3 ? weeklyAmplitude * 0.6 : 0
    const noise = (Math.sin(i * 2.7) * 180) + (Math.cos(i * 1.3) * 120)
    const revenue = Math.max(400, trendComponent + weekdayBoost + midweekPeak + noise)

    data.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.round(revenue * 100) / 100,
    })
  }
  return data
}

// --- Linear Regression ---
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n

  let ssXY = 0
  let ssXX = 0
  let ssTot = 0
  let ssRes = 0

  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (values[i] - yMean)
    ssXX += (i - xMean) ** 2
  }

  const slope = ssXY / ssXX
  const intercept = yMean - slope * xMean

  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i
    ssRes += (values[i] - predicted) ** 2
    ssTot += (values[i] - yMean) ** 2
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  return { slope, intercept, r2 }
}

// --- Projection ---
function projectRevenue(
  historical: { date: string; revenue: number }[],
  daysForward: number
): { date: string; revenue: number; cumulative: number; confidence: 'High' | 'Medium' | 'Low' }[] {
  const values = historical.map((d) => d.revenue)
  const { slope, intercept } = linearRegression(values)
  const n = values.length
  const lastDate = new Date(historical[n - 1].date)

  const projections: { date: string; revenue: number; cumulative: number; confidence: 'High' | 'Medium' | 'Low' }[] = []
  let cumulative = 0

  for (let i = 1; i <= daysForward; i++) {
    const d = new Date(lastDate)
    d.setDate(d.getDate() + i)
    const dayOfWeek = d.getDay()
    const baseProjection = intercept + slope * (n - 1 + i)
    const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? -280 : 0
    const midweekPeak = dayOfWeek === 3 ? 180 : 0
    const revenue = Math.max(200, Math.round((baseProjection + weekendDip + midweekPeak) * 100) / 100)
    cumulative += revenue

    let confidence: 'High' | 'Medium' | 'Low'
    if (i <= 7) confidence = 'High'
    else if (i <= 14) confidence = 'Medium'
    else confidence = 'Low'

    projections.push({
      date: d.toISOString().split('T')[0],
      revenue,
      cumulative: Math.round(cumulative * 100) / 100,
      confidence,
    })
  }

  return projections
}

// --- Custom Dual-Line SVG Chart ---
function ForecastChart({
  historical,
  projected,
  hoveredIndex,
  onHover,
}: {
  historical: { date: string; revenue: number }[]
  projected: { date: string; revenue: number }[]
  hoveredIndex: number | null
  onHover: (index: number | null) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const allData = [...historical, ...projected]
  const allValues = allData.map((d) => d.revenue)
  const min = Math.min(...allValues) * 0.85
  const max = Math.max(...allValues) * 1.1
  const range = max - min || 1

  const width = 900
  const height = 320
  const padding = { top: 20, right: 24, bottom: 44, left: 60 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const totalPoints = allData.length
  const dividerIndex = historical.length - 1

  const points = allData.map((d, i) => ({
    x: padding.left + (i / (totalPoints - 1)) * chartW,
    y: padding.top + chartH - ((d.revenue - min) / range) * chartH,
  }))

  function buildPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return ''
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
    }
    return d
  }

  const historicalPoints = points.slice(0, dividerIndex + 1)
  const projectedPoints = points.slice(dividerIndex)

  const historicalPath = buildPath(historicalPoints)
  const projectedPath = buildPath(projectedPoints)

  // Area fill for historical
  const areaPath = historicalPath
    ? `${historicalPath} L ${historicalPoints[historicalPoints.length - 1].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${historicalPoints[0].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`
    : ''

  // Divider X position
  const dividerX = points[dividerIndex]?.x ?? 0

  // Grid lines (5 horizontal)
  const gridCount = 5
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const pct = (i + 1) / (gridCount + 1)
    const y = padding.top + chartH * (1 - pct)
    const value = min + range * pct
    return { y, value }
  })

  // X-axis labels
  const labelStep = Math.max(1, Math.floor(totalPoints / 8))

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0B90B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F0B90B" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="projectedAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E676" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#00E676" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={g.y}
            x2={width - padding.right}
            y2={g.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={g.y + 4}
            textAnchor="end"
            fill="rgba(255,255,255,0.25)"
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
          >
            ${(g.value / 1000).toFixed(1)}k
          </text>
        </g>
      ))}

      {/* Historical area fill */}
      {areaPath && <path d={areaPath} fill="url(#forecastAreaGrad)" />}

      {/* Historical line (solid, yellow) */}
      <path
        d={historicalPath}
        fill="none"
        stroke="#F0B90B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Projected line (dashed, green) */}
      <path
        d={projectedPath}
        fill="none"
        stroke="#00E676"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8,5"
      />

      {/* Today divider */}
      <line
        x1={dividerX}
        y1={padding.top}
        x2={dividerX}
        y2={padding.top + chartH}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      <rect
        x={dividerX - 24}
        y={padding.top - 2}
        width="48"
        height="16"
        rx="4"
        fill="#1F1F1F"
      />
      <text
        x={dividerX}
        y={padding.top + 10}
        textAnchor="middle"
        fill="rgba(255,255,255,0.6)"
        fontSize="9"
        fontWeight="500"
      >
        TODAY
      </text>

      {/* Legend */}
      <g transform={`translate(${padding.left + 4}, ${height - 10})`}>
        <line x1="0" y1="0" x2="20" y2="0" stroke="#F0B90B" strokeWidth="2.5" />
        <text x="26" y="4" fill="rgba(255,255,255,0.5)" fontSize="10">Historical</text>
        <line x1="100" y1="0" x2="120" y2="0" stroke="#00E676" strokeWidth="2" strokeDasharray="6,4" />
        <text x="126" y="4" fill="rgba(255,255,255,0.5)" fontSize="10">Projected</text>
      </g>

      {/* X-axis labels */}
      {allData.map((d, i) =>
        i % labelStep === 0 || i === totalPoints - 1 ? (
          <text
            key={i}
            x={points[i].x}
            y={height - 22}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        ) : null
      )}

      {/* Hover zones */}
      {points.map((p, i) => (
        <rect
          key={i}
          x={i === 0 ? padding.left : (points[Math.max(i - 1, 0)].x + p.x) / 2}
          y={padding.top}
          width={chartW / totalPoints}
          height={chartH}
          fill="transparent"
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
        />
      ))}

      {/* Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <g>
          <line
            x1={points[hoveredIndex].x}
            y1={padding.top}
            x2={points[hoveredIndex].x}
            y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <circle
            cx={points[hoveredIndex].x}
            cy={points[hoveredIndex].y}
            r="5"
            fill={hoveredIndex <= dividerIndex ? '#F0B90B' : '#00E676'}
            stroke="#0D0D0D"
            strokeWidth="2"
          />
          <rect
            x={points[hoveredIndex].x - 50}
            y={points[hoveredIndex].y - 36}
            width="100"
            height="26"
            rx="6"
            fill="#222225"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <text
            x={points[hoveredIndex].x}
            y={points[hoveredIndex].y - 19}
            textAnchor="middle"
            fill="rgba(255,255,255,0.95)"
            fontSize="11"
            fontWeight="600"
            fontFamily="JetBrains Mono, monospace"
          >
            ${allData[hoveredIndex].revenue.toLocaleString()}
          </text>
        </g>
      )}
    </svg>
  )
}

// --- Page Component ---
export default function ForecastPage() {
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null)
  const [tablePage, setTablePage] = useState(1)
  const rowsPerPage = 10

  const historical = useMemo(() => generateMockRevenue(90), [])
  const projections = useMemo(() => projectRevenue(historical, 30), [historical])

  const regression = useMemo(() => {
    return linearRegression(historical.map((d) => d.revenue))
  }, [historical])

  // KPI calculations
  const projected30dRevenue = projections.reduce((sum, p) => sum + p.revenue, 0)
  const historicalLast30 = historical.slice(-30).reduce((sum, d) => sum + d.revenue, 0)
  const growthRate = ((projected30dRevenue - historicalLast30) / historicalLast30) * 100
  const dailyAvg = projected30dRevenue / 30

  // Summary sentence
  const growthDirection = growthRate >= 0 ? 'grow' : 'decline'
  const absGrowth = Math.abs(growthRate).toFixed(1)

  // Table data
  const tableData = projections.map((p, i) => ({
    id: i,
    date: new Date(p.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    revenue: p.revenue,
    cumulative: p.cumulative,
    confidence: p.confidence,
  }))

  const pagedData = tableData.slice((tablePage - 1) * rowsPerPage, tablePage * rowsPerPage)
  const totalPages = Math.ceil(tableData.length / rowsPerPage)

  const columns: Column[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: false,
      render: (val: string) => (
        <span className="text-text-primary text-sm">{val}</span>
      ),
    },
    {
      key: 'revenue',
      label: 'Projected Revenue',
      sortable: false,
      render: (val: number) => (
        <span className="font-mono text-sm text-paint-green font-medium">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'cumulative',
      label: 'Cumulative',
      sortable: false,
      render: (val: number) => (
        <span className="font-mono text-sm text-text-secondary">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'confidence',
      label: 'Confidence',
      sortable: false,
      render: (val: string) => {
        const variant =
          val === 'High' ? 'success' : val === 'Medium' ? 'warning' : 'error'
        return <Badge variant={variant as any}>{val}</Badge>
      },
    },
  ]

  return (
    <Shell title="Revenue Forecast">
      <div className="space-y-6">
        {/* AI Summary Card */}
        <div className="bg-surface-1 border border-border rounded-card p-6 pollock-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-paint-yellow to-transparent opacity-60" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-paint-yellow/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z"
                  fill="#F0B90B"
                  fillOpacity="0.9"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-label text-paint-yellow">AI Forecast</span>
                <span className="text-xs text-text-tertiary">Based on 90 days of data</span>
              </div>
              <p className="text-text-primary text-base leading-relaxed">
                Your store is projected to generate{' '}
                <span className="font-mono font-bold text-paint-yellow">
                  {formatCurrency(projected30dRevenue)}
                </span>{' '}
                in the next 30 days, a{' '}
                <span
                  className={`font-mono font-bold ${
                    growthRate >= 0 ? 'text-paint-green' : 'text-paint-red'
                  }`}
                >
                  {absGrowth}% {growthDirection}
                </span>{' '}
                from the previous period. Daily revenue averages{' '}
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrency(dailyAvg)}
                </span>
                {growthRate > 5
                  ? '. Momentum is strong — consider scaling ad spend to capture this wave.'
                  : growthRate > 0
                  ? '. Steady growth. Maintain current strategy and optimize conversion rates.'
                  : '. Revenue is softening. Consider launching a promotion or re-engagement campaign.'}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-paint-green" />
                  <span className="text-xs text-text-tertiary">
                    R² = {regression.r2.toFixed(3)} model fit
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-paint-yellow" />
                  <span className="text-xs text-text-tertiary">
                    +{formatCurrency(regression.slope)}/day trend
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Projected 30-Day Revenue"
            value={formatCurrency(projected30dRevenue)}
            change={growthRate}
          />
          <KPICard
            title="Monthly Growth Rate"
            value={`${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}`}
            suffix="%"
            change={growthRate}
          />
          <KPICard
            title="Projected Daily Average"
            value={formatCurrency(dailyAvg)}
            change={((dailyAvg - historicalLast30 / 30) / (historicalLast30 / 30)) * 100}
          />
        </div>

        {/* Forecast Chart */}
        <Card title="Revenue Trend & 30-Day Forecast" subtitle="Linear regression with weekly seasonality adjustment">
          <ForecastChart
            historical={historical}
            projected={projections}
            hoveredIndex={hoveredChartIndex}
            onHover={setHoveredChartIndex}
          />
        </Card>

        {/* Daily Projections Table */}
        <Card title="Daily Revenue Projections" subtitle="Next 30 days breakdown">
          <DataTable
            columns={columns}
            data={pagedData}
            page={tablePage}
            totalPages={totalPages}
            onPageChange={setTablePage}
          />
        </Card>
      </div>
    </Shell>
  )
}
