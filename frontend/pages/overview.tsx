import React, { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import KPICard from '../components/KPICard'
import Card from '../components/ui/Card'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import LiveFeed from '../components/LiveFeed'
import { useApi } from '../hooks/useApi'
import { useRevenue, useTopProducts } from '../hooks/useAnalytics'
import { api } from '../lib/api'
import { formatCurrency, formatNumber } from '../lib/utils'
import type { StoreInfo, RevenueDataPoint, TopProduct, LiveEvent } from '../lib/types'

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STORE: StoreInfo = {
  domain: 'snowdevil.myshopify.com',
  name: 'Snow Devil',
  currency: 'USD',
  product_count: 42,
  order_count: 1283,
  customer_count: 891,
  last_sync_at: '2026-03-24T10:30:00Z',
}

function generateMockRevenue(): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = []
  // Use a fixed anchor date so server and client produce identical output
  const anchor = new Date('2026-03-28T00:00:00Z')
  for (let i = 29; i >= 0; i--) {
    const d = new Date(anchor)
    d.setDate(d.getDate() - i)
    // Deterministic values based on index — no Math.random()
    const base = 2800 + ((i * 137 + 41) % 120) * 10
    const orders = 18 + ((i * 7 + 3) % 15)
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

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { id: '1', title: 'Classic Black T-Shirt', revenue: 12480, units_sold: 416 },
  { id: '2', title: 'Minimalist Watch Silver', revenue: 9360, units_sold: 49 },
  { id: '3', title: 'Organic Cotton Hoodie', revenue: 7540, units_sold: 94 },
  { id: '4', title: 'Leather Crossbody Bag', revenue: 5200, units_sold: 42 },
  { id: '5', title: 'Wireless Earbuds Pro', revenue: 3120, units_sold: 21 },
]

// Mock events generated client-side to avoid hydration mismatch with timestamps
function generateDashboardMockEvents(): LiveEvent[] {
  const now = Date.now()
  return [
    { id: '1', event_type: 'new_order', payload: { order_number: '1042', total_price: 259.99 }, created_at: new Date(now - 60000).toISOString() },
    { id: '2', event_type: 'customer_created', payload: { email: 'sarah@example.com' }, created_at: new Date(now - 180000).toISOString() },
    { id: '3', event_type: 'new_order', payload: { order_number: '1041', total_price: 149.50 }, created_at: new Date(now - 300000).toISOString() },
    { id: '4', event_type: 'inventory_change', payload: { product_title: 'Leather Crossbody Bag' }, created_at: new Date(now - 420000).toISOString() },
    { id: '5', event_type: 'new_order', payload: { order_number: '1040', total_price: 89.99 }, created_at: new Date(now - 600000).toISOString() },
    { id: '6', event_type: 'product_update', payload: { title: 'Running Shoes V2' }, created_at: new Date(now - 900000).toISOString() },
    { id: '7', event_type: 'refund_issued', payload: { order_number: '1035' }, created_at: new Date(now - 1200000).toISOString() },
    { id: '8', event_type: 'new_order', payload: { order_number: '1039', total_price: 324.00 }, created_at: new Date(now - 1500000).toISOString() },
  ]
}

// ── Page Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [useMock, setUseMock] = useState(false)
  const [mockEvents, setMockEvents] = useState<LiveEvent[]>([])

  useEffect(() => {
    setMockEvents(generateDashboardMockEvents())
  }, [])

  const { data: storeData, error: storeError } = useApi(() => api.getStore(), [])
  const { data: revenueData, error: revenueError } = useRevenue('30d')
  const { data: topData, error: topError } = useTopProducts(5)

  // Determine if we should use mock data — fall back when API errors OR returns empty data
  const revenueEmpty = !revenueData?.series?.length || revenueData.series.every(d => d.revenue === 0)
  const topEmpty = !topData?.products?.length
  const isMock = useMock || !!(storeError) || revenueEmpty
  const store = (storeData && storeData.order_count > 0) ? storeData : MOCK_STORE
  const revenue = revenueEmpty ? MOCK_REVENUE : revenueData!.series
  const topProducts = topEmpty ? MOCK_TOP_PRODUCTS : topData!.products

  // Compute KPIs from revenue series
  const totalRevenue = revenue.reduce((sum, d) => sum + d.revenue, 0)
  const totalOrders = revenue.reduce((sum, d) => sum + d.orders, 0)
  const avgAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Simulated period-over-period change
  const half = Math.floor(revenue.length / 2)
  const firstHalf = revenue.slice(0, half).reduce((s, d) => s + d.revenue, 0)
  const secondHalf = revenue.slice(half).reduce((s, d) => s + d.revenue, 0)
  const revenueChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

  return (
    <Shell title="Dashboard">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={revenueChange}
        />
        <KPICard
          title="Total Orders"
          value={formatNumber(totalOrders)}
          change={8.2}
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(avgAOV)}
          change={-2.1}
        />
        <KPICard
          title="Customers"
          value={formatNumber(store.customer_count)}
          change={12.4}
        />
      </div>

      {/* Charts + Feed */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Revenue chart - 2/3 */}
        <div className="col-span-2">
          <Card title="Revenue" subtitle="Last 30 days">
            <LineChart
              data={revenue.map((d) => ({
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: d.revenue,
              }))}
              height={240}
              color="#00FF94"
              showGrid
              showLabels
              showTooltip
            />
          </Card>
        </div>

        {/* Live feed - 1/3 */}
        <Card className="min-h-[280px] max-h-[380px] overflow-hidden">
          <LiveFeed maxEvents={20} mockEvents={mockEvents.length > 0 ? mockEvents : undefined} />
        </Card>
      </div>

      {/* Top Products */}
      <Card title="Top Products" subtitle="By revenue">
        <BarChart
          data={topProducts.map((p) => ({
            label: p.title,
            value: p.revenue,
          }))}
          height={180}
          horizontal
        />
      </Card>
    </Shell>
  )
}
