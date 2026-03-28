import React, { useMemo, useState, useCallback } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import DataTable, { Column } from '../components/DataTable'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import DonutChart from '../components/charts/DonutChart'
import { api } from '../lib/api'

/* ─── Types ─── */
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
type FilterKey = 'All' | SegmentKey

type ActionState = 'idle' | 'executing' | 'success' | 'failed'

/* ─── Constants ─── */
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

const SEGMENT_CONFIG: Record<SegmentKey, { icon: string; actionLabel: string; actionKey: string; description: string }> = {
  Champions: { icon: '\u2605', actionLabel: 'Reward', actionKey: 'vip', description: 'VIP 25% discount' },
  Loyal: { icon: '\u2665', actionLabel: 'Engaged', actionKey: 'loyal', description: 'No action needed' },
  'At Risk': { icon: '\u26A0', actionLabel: 'Win Back', actionKey: 'winback', description: '15% win-back email' },
  Lost: { icon: '\u2620', actionLabel: 'Reactivate', actionKey: 'reactivate', description: '20% + email' },
}

const FILTER_TABS: FilterKey[] = ['All', 'Champions', 'Loyal', 'At Risk', 'Lost']

/* ─── RFM Scoring ─── */
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

function generateDiscountCode(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${rand}`
}

/* ─── Mock Data ─── */
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

/* ─── Spinner SVG ─── */
function Spinner({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ─── Action Button with states ─── */
function ActionBtn({
  state,
  label,
  onClick,
  variant = 'ghost',
  size = 'sm',
  className = '',
}: {
  state: ActionState
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  className?: string
}) {
  if (state === 'executing') {
    return (
      <Button variant="ghost" size={size} disabled className={`${className} opacity-60`}>
        <Spinner className="h-3 w-3 mr-1.5" />
        Sending...
      </Button>
    )
  }
  if (state === 'success') {
    return (
      <Button variant="ghost" size={size} disabled className={`${className} !text-[#00E676]`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Sent
      </Button>
    )
  }
  if (state === 'failed') {
    return (
      <Button variant="ghost" size={size} disabled className={`${className} !text-[#FF3D57]`}>
        Failed
      </Button>
    )
  }
  return (
    <Button variant={variant} size={size} onClick={onClick} className={className}>
      {label}
    </Button>
  )
}

/* ─── Main Page ─── */
export default function SegmentsPage() {
  const customers = MOCK_CUSTOMERS

  const [activeFilter, setActiveFilter] = useState<FilterKey>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({})

  const setActionState = useCallback((key: string, state: ActionState) => {
    setActionStates((prev) => ({ ...prev, [key]: state }))
    if (state === 'success' || state === 'failed') {
      setTimeout(() => {
        setActionStates((prev) => ({ ...prev, [key]: 'idle' }))
      }, 2500)
    }
  }, [])

  /* ─── Action handlers ─── */
  const handleWinBackEmail = useCallback(async (customer: RFMCustomer) => {
    const key = `winback-${customer.id}`
    setActionState(key, 'executing')
    try {
      await api.sendEmail(
        customer.email,
        'We miss you! Here\'s 15% off your next order',
        `<h2>Hey ${customer.name.split(' ')[0]}, we noticed you haven't visited in a while.</h2><p>Here's a special 15% discount just for you. Use code <strong>WINBACK15</strong> at checkout.</p>`
      )
      setActionState(key, 'success')
    } catch {
      setActionState(key, 'failed')
    }
  }, [setActionState])

  const handleReactivationOffer = useCallback(async (customer: RFMCustomer) => {
    const key = `reactivate-${customer.id}`
    setActionState(key, 'executing')
    try {
      const code = generateDiscountCode('COMEBACK')
      await api.createDiscount(code, 20)
      await api.sendEmail(
        customer.email,
        'Come back! 20% off + free shipping awaits',
        `<h2>We want you back, ${customer.name.split(' ')[0]}!</h2><p>Use code <strong>${code}</strong> for 20% off your next order. We've been adding amazing new products since your last visit.</p>`
      )
      setActionState(key, 'success')
    } catch {
      setActionState(key, 'failed')
    }
  }, [setActionState])

  const handleVIPReward = useCallback(async (customer: RFMCustomer) => {
    const key = `vip-${customer.id}`
    setActionState(key, 'executing')
    try {
      const code = generateDiscountCode('VIP')
      await api.createDiscount(code, 25)
      await api.sendEmail(
        customer.email,
        'Exclusive VIP Reward: 25% off for our top customer',
        `<h2>Thank you, ${customer.name.split(' ')[0]}!</h2><p>As one of our most valued customers, enjoy an exclusive <strong>25% VIP discount</strong> with code <strong>${code}</strong>. You deserve it!</p>`
      )
      setActionState(key, 'success')
    } catch {
      setActionState(key, 'failed')
    }
  }, [setActionState])

  const handleBulkAction = useCallback(async (segment: SegmentKey) => {
    const key = `bulk-${segment}`
    setActionState(key, 'executing')
    const segmentCustomers = customers.filter((c) => c.segment === segment)
    try {
      if (segment === 'At Risk') {
        for (const c of segmentCustomers) {
          await api.sendEmail(
            c.email,
            'We miss you! Here\'s 15% off your next order',
            `<h2>Hey ${c.name.split(' ')[0]}, we noticed you haven't visited in a while.</h2><p>Use code <strong>WINBACK15</strong> at checkout for 15% off.</p>`
          )
        }
      } else if (segment === 'Lost') {
        const code = generateDiscountCode('COMEBACK')
        await api.createDiscount(code, 20)
        for (const c of segmentCustomers) {
          await api.sendEmail(
            c.email,
            'Come back! 20% off + free shipping awaits',
            `<h2>We want you back, ${c.name.split(' ')[0]}!</h2><p>Use code <strong>${code}</strong> for 20% off.</p>`
          )
        }
      } else if (segment === 'Champions') {
        const code = generateDiscountCode('VIP')
        await api.createDiscount(code, 25)
        for (const c of segmentCustomers) {
          await api.sendEmail(
            c.email,
            'Exclusive VIP Reward: 25% off for our top customer',
            `<h2>Thank you, ${c.name.split(' ')[0]}!</h2><p>Enjoy <strong>25% off</strong> with code <strong>${code}</strong>.</p>`
          )
        }
      }
      setActionState(key, 'success')
    } catch {
      setActionState(key, 'failed')
    }
  }, [customers, setActionState])

  const handleSendAllAtRisk = useCallback(async () => {
    const atRisk = customers.filter((c) => c.segment === 'At Risk')
    const lost = customers.filter((c) => c.segment === 'Lost')
    const all = [...atRisk, ...lost]
    const key = 'bulk-all-urgent'
    setActionState(key, 'executing')
    try {
      const code = generateDiscountCode('WINALL')
      await api.createDiscount(code, 15)
      for (const c of all) {
        await api.sendEmail(
          c.email,
          'We miss you! Come back with 15% off',
          `<h2>Hey ${c.name.split(' ')[0]}, we want you back!</h2><p>Use code <strong>${code}</strong> for 15% off your next order.</p>`
        )
      }
      setActionState(key, 'success')
    } catch {
      setActionState(key, 'failed')
    }
  }, [customers, setActionState])

  /* ─── Computed ─── */
  const segmentCounts = useMemo(() => {
    const counts: Record<SegmentKey, number> = { Champions: 0, Loyal: 0, 'At Risk': 0, Lost: 0 }
    customers.forEach((c) => { counts[c.segment as SegmentKey]++ })
    return counts
  }, [customers])

  const segmentAvgSpend = useMemo(() => {
    const sums: Record<SegmentKey, number> = { Champions: 0, Loyal: 0, 'At Risk': 0, Lost: 0 }
    customers.forEach((c) => { sums[c.segment as SegmentKey] += c.total_spent })
    return Object.fromEntries(
      (Object.keys(sums) as SegmentKey[]).map((k) => [k, segmentCounts[k] > 0 ? Math.round(sums[k] / segmentCounts[k]) : 0])
    ) as Record<SegmentKey, number>
  }, [customers, segmentCounts])

  const urgentCount = segmentCounts['At Risk'] + segmentCounts['Lost']

  const filteredCustomers = useMemo(() => {
    let result = customers
    if (activeFilter !== 'All') {
      result = result.filter((c) => c.segment === activeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    }
    return result
  }, [customers, activeFilter, searchQuery])

  const donutSegments = useMemo(() => {
    return (Object.keys(SEGMENT_COLORS) as SegmentKey[]).map((key) => ({
      label: key,
      value: segmentCounts[key],
      color: SEGMENT_COLORS[key],
    }))
  }, [segmentCounts])

  const totalCustomers = customers.length

  /* ─── Table columns ─── */
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
      key: 'orders_count',
      label: 'ORDERS',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-text-primary">{value}</span>
      ),
    },
    {
      key: 'total_spent',
      label: 'SPENT',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-sm text-[#00E676]">
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'last_order_days_ago',
      label: 'LAST ORDER',
      sortable: true,
      render: (value: number) => (
        <span className={`font-mono text-sm ${value > 45 ? 'text-[#FF3D57]' : value > 20 ? 'text-[#FF9100]' : 'text-text-secondary'}`}>
          {value}d ago
        </span>
      ),
    },
    {
      key: 'id',
      label: 'ACTION',
      sortable: false,
      render: (_value: string, row: RFMCustomer) => {
        const segment = row.segment as SegmentKey
        if (segment === 'At Risk') {
          return (
            <ActionBtn
              state={actionStates[`winback-${row.id}`] || 'idle'}
              label="Win Back"
              onClick={() => handleWinBackEmail(row)}
              className="!text-[#FF9100] hover:!bg-[#FF9100]/10"
            />
          )
        }
        if (segment === 'Lost') {
          return (
            <ActionBtn
              state={actionStates[`reactivate-${row.id}`] || 'idle'}
              label="Reactivate"
              onClick={() => handleReactivationOffer(row)}
              className="!text-[#FF3D57] hover:!bg-[#FF3D57]/10"
            />
          )
        }
        if (segment === 'Champions') {
          return (
            <ActionBtn
              state={actionStates[`vip-${row.id}`] || 'idle'}
              label="Reward"
              onClick={() => handleVIPReward(row)}
              className="!text-[#F0B90B] hover:!bg-[#F0B90B]/10"
            />
          )
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs text-[#448AFF]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Engaged
          </span>
        )
      },
    },
  ]

  /* ─── Render ─── */
  return (
    <Shell title="Segments">
      <div className="space-y-5">

        {/* ─── 1. Action-oriented Hero ─── */}
        <div className="relative overflow-hidden border border-[#FF9100]/30 rounded-xl bg-gradient-to-r from-[#FF9100]/8 via-[#FF3D57]/5 to-transparent p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#FF9100]/15 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary font-headline">
                  {urgentCount} customers at risk of churning
                  <span className="text-text-tertiary font-normal"> — send win-back emails now</span>
                </h2>
                <p className="text-xs text-text-secondary mt-1.5 max-w-xl">
                  {segmentCounts['At Risk']} at-risk + {segmentCounts['Lost']} lost customers haven't ordered in 45+ days.
                  Potential recovery: <span className="font-mono text-[#00E676]">${Math.round(customers.filter(c => c.segment === 'At Risk' || c.segment === 'Lost').reduce((s, c) => s + c.total_spent * 0.15, 0)).toLocaleString()}</span> in revenue.
                </p>
              </div>
            </div>
            <ActionBtn
              state={actionStates['bulk-all-urgent'] || 'idle'}
              label={`Send All (${urgentCount})`}
              onClick={handleSendAllAtRisk}
              variant="primary"
              size="md"
              className="flex-shrink-0 !px-5"
            />
          </div>
        </div>

        {/* ─── 2. Segment Cards Row ─── */}
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(SEGMENT_COLORS) as SegmentKey[]).map((segment) => {
            const count = segmentCounts[segment]
            const avgSpend = segmentAvgSpend[segment]
            const config = SEGMENT_CONFIG[segment]
            const isActive = activeFilter === segment
            const isLoyal = segment === 'Loyal'

            return (
              <div
                key={segment}
                onClick={() => setActiveFilter(isActive ? 'All' : segment)}
                className={`text-left bg-surface-1 border rounded-xl p-4 transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'border-white/20 ring-1 ring-white/10'
                    : 'border-border hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: SEGMENT_COLORS[segment] }}
                    />
                    <span className="text-xs font-medium text-text-secondary font-headline uppercase tracking-wider">{segment}</span>
                  </div>
                  <span className="text-lg font-bold text-text-primary font-mono">{count}</span>
                </div>
                <div className="text-xs text-text-tertiary font-mono mb-3">
                  avg <span className="text-text-secondary">${avgSpend.toLocaleString()}</span>/customer
                </div>
                {isLoyal ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#448AFF]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Engaged
                  </div>
                ) : (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ActionBtn
                      state={actionStates[`bulk-${segment}`] || 'idle'}
                      label={config.actionLabel}
                      onClick={() => handleBulkAction(segment)}
                      className="!px-2.5 !py-1 !text-xs w-full justify-center"
                      variant="secondary"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ─── 3. Two-column: Donut + Customer Table ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Left: Donut Chart (2/5 width) */}
          <Card className="lg:col-span-2 flex flex-col" title="Distribution" subtitle="RFM segmentation">
            <div className="flex justify-center py-2">
              <DonutChart
                segments={donutSegments}
                size={180}
                thickness={24}
                centerValue={String(totalCustomers)}
                centerLabel="Customers"
              />
            </div>
            {/* Compact legend with stats */}
            <div className="mt-3 space-y-2">
              {(Object.keys(SEGMENT_COLORS) as SegmentKey[]).map((segment) => {
                const count = segmentCounts[segment]
                const pct = Math.round((count / totalCustomers) * 100)
                return (
                  <button
                    key={segment}
                    onClick={() => setActiveFilter(activeFilter === segment ? 'All' : segment)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors duration-150 ${
                      activeFilter === segment ? 'bg-surface-2' : 'hover:bg-surface-2/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[segment] }} />
                      <span className="text-xs text-text-secondary">{segment}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-text-primary font-medium">{count}</span>
                      <span className="text-xs font-mono text-text-tertiary w-8 text-right">{pct}%</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Right: Customer Table (3/5 width) */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Filter tabs + Search */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-lg p-0.5">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilter === tab
                  const count = tab === 'All' ? totalCustomers : segmentCounts[tab as SegmentKey]
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-surface-2 text-text-primary'
                          : 'text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {tab !== 'All' && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[tab as SegmentKey] }} />
                      )}
                      {tab}
                      <span className={`font-mono text-[10px] ${isActive ? 'text-text-secondary' : 'text-text-tertiary'}`}>{count}</span>
                    </button>
                  )
                })}
              </div>
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-1 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-paint-yellow/50 w-44 transition-colors duration-150"
                />
              </div>
            </div>

            {/* Table */}
            <Card className="flex-1">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-text-tertiary">No customers match your filters.</p>
                </div>
              ) : (
                <DataTable columns={columns} data={filteredCustomers} />
              )}
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  )
}
