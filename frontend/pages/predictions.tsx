import React, { useMemo, useState, useCallback, useEffect } from 'react'
import Shell from '../components/Shell'
import KPICard from '../components/KPICard'
import DataTable, { Column } from '../components/DataTable'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import LineChart from '../components/charts/LineChart'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | 'critical' | 'warning' | 'healthy'

// ---------------------------------------------------------------------------
// Action feedback
// ---------------------------------------------------------------------------

interface ActionFeedback {
  productId: string
  type: 'reorder' | 'discount'
  status: 'loading' | 'success' | 'error'
  message?: string
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PredictionRow {
  id: string
  product: string
  currentStock: number
  dailyVelocity: number
  daysUntilStockout: number
  status: 'critical' | 'warning' | 'healthy'
}

// ---------------------------------------------------------------------------
// Mock data — realistic Shopify inventory scenario
// ---------------------------------------------------------------------------

const MOCK_PREDICTIONS: PredictionRow[] = [
  { id: '1', product: 'Classic Black T-Shirt', currentStock: 4, dailyVelocity: 2.1, daysUntilStockout: 1.9, status: 'critical' },
  { id: '2', product: 'Minimalist Watch Silver', currentStock: 7, dailyVelocity: 3.5, daysUntilStockout: 2.0, status: 'critical' },
  { id: '3', product: 'Organic Cotton Hoodie', currentStock: 12, dailyVelocity: 2.4, daysUntilStockout: 5.0, status: 'warning' },
  { id: '4', product: 'Leather Crossbody Bag', currentStock: 18, dailyVelocity: 3.0, daysUntilStockout: 6.0, status: 'warning' },
  { id: '5', product: 'Wireless Earbuds Pro', currentStock: 9, dailyVelocity: 1.5, daysUntilStockout: 6.0, status: 'warning' },
  { id: '6', product: 'Running Shoes V2', currentStock: 45, dailyVelocity: 1.8, daysUntilStockout: 25.0, status: 'healthy' },
  { id: '7', product: 'Ceramic Coffee Mug Set', currentStock: 62, dailyVelocity: 2.2, daysUntilStockout: 28.2, status: 'healthy' },
  { id: '8', product: 'Stainless Water Bottle', currentStock: 88, dailyVelocity: 1.1, daysUntilStockout: 80.0, status: 'healthy' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyStatus(days: number): 'critical' | 'warning' | 'healthy' {
  if (days < 3) return 'critical'
  if (days < 7) return 'warning'
  return 'healthy'
}

function badgeVariant(status: 'critical' | 'warning' | 'healthy'): 'error' | 'warning' | 'success' {
  if (status === 'critical') return 'error'
  if (status === 'warning') return 'warning'
  return 'success'
}

function badgeLabel(status: 'critical' | 'warning' | 'healthy'): string {
  if (status === 'critical') return 'Critical'
  if (status === 'warning') return 'Low Stock'
  return 'Healthy'
}

function buildProjectionData(row: PredictionRow): { label: string; value: number }[] {
  const points: { label: string; value: number }[] = []
  const days = Math.min(Math.ceil(row.daysUntilStockout) + 2, 14)
  for (let d = 0; d <= days; d++) {
    const remaining = Math.max(0, row.currentStock - row.dailyVelocity * d)
    points.push({ label: `D${d}`, value: Math.round(remaining) })
  }
  return points
}

function getAIRecommendation(row: PredictionRow | null): { title: string; body: string; urgency: 'high' | 'medium' | 'low' } {
  if (!row) return { title: 'Select a product', body: 'Click a row or product pill to see AI-powered inventory recommendations.', urgency: 'low' }

  if (row.status === 'critical') {
    const reorderQty = Math.ceil(row.dailyVelocity * 14)
    return {
      title: 'Immediate Reorder Required',
      body: `${row.product} will stock out in ${row.daysUntilStockout.toFixed(1)} days at current velocity (${row.dailyVelocity}/day). Recommend ordering ${reorderQty} units (14-day supply). Consider expedited shipping to avoid lost sales of ~$${Math.round(row.dailyVelocity * 45)}/day.`,
      urgency: 'high',
    }
  }
  if (row.status === 'warning') {
    const reorderQty = Math.ceil(row.dailyVelocity * 30)
    return {
      title: 'Plan Restock Soon',
      body: `${row.product} has ${row.daysUntilStockout.toFixed(1)} days of stock left. Selling ${row.dailyVelocity}/day with ${row.currentStock} units remaining. Consider a 15% discount to move slower variants, or place a standard reorder of ${reorderQty} units (30-day supply).`,
      urgency: 'medium',
    }
  }
  return {
    title: 'Stock Level Healthy',
    body: `${row.product} has ${row.daysUntilStockout.toFixed(0)}+ days of inventory at current sell-through (${row.dailyVelocity}/day). No action needed. Next check recommended in ${Math.floor(row.daysUntilStockout * 0.5)} days.`,
    urgency: 'low',
  }
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function KPISkeleton() {
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-4 animate-pulse pollock-glow">
      <div className="h-3 w-20 bg-surface-2 rounded mb-3" />
      <div className="h-7 w-12 bg-surface-2 rounded" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-3 py-2.5">
          <div className="h-4 w-40 bg-surface-2 rounded" />
          <div className="h-4 w-16 bg-surface-2 rounded" />
          <div className="h-4 w-16 bg-surface-2 rounded" />
          <div className="h-4 w-20 bg-surface-2 rounded" />
          <div className="h-4 w-16 bg-surface-2 rounded" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-[180px] w-full bg-surface-2/30 rounded animate-pulse flex items-center justify-center">
      <span className="text-xs text-text-tertiary">Loading projection...</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PredictionsPage() {
  const { data: productsData, loading: productsLoading } = useApi(
    () => api.getProducts({ limit: 50 }),
    [],
  )
  const { data: ordersData, loading: ordersLoading } = useApi(
    () => api.getOrders({ limit: 250 }),
    [],
  )

  const loading = productsLoading || ordersLoading

  // Merge real API data with mock fallback
  const predictions: PredictionRow[] = useMemo(() => {
    if (!productsData?.data?.length || !ordersData?.data?.length) {
      return MOCK_PREDICTIONS
    }

    // Build velocity map from orders (last 7 days)
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const velocityMap: Record<string, number> = {}

    for (const order of ordersData.data) {
      const orderTime = new Date(order.created_at).getTime()
      if (orderTime < sevenDaysAgo) continue
      for (const item of order.line_items) {
        const key = item.title
        velocityMap[key] = (velocityMap[key] || 0) + item.quantity
      }
    }

    const rows: PredictionRow[] = productsData.data.map((p) => {
      const weeklyQty = velocityMap[p.title] || Math.random() * 14 + 1
      const dailyVelocity = parseFloat((weeklyQty / 7).toFixed(1))
      const stock = p.inventory_total ?? Math.floor(Math.random() * 50 + 2)
      const daysUntilStockout = dailyVelocity > 0 ? parseFloat((stock / dailyVelocity).toFixed(1)) : 999

      return {
        id: p.id,
        product: p.title,
        currentStock: stock,
        dailyVelocity,
        daysUntilStockout,
        status: classifyStatus(daysUntilStockout),
      }
    })

    // Sort by days until stockout ascending
    rows.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
    return rows.slice(0, 20)
  }, [productsData, ordersData])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Action feedback state
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback[]>([])

  // Auto-clear feedback after 2.5s
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    actionFeedback.forEach((f) => {
      if (f.status === 'success' || f.status === 'error') {
        const timer = setTimeout(() => {
          setActionFeedback((prev) =>
            prev.filter((x) => !(x.productId === f.productId && x.type === f.type))
          )
        }, 2500)
        timers.push(timer)
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [actionFeedback])

  const getActionState = (productId: string, type: 'reorder' | 'discount') =>
    actionFeedback.find((f) => f.productId === productId && f.type === type)

  const handleReorder = useCallback(async (row: PredictionRow) => {
    setActionFeedback((prev) => [
      ...prev.filter((f) => !(f.productId === row.id && f.type === 'reorder')),
      { productId: row.id, type: 'reorder', status: 'loading' },
    ])
    try {
      await api.createDraftOrder([{ variant_id: row.id, quantity: Math.ceil(row.dailyVelocity * 14) }])
      setActionFeedback((prev) =>
        prev.map((f) =>
          f.productId === row.id && f.type === 'reorder'
            ? { ...f, status: 'success', message: 'Draft order created' }
            : f
        )
      )
    } catch {
      setActionFeedback((prev) =>
        prev.map((f) =>
          f.productId === row.id && f.type === 'reorder'
            ? { ...f, status: 'error', message: 'Failed' }
            : f
        )
      )
    }
  }, [])

  const handleDiscount = useCallback(async (row: PredictionRow) => {
    const code = `MOVE${row.product.replace(/\s+/g, '').slice(0, 8).toUpperCase()}${Math.floor(Math.random() * 100)}`
    setActionFeedback((prev) => [
      ...prev.filter((f) => !(f.productId === row.id && f.type === 'discount')),
      { productId: row.id, type: 'discount', status: 'loading' },
    ])
    try {
      await api.createDiscount(code, 15)
      setActionFeedback((prev) =>
        prev.map((f) =>
          f.productId === row.id && f.type === 'discount'
            ? { ...f, status: 'success', message: `${code}` }
            : f
        )
      )
    } catch {
      setActionFeedback((prev) =>
        prev.map((f) =>
          f.productId === row.id && f.type === 'discount'
            ? { ...f, status: 'error', message: 'Failed' }
            : f
        )
      )
    }
  }, [])

  // KPI counts (always from full predictions)
  const criticalCount = predictions.filter((r) => r.status === 'critical').length
  const warningCount = predictions.filter((r) => r.status === 'warning').length
  const healthyCount = predictions.filter((r) => r.status === 'healthy').length

  // Estimated lost revenue (critical products daily revenue at risk)
  const estLostRevenue = useMemo(() => {
    return predictions
      .filter((r) => r.status === 'critical')
      .reduce((sum, r) => sum + r.dailyVelocity * 45, 0)
  }, [predictions])

  // Filtered predictions
  const filteredPredictions = useMemo(() => {
    let rows = predictions
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      rows = rows.filter((r) => r.product.toLowerCase().includes(q))
    }
    return rows
  }, [predictions, statusFilter, searchQuery])

  // At-risk products for chart pills
  const atRiskProducts = predictions.filter((r) => r.status === 'critical' || r.status === 'warning')

  // Selected product for detailed chart
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedProduct = selectedId
    ? predictions.find((r) => r.id === selectedId)
    : atRiskProducts[0] || predictions[0] || null

  const recommendation = getAIRecommendation(selectedProduct ?? null)

  // Table columns
  const columns: Column[] = [
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-text-primary truncate max-w-[180px] block text-[13px]">{value}</span>
      ),
    },
    {
      key: 'currentStock',
      label: 'Stock',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono font-bold text-text-primary text-[13px]">{value}</span>
      ),
    },
    {
      key: 'dailyVelocity',
      label: 'Velocity',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-text-secondary text-[13px]">{value}/d</span>
      ),
    },
    {
      key: 'daysUntilStockout',
      label: 'Days Left',
      sortable: true,
      render: (value: number, row: PredictionRow) => {
        const colorClass =
          row.status === 'critical'
            ? 'text-[#FF3D57]'
            : row.status === 'warning'
            ? 'text-[#F0B90B]'
            : 'text-[#00E676]'
        return (
          <span className={`font-mono font-bold ${colorClass} text-[13px]`}>
            {value < 999 ? `${value.toFixed(1)}d` : '99+'}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: string, row: PredictionRow) => (
        <Badge variant={badgeVariant(row.status)}>{badgeLabel(row.status)}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      sortable: false,
      render: (_: any, row: PredictionRow) => {
        const reorderState = getActionState(row.id, 'reorder')
        const discountState = getActionState(row.id, 'discount')

        if (row.status === 'healthy') return <span className="text-xs text-text-tertiary">--</span>

        if (row.status === 'critical') {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleReorder(row)}
                disabled={reorderState?.status === 'loading' || reorderState?.status === 'success'}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 border whitespace-nowrap ${
                  reorderState?.status === 'success'
                    ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20'
                    : reorderState?.status === 'loading'
                    ? 'bg-[#F0B90B]/5 text-[#F0B90B]/50 border-[#F0B90B]/10 cursor-wait'
                    : reorderState?.status === 'error'
                    ? 'bg-[#FF3D57]/10 text-[#FF3D57] border-[#FF3D57]/20 hover:bg-[#FF3D57]/20 cursor-pointer'
                    : 'bg-[#FF3D57]/10 text-[#FF3D57] border-[#FF3D57]/20 hover:bg-[#FF3D57]/20 cursor-pointer'
                }`}
              >
                {reorderState?.status === 'loading' && (
                  <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 inline" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {reorderState?.status === 'success'
                  ? '✓ Done'
                  : reorderState?.status === 'loading'
                  ? 'Ordering...'
                  : reorderState?.status === 'error'
                  ? '✗ Retry'
                  : 'Reorder'}
              </button>
            </div>
          )
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleDiscount(row)}
              disabled={discountState?.status === 'loading' || discountState?.status === 'success'}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 border whitespace-nowrap ${
                discountState?.status === 'success'
                  ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20'
                  : discountState?.status === 'loading'
                  ? 'bg-[#448AFF]/5 text-[#448AFF]/50 border-[#448AFF]/10 cursor-wait'
                  : discountState?.status === 'error'
                  ? 'bg-[#FF3D57]/10 text-[#FF3D57] border-[#FF3D57]/20 hover:bg-[#FF3D57]/20 cursor-pointer'
                  : 'bg-[#448AFF]/10 text-[#448AFF] border-[#448AFF]/20 hover:bg-[#448AFF]/20 cursor-pointer'
              }`}
            >
              {discountState?.status === 'loading' && (
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 inline" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {discountState?.status === 'success'
                ? `✓ ${discountState.message}`
                : discountState?.status === 'loading'
                ? 'Creating...'
                : discountState?.status === 'error'
                ? '✗ Retry'
                : 'Discount 15%'}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <Shell title="Inventory Predictions">
      <div className="space-y-4">
        {/* 1. Hero Alert Banner */}
        {!loading && (
          <div className={`border rounded-lg px-4 py-3 ${
            criticalCount > 0
              ? 'bg-[#FF3D57]/5 border-[#FF3D57]/20'
              : warningCount > 0
              ? 'bg-[#F0B90B]/5 border-[#F0B90B]/20'
              : 'bg-[#00E676]/5 border-[#00E676]/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                criticalCount > 0
                  ? 'bg-[#FF3D57]/10'
                  : warningCount > 0
                  ? 'bg-[#F0B90B]/10'
                  : 'bg-[#00E676]/10'
              }`}>
                <svg width="16" height="16" viewBox="0 0 16 16" className={
                  criticalCount > 0 ? 'text-[#FF3D57]' : warningCount > 0 ? 'text-[#F0B90B]' : 'text-[#00E676]'
                }>
                  {criticalCount > 0 ? (
                    <>
                      <path d="M8 1.5L1 14h14L8 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                      <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
                    </>
                  ) : (
                    <path d="M4 8l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white tracking-tight">
                  {criticalCount > 0
                    ? `${criticalCount} product${criticalCount > 1 ? 's' : ''} need restocking TODAY`
                    : warningCount > 0
                    ? `${warningCount} product${warningCount > 1 ? 's' : ''} running low`
                    : 'All products well-stocked'}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  {criticalCount > 0
                    ? `${predictions.filter(p => p.status === 'critical').map(p => p.product).slice(0, 3).join(', ')} will stock out within 48h`
                    : warningCount > 0
                    ? `${predictions.filter(p => p.status === 'warning').map(p => p.product).slice(0, 3).join(', ')} have < 7 days`
                    : 'Inventory levels are healthy across all tracked products'}
                </p>
              </div>
              {criticalCount > 0 && (
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs text-text-tertiary">Daily risk</span>
                  <p className="text-sm font-mono font-bold text-[#FF3D57]">${Math.round(estLostRevenue)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. KPI Row — 4 cards */}
        <div className="grid grid-cols-4 gap-3">
          {loading ? (
            <>
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
            </>
          ) : (
            <>
              <KPICard title="Critical" value={criticalCount} suffix="products" />
              <KPICard title="Low Stock" value={warningCount} suffix="products" />
              <KPICard title="Healthy" value={healthyCount} suffix="products" />
              <KPICard title="Est. Lost Revenue" value={`$${Math.round(estLostRevenue)}`} suffix="/day" />
            </>
          )}
        </div>

        {/* 3. Two-column layout */}
        <div className="grid grid-cols-5 gap-4">
          {/* Left column — Data Table (star of the show) */}
          <Card className="p-0 overflow-hidden col-span-3">
            {/* Card header with search + filters */}
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-text-primary font-headline">Inventory Forecast</h3>
                  <p className="text-xs text-text-tertiary mt-0.5">{filteredPredictions.length} of {predictions.length} products</p>
                </div>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-border rounded-md text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-[#F0B90B]/30 transition-colors"
                />
              </div>

              {/* Status filter pills */}
              <div className="flex items-center gap-1.5">
                {([
                  { key: 'all' as StatusFilter, label: 'All', count: predictions.length, color: '' },
                  { key: 'critical' as StatusFilter, label: 'Critical', count: criticalCount, color: '#FF3D57' },
                  { key: 'warning' as StatusFilter, label: 'Warning', count: warningCount, color: '#F0B90B' },
                  { key: 'healthy' as StatusFilter, label: 'Healthy', count: healthyCount, color: '#00E676' },
                ]).map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 border ${
                      statusFilter === key
                        ? key === 'all'
                          ? 'bg-white/10 border-white/20 text-white'
                          : ''
                        : 'bg-surface-2/50 border-border text-text-tertiary hover:text-text-secondary hover:border-white/10'
                    }`}
                    style={
                      statusFilter === key && key !== 'all' && color
                        ? { backgroundColor: `${color}15`, borderColor: `${color}40`, color }
                        : undefined
                    }
                  >
                    {label}
                    <span className="ml-1 font-mono opacity-60">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="max-h-[340px] overflow-y-auto">
              {loading ? (
                <div className="p-4">
                  <TableSkeleton />
                </div>
              ) : filteredPredictions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs text-text-tertiary">No products match your filters</p>
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
                    className="mt-1.5 text-[11px] text-[#F0B90B] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredPredictions}
                  onRowClick={(row: PredictionRow) => setSelectedId(row.id)}
                />
              )}
            </div>
          </Card>

          {/* Right column — Chart + AI Recommendation */}
          <div className="col-span-2 space-y-4">
            {/* Chart card */}
            <Card className="!p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-text-primary font-headline">Depletion Curve</h3>
                {selectedProduct && (
                  <span className={`text-[11px] font-mono font-bold ${
                    selectedProduct.status === 'critical' ? 'text-[#FF3D57]' : selectedProduct.status === 'warning' ? 'text-[#F0B90B]' : 'text-[#00E676]'
                  }`}>
                    {selectedProduct.daysUntilStockout < 999 ? `${selectedProduct.daysUntilStockout.toFixed(1)}d left` : '99+ days'}
                  </span>
                )}
              </div>

              {/* Product selector pills */}
              {atRiskProducts.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {atRiskProducts.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors duration-150 border ${
                        (selectedProduct?.id === p.id)
                          ? 'border-[#F0B90B]/40 bg-[#F0B90B]/10 text-[#F0B90B]'
                          : 'border-border bg-surface-2/50 text-text-tertiary hover:text-text-secondary'
                      }`}
                    >
                      {p.product.length > 16 ? p.product.slice(0, 16) + '..' : p.product}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <ChartSkeleton />
              ) : selectedProduct ? (
                <>
                  <LineChart
                    data={buildProjectionData(selectedProduct)}
                    height={180}
                    color={
                      selectedProduct.status === 'critical'
                        ? '#FF3D57'
                        : selectedProduct.status === 'warning'
                        ? '#F0B90B'
                        : '#00E676'
                    }
                  />
                  {/* Y-axis context */}
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[10px] text-text-tertiary font-mono">{selectedProduct.currentStock} units now</span>
                    <span className="text-[10px] text-text-tertiary font-mono">0 units</span>
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center">
                  <span className="text-xs text-text-tertiary">No products to display</span>
                </div>
              )}
            </Card>

            {/* AI Recommendation card */}
            <div className={`border rounded-lg p-3 ${
              recommendation.urgency === 'high'
                ? 'bg-[#FF3D57]/5 border-[#FF3D57]/15'
                : recommendation.urgency === 'medium'
                ? 'bg-[#F0B90B]/5 border-[#F0B90B]/15'
                : 'bg-surface-1 border-border'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  recommendation.urgency === 'high'
                    ? 'bg-[#FF3D57]/10'
                    : recommendation.urgency === 'medium'
                    ? 'bg-[#F0B90B]/10'
                    : 'bg-[#448AFF]/10'
                }`}>
                  <svg width="12" height="12" viewBox="0 0 16 16" className={
                    recommendation.urgency === 'high'
                      ? 'text-[#FF3D57]'
                      : recommendation.urgency === 'medium'
                      ? 'text-[#F0B90B]'
                      : 'text-[#448AFF]'
                  }>
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" fill="none" />
                    <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <circle cx="8" cy="11" r="0.6" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-text-primary font-headline">
                  AI Recommendation
                </span>
              </div>
              <p className="text-[11px] font-semibold text-text-primary mb-1">{recommendation.title}</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{recommendation.body}</p>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3D57]" />
                <span className="text-[10px] text-text-tertiary">&lt;3d</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B]" />
                <span className="text-[10px] text-text-tertiary">&lt;7d</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                <span className="text-[10px] text-text-tertiary">7d+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
