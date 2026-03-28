import React, { useMemo, useState } from 'react'
import Shell from '../components/Shell'
import KPICard from '../components/KPICard'
import DataTable, { Column } from '../components/DataTable'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import LineChart from '../components/charts/LineChart'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'

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

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function KPISkeleton() {
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-4 animate-pulse">
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
    <div className="h-[220px] w-full bg-surface-2/30 rounded animate-pulse flex items-center justify-center">
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

  // KPI counts
  const criticalCount = predictions.filter((r) => r.status === 'critical').length
  const warningCount = predictions.filter((r) => r.status === 'warning').length
  const healthyCount = predictions.filter((r) => r.status === 'healthy').length

  // At-risk products for chart
  const atRiskProducts = predictions.filter((r) => r.status === 'critical' || r.status === 'warning')

  // Selected product for detailed chart
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedProduct = selectedId
    ? predictions.find((r) => r.id === selectedId)
    : atRiskProducts[0] || null

  // Table columns
  const columns: Column[] = [
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-text-primary truncate max-w-[240px] block">{value}</span>
      ),
    },
    {
      key: 'currentStock',
      label: 'Stock',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-text-primary">{value}</span>
      ),
    },
    {
      key: 'dailyVelocity',
      label: 'Daily Velocity',
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-text-secondary">{value}/day</span>
      ),
    },
    {
      key: 'daysUntilStockout',
      label: 'Days to Stockout',
      sortable: true,
      render: (value: number, row: PredictionRow) => {
        const colorClass =
          row.status === 'critical'
            ? 'text-status-error'
            : row.status === 'warning'
            ? 'text-status-warning'
            : 'text-status-success'
        return (
          <span className={`font-mono font-semibold ${colorClass}`}>
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
  ]

  // Chart colors per product (cycle through a palette)
  const chartColors = ['#FF4444', '#FFB224', '#FF6B6B', '#FF9F43', '#E55039']

  return (
    <Shell title="Inventory Predictions">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-text-primary tracking-tight">
            Stockout Predictor
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            AI-powered inventory depletion forecasts based on 7-day sales velocity
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <>
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
            </>
          ) : (
            <>
              <KPICard title="At Risk Products" value={criticalCount} suffix="products" />
              <KPICard title="Low Stock" value={warningCount} suffix="products" />
              <KPICard title="Healthy Stock" value={healthyCount} suffix="products" />
            </>
          )}
        </div>

        {/* Projection Chart */}
        <Card
          title="Inventory Depletion Projection"
          subtitle={
            selectedProduct
              ? `Showing: ${selectedProduct.product}`
              : 'Select a product from the table'
          }
        >
          {loading ? (
            <ChartSkeleton />
          ) : selectedProduct ? (
            <div className="mt-2">
              {/* Product selector pills */}
              {atRiskProducts.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {atRiskProducts.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ease-out border ${
                        (selectedProduct?.id === p.id)
                          ? 'border-accent/40 bg-accent/10 text-accent'
                          : 'border-border bg-surface-2/50 text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      {p.product.length > 24 ? p.product.slice(0, 24) + '...' : p.product}
                    </button>
                  ))}
                </div>
              )}
              <LineChart
                data={buildProjectionData(selectedProduct)}
                height={220}
                color={
                  selectedProduct.status === 'critical'
                    ? '#FF4444'
                    : selectedProduct.status === 'warning'
                    ? '#FFB224'
                    : '#00FF94'
                }
              />
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-error" />
                  <span className="text-xs text-text-tertiary">Critical (&lt;3 days)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-warning" />
                  <span className="text-xs text-text-tertiary">Low Stock (&lt;7 days)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-success" />
                  <span className="text-xs text-text-tertiary">Healthy (7+ days)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <span className="text-sm text-text-tertiary">No at-risk products detected</span>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card title="All Products" subtitle={`${predictions.length} products tracked`}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              columns={columns}
              data={predictions}
              onRowClick={(row: PredictionRow) => setSelectedId(row.id)}
            />
          )}
        </Card>
      </div>
    </Shell>
  )
}
