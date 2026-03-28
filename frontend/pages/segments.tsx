import React, { useMemo } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import KPICard from '../components/KPICard'
import DataTable, { Column } from '../components/DataTable'
import Badge from '../components/ui/Badge'
import DonutChart from '../components/charts/DonutChart'

interface RFMCustomer {
  id: string
  name: string
  email: string
  orders_count: number
  total_spent: number
  last_order_days_ago: number
  recency_score: number
  frequency_score: number
  monetary_score: number
  segment: string
}

type SegmentKey = 'Champions' | 'Loyal' | 'At Risk' | 'Lost'

const SEGMENT_COLORS: Record<SegmentKey, string> = {
  Champions: '#F0B90B',
  Loyal: '#448AFF',
  'At Risk': '#FF9100',
  Lost: '#FF3D57',
}

const SEGMENT_BADGE_VARIANT: Record<SegmentKey, 'success' | 'warning' | 'error' | 'neutral'> = {
  Champions: 'success',
  Loyal: 'neutral',
  'At Risk': 'warning',
  Lost: 'error',
}

function scoreRFM(value: number, thresholds: [number, number, number, number]): number {
  if (value <= thresholds[0]) return 1
  if (value <= thresholds[1]) return 2
  if (value <= thresholds[2]) return 3
  if (value <= thresholds[3]) return 4
  return 5
}

function scoreRecency(daysAgo: number): number {
  if (daysAgo <= 7) return 5
  if (daysAgo <= 14) return 4
  if (daysAgo <= 30) return 3
  if (daysAgo <= 60) return 2
  return 1
}

function classifySegment(r: number, f: number, m: number): SegmentKey {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions'
  if (r <= 2 && f <= 2) return 'Lost'
  if (r <= 2 && f >= 3) return 'At Risk'
  if (f >= 3 && m >= 3) return 'Loyal'
  return 'Loyal'
}

const MOCK_CUSTOMERS: RFMCustomer[] = [
  { id: '1', name: 'Sofia Martinez', email: 'sofia@example.com', orders_count: 12, total_spent: 2840, last_order_days_ago: 3, recency_score: 5, frequency_score: 5, monetary_score: 5, segment: 'Champions' },
  { id: '2', name: 'James Chen', email: 'james.c@example.com', orders_count: 9, total_spent: 1920, last_order_days_ago: 5, recency_score: 5, frequency_score: 4, monetary_score: 4, segment: 'Champions' },
  { id: '3', name: 'Emma Wilson', email: 'emma.w@example.com', orders_count: 11, total_spent: 3100, last_order_days_ago: 2, recency_score: 5, frequency_score: 5, monetary_score: 5, segment: 'Champions' },
  { id: '4', name: 'Lucas Rivera', email: 'lucas.r@example.com', orders_count: 6, total_spent: 1450, last_order_days_ago: 18, recency_score: 3, frequency_score: 3, monetary_score: 3, segment: 'Loyal' },
  { id: '5', name: 'Aisha Patel', email: 'aisha.p@example.com', orders_count: 7, total_spent: 1680, last_order_days_ago: 22, recency_score: 3, frequency_score: 4, monetary_score: 4, segment: 'Loyal' },
  { id: '6', name: 'Marco Rossi', email: 'marco.r@example.com', orders_count: 5, total_spent: 1200, last_order_days_ago: 12, recency_score: 4, frequency_score: 3, monetary_score: 3, segment: 'Loyal' },
  { id: '7', name: 'Nina Kowalski', email: 'nina.k@example.com', orders_count: 8, total_spent: 890, last_order_days_ago: 55, recency_score: 2, frequency_score: 4, monetary_score: 2, segment: 'At Risk' },
  { id: '8', name: 'David Thompson', email: 'david.t@example.com', orders_count: 6, total_spent: 1340, last_order_days_ago: 48, recency_score: 2, frequency_score: 3, monetary_score: 3, segment: 'At Risk' },
  { id: '9', name: 'Yuki Tanaka', email: 'yuki.t@example.com', orders_count: 5, total_spent: 720, last_order_days_ago: 62, recency_score: 1, frequency_score: 3, monetary_score: 2, segment: 'At Risk' },
  { id: '10', name: 'Chris Baker', email: 'chris.b@example.com', orders_count: 2, total_spent: 180, last_order_days_ago: 90, recency_score: 1, frequency_score: 1, monetary_score: 1, segment: 'Lost' },
  { id: '11', name: 'Laura Kim', email: 'laura.k@example.com', orders_count: 1, total_spent: 95, last_order_days_ago: 120, recency_score: 1, frequency_score: 1, monetary_score: 1, segment: 'Lost' },
  { id: '12', name: 'Tom Nguyen', email: 'tom.n@example.com', orders_count: 2, total_spent: 210, last_order_days_ago: 78, recency_score: 1, frequency_score: 1, monetary_score: 1, segment: 'Lost' },
]

export default function SegmentsPage() {
  const customers = MOCK_CUSTOMERS

  const segmentCounts = useMemo(() => {
    const counts: Record<SegmentKey, number> = { Champions: 0, Loyal: 0, 'At Risk': 0, Lost: 0 }
    customers.forEach((c) => {
      counts[c.segment as SegmentKey]++
    })
    return counts
  }, [customers])

  const donutSegments = useMemo(() => {
    return (Object.keys(SEGMENT_COLORS) as SegmentKey[]).map((key) => ({
      label: key,
      value: segmentCounts[key],
      color: SEGMENT_COLORS[key],
    }))
  }, [segmentCounts])

  const totalCustomers = customers.length
  const avgLTV = useMemo(() => {
    const total = customers.reduce((sum, c) => sum + c.total_spent, 0)
    return (total / totalCustomers).toFixed(0)
  }, [customers, totalCustomers])

  const returningPct = useMemo(() => {
    const returning = customers.filter((c) => c.orders_count > 1).length
    return ((returning / totalCustomers) * 100).toFixed(1)
  }, [customers, totalCustomers])

  const largestSegment = useMemo(() => {
    let max: SegmentKey = 'Champions'
    let maxCount = 0
    ;(Object.keys(segmentCounts) as SegmentKey[]).forEach((key) => {
      if (segmentCounts[key] > maxCount) {
        maxCount = segmentCounts[key]
        max = key
      }
    })
    return max
  }, [segmentCounts])

  const columns: Column[] = [
    {
      key: 'name',
      label: 'CUSTOMER',
      sortable: true,
      render: (value: string, row: RFMCustomer) => (
        <div>
          <div className="text-sm font-medium text-text-primary">{value}</div>
          <div className="text-xs text-text-tertiary">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'segment',
      label: 'SEGMENT',
      sortable: true,
      render: (value: string) => (
        <Badge variant={SEGMENT_BADGE_VARIANT[value as SegmentKey] || 'neutral'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'recency_score',
      label: 'R',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-text-secondary">{value}</span>
      ),
    },
    {
      key: 'frequency_score',
      label: 'F',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-text-secondary">{value}</span>
      ),
    },
    {
      key: 'monetary_score',
      label: 'M',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-text-secondary">{value}</span>
      ),
    },
    {
      key: 'orders_count',
      label: 'ORDERS',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-text-primary">{value}</span>
      ),
    },
    {
      key: 'total_spent',
      label: 'TOTAL SPENT',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-paint-green">
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'last_order_days_ago',
      label: 'LAST ORDER',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-sm text-text-secondary">
          {value}d ago
        </span>
      ),
    },
  ]

  return (
    <Shell title="Segments">
      <div className="space-y-6">
        {/* AI Insight */}
        <div className="bg-paint-yellow/5 border border-paint-yellow/20 rounded-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-paint-yellow/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-paint-yellow">
                <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M3 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary font-headline">
                {segmentCounts['At Risk']} customers at risk of churning
              </p>
              <p className="text-xs text-text-secondary mt-1">
                These customers bought 3+ times but haven't returned in 45+ days. A targeted 15% win-back email could recover ~$
                {Math.round(customers.filter(c => c.segment === 'At Risk').reduce((s, c) => s + c.total_spent * 0.15, 0)).toLocaleString()} in revenue.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Customers" value={totalCustomers} change={8.2} />
          <KPICard title="Avg Lifetime Value" value={avgLTV} prefix="$" change={5.4} />
          <KPICard title="Returning Rate" value={returningPct} suffix="%" change={3.1} />
          <KPICard title="Largest Segment" value={largestSegment} />
        </div>

        {/* Chart + Segment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="RFM Distribution" subtitle="Customer segmentation by value" className="lg:col-span-1 flex flex-col items-center">
            <div className="flex justify-center py-4">
              <DonutChart
                segments={donutSegments}
                size={200}
                thickness={28}
                centerValue={String(totalCustomers)}
                centerLabel="Customers"
              />
            </div>
          </Card>

          <Card title="Segment Breakdown" subtitle="Detailed segment analysis" className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SEGMENT_COLORS) as SegmentKey[]).map((segment) => {
                const count = segmentCounts[segment]
                const pct = ((count / totalCustomers) * 100).toFixed(0)
                const segmentCustomers = customers.filter((c) => c.segment === segment)
                const avgSpent = segmentCustomers.length > 0
                  ? (segmentCustomers.reduce((s, c) => s + c.total_spent, 0) / segmentCustomers.length).toFixed(0)
                  : '0'

                return (
                  <div
                    key={segment}
                    className="bg-surface-0 border border-border rounded-lg p-3 pollock-glow transition-colors duration-150 hover:border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: SEGMENT_COLORS[segment] }}
                        />
                        <span className="text-sm font-medium text-text-primary font-headline">{segment}</span>
                      </div>
                      <span className="text-xs font-mono text-text-tertiary">{pct}%</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-semibold text-text-primary font-mono">{count}</span>
                      <span className="text-xs text-text-secondary font-mono">avg ${avgSpent}</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: SEGMENT_COLORS[segment],
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Customer Table */}
        <Card title="Customer RFM Scores" subtitle="Recency / Frequency / Monetary scores (1-5)">
          <DataTable columns={columns} data={customers} />
        </Card>
      </div>
    </Shell>
  )
}
