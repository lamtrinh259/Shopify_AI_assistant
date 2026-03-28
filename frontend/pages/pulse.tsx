import React, { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import HealthScore from '../components/health-score'
import ScoreBreakdown from '../components/score-breakdown'
import PulseKPIs, { MOCK_KPI_DATA } from '../components/pulse-kpis'
import AlertFeed, { generateMockAlerts } from '../components/alert-feed'
import ActionPanel from '../components/action-panel'
import LangToggle from '../components/lang-toggle'
import LiveFeed from '../components/LiveFeed'
import AiChat from '../components/ai-chat'
import LineChart from '../components/charts/LineChart'
import { useTranslation } from '../lib/i18n'
import {
  calculateHealthScore,
  getScoreLabel,
  getScoreColor,
  MOCK_STORE_DATA,
} from '../lib/health-algorithm'
import { useApi } from '../hooks/useApi'
import { useRevenue } from '../hooks/useAnalytics'
import { useSimulator } from '../hooks/useSimulator'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import type { LiveEvent, RevenueDataPoint } from '../lib/types'

// Mock events will be generated client-side with relative timestamps
function generateMockEvents(): LiveEvent[] {
  const now = Date.now()
  return [
    { id: 'p1', event_type: 'new_order', payload: { order_number: '1042', total_price: 259.99 }, created_at: new Date(now - 45000).toISOString() },
    { id: 'p2', event_type: 'customer_created', payload: { email: 'sarah@example.com' }, created_at: new Date(now - 120000).toISOString() },
    { id: 'p3', event_type: 'new_order', payload: { order_number: '1041', total_price: 149.50 }, created_at: new Date(now - 240000).toISOString() },
    { id: 'p4', event_type: 'inventory_change', payload: { product_title: 'Complete Snowboard' }, created_at: new Date(now - 360000).toISOString() },
    { id: 'p5', event_type: 'new_order', payload: { order_number: '1040', total_price: 89.99 }, created_at: new Date(now - 540000).toISOString() },
  ]
}

function generateMockRevenue(): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = []
  const anchor = new Date('2026-03-28T00:00:00Z')
  // More interesting curve: dip midweek, strong weekend
  const revenuePattern = [3800, 3200, 2900, 3100, 4200, 5100, 4800]
  const orderPattern = [22, 18, 16, 17, 25, 32, 28]
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor)
    d.setDate(d.getDate() - i)
    const base = revenuePattern[6 - i]
    const orders = orderPattern[6 - i]
    data.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.round(base * 100) / 100,
      orders,
      aov: Math.round((base / orders) * 100) / 100,
    })
  }
  return data
}

const MOCK_REVENUE = generateMockRevenue()

export default function PulsePage() {
  const { t, lang, setLang } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [mockEvents, setMockEvents] = useState<LiveEvent[]>([])

  // Try to fetch real data, fall back to mock
  const { data: storeData, error: storeError } = useApi(() => api.getStore(), [])
  const { data: revenueData, error: revenueError } = useRevenue('7d')

  const isMock = !!(storeError || revenueError)

  // Live event simulator
  const simulator = useSimulator(6000, 30)

  // Generate initial mock events + start loading
  useEffect(() => {
    setMockEvents(generateMockEvents())
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Calculate health score
  const breakdown = calculateHealthScore(MOCK_STORE_DATA)
  const scoreLabel = t(getScoreLabel(breakdown.total))

  const revenue = revenueData?.series || MOCK_REVENUE
  const alerts = generateMockAlerts(t)

  // Live KPI data from simulator
  const liveKpiData = {
    ...MOCK_KPI_DATA,
    todayRevenue: simulator.totalRevenue,
    ordersToday: simulator.totalOrders,
    activeCustomers: simulator.totalCustomers,
    avgOrderValue: simulator.totalOrders > 0 ? Math.round((simulator.totalRevenue / simulator.totalOrders) * 100) / 100 : 186.09,
  }

  // Merge simulator events with initial mock events
  const allEvents = simulator.events.length > 0
    ? simulator.events
    : (mockEvents.length > 0 ? mockEvents : undefined)

  const scoreColor = getScoreColor(breakdown.total)

  return (
    <Shell title="Store Pulse">
      {/* HERO HEADER — dramatic gradient banner */}
      <div className="relative rounded-card overflow-hidden mb-6 stagger-1" style={{
        background: `linear-gradient(135deg, ${scoreColor}15 0%, transparent 50%, #161616 100%)`,
        border: `1px solid ${scoreColor}30`,
      }}>
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Mini health gauge */}
            <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#1F1F1F" strokeWidth="5"
                  strokeDasharray={`${Math.PI * 60 * 0.75} ${Math.PI * 60 * 0.25}`}
                  strokeLinecap="round" transform="rotate(135 36 36)" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor} strokeWidth="5"
                  strokeDasharray={`${Math.PI * 60 * 0.75} ${Math.PI * 60 * 0.25}`}
                  strokeDashoffset={Math.PI * 60 * 0.75 * (1 - breakdown.total / 10)}
                  strokeLinecap="round" transform="rotate(135 36 36)"
                  style={{ filter: `drop-shadow(0 0 6px ${scoreColor}60)` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold font-mono" style={{ color: scoreColor }}>{breakdown.total.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-text-primary font-headline tracking-tight">
                  {t('storePulse')}
                </h2>
                <span className="text-xs text-paint-yellow px-2.5 py-1 bg-paint-yellow/10 rounded-full font-mono font-bold border border-paint-yellow/20">
                  AI CEO
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                {breakdown.total >= 7
                  ? '🟢 Your store is performing well. Keep monitoring.'
                  : breakdown.total >= 5
                  ? '🟡 Fair performance. Some areas need attention.'
                  : '🔴 Critical issues detected. Take action now.'}
              </p>
            </div>
          </div>
          <LangToggle lang={lang} onToggle={setLang} />
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6">
        <PulseKPIs data={liveKpiData} t={t} loading={loading} />
      </div>

      {/* Row 1: Health Score + Alerts + Live Feed */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* Health Score + Breakdown */}
        <div className="col-span-4 stagger-2">
          <Card className="h-full">
            <h3 className="text-sm font-semibold text-text-primary font-headline mb-3">{t('healthScore')}</h3>
            <HealthScore score={breakdown.total} label={scoreLabel} loading={loading} />
            <div className="border-t border-border pt-4 mt-2">
              <h4 className="text-label mb-3">{t('scoreBreakdown')}</h4>
              <ScoreBreakdown breakdown={breakdown} t={t} loading={loading} />
            </div>
          </Card>
        </div>

        {/* Smart Alerts */}
        <div className="col-span-5 stagger-3">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary font-headline">{t('smartAlerts')}</h3>
              <span className="text-xs font-mono font-bold text-paint-red px-2 py-0.5 bg-paint-red/10 rounded-full border border-paint-red/20">
                {alerts.length} active
              </span>
            </div>
            <AlertFeed alerts={alerts} t={t} loading={loading} />
          </Card>
        </div>

        {/* Live Feed */}
        <div className="col-span-3 stagger-4">
          <Card className="h-full">
            <LiveFeed maxEvents={10} mockEvents={allEvents} />
          </Card>
        </div>
      </div>

      {/* Row 2: AI Chat + Revenue */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* AI Chat — moved up, more prominent */}
        <div className="col-span-5 stagger-5">
          <Card className="h-full border-paint-purple/15" style={{ background: 'linear-gradient(180deg, #1a1625 0%, #161616 100%)' }}>
            <AiChat t={t} />
          </Card>
        </div>

        {/* Revenue + Actions stacked */}
        <div className="col-span-7 flex flex-col gap-4 stagger-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary font-headline">
                {t('totalRevenue')}
              </h3>
              <span className="text-label">7d</span>
            </div>
            {loading ? (
              <div className="h-[140px] bg-surface-2 rounded animate-pulse" />
            ) : (
              <LineChart
                data={revenue.map((d) => ({
                  label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: d.revenue,
                }))}
                height={140}
                color="#F0B90B"
                showGrid
                showLabels
                showTooltip
              />
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-primary font-headline mb-3">{t('aiActions')}</h3>
            <ActionPanel t={t} loading={loading} />
          </Card>
        </div>
      </div>
    </Shell>
  )
}
