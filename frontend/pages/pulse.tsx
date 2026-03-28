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
  MOCK_STORE_DATA,
} from '../lib/health-algorithm'
import { useApi } from '../hooks/useApi'
import { useRevenue } from '../hooks/useAnalytics'
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

  // Generate mock events client-side to avoid hydration mismatch
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

  return (
    <Shell title="Store Pulse">
      {/* Top bar with lang toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-paint-yellow animate-pulse" />
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              {t('storePulse')}
            </h2>
          </div>
          <span className="text-xs text-paint-yellow/70 px-2 py-0.5 bg-paint-yellow/10 rounded-full font-mono font-medium">
            AI CEO
          </span>
        </div>
        <LangToggle lang={lang} onToggle={setLang} />
      </div>

      {/* Mock data banner */}
      {isMock && !loading && (
        <div className="bg-status-warning/5 border border-status-warning/15 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          <span className="text-xs text-status-warning">
            Demo mode — connect backend for live data
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-5">
        <PulseKPIs data={MOCK_KPI_DATA} t={t} loading={loading} />
      </div>

      {/* Row 1: Health Score + Alerts */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Health Score + Breakdown */}
        <div className="col-span-4">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-text-primary">{t('healthScore')}</h3>
              <span className="text-xs text-text-tertiary">{t('storeHealth')}</span>
            </div>
            <HealthScore score={breakdown.total} label={scoreLabel} loading={loading} />
            <div className="border-t border-border pt-4 mt-2">
              <h4 className="text-xs font-medium text-text-secondary mb-3">{t('scoreBreakdown')}</h4>
              <ScoreBreakdown breakdown={breakdown} t={t} loading={loading} />
            </div>
          </Card>
        </div>

        {/* Smart Alerts */}
        <div className="col-span-5">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-primary">{t('smartAlerts')}</h3>
              <span className="text-xs text-text-tertiary px-2 py-0.5 bg-surface-2 rounded-full">
                {alerts.length}
              </span>
            </div>
            <AlertFeed alerts={alerts} t={t} loading={loading} />
          </Card>
        </div>

        {/* Live Feed */}
        <div className="col-span-3">
          <Card className="h-full">
            <LiveFeed maxEvents={10} mockEvents={mockEvents.length > 0 ? mockEvents : undefined} />
          </Card>
        </div>
      </div>

      {/* Row 2: Revenue + AI Actions */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* Revenue Chart */}
        <div className="col-span-7">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-primary">
                {t('totalRevenue')}
              </h3>
              <span className="text-xs text-text-tertiary">7d</span>
            </div>
            {loading ? (
              <div className="h-[160px] bg-surface-2 rounded animate-pulse" />
            ) : (
              <LineChart
                data={revenue.map((d) => ({
                  label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: d.revenue,
                }))}
                height={160}
                color="#00FF94"
                showGrid
                showLabels
                showTooltip
              />
            )}
          </Card>
        </div>

        {/* AI Actions */}
        <div className="col-span-5">
          <Card className="h-full">
            <h3 className="text-sm font-medium text-text-primary mb-3">{t('aiActions')}</h3>
            <ActionPanel t={t} loading={loading} />
          </Card>
        </div>
      </div>

      {/* Row 3: AI Chat */}
      <div className="mb-5">
        <Card>
          <AiChat t={t} />
        </Card>
      </div>
    </Shell>
  )
}
