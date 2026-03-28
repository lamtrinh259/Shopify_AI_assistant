export interface StoreData {
  ordersToday: number
  avgDailyOrders: number
  productsInStock: number
  totalProducts: number
  revenue7d: number
  revenuePrev7d: number
  anomalousOrders: number
  totalOrders: number
  returningCustomers: number
  totalCustomers: number
}

export interface ScoreBreakdown {
  salesVelocity: number
  inventoryHealth: number
  revenueTrend: number
  anomalyRate: number
  customerMix: number
  total: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function calculateHealthScore(data: StoreData): ScoreBreakdown {
  const salesVelocity =
    data.avgDailyOrders > 0
      ? clamp(data.ordersToday / data.avgDailyOrders, 0, 2) * 5
      : 5

  const inventoryHealth =
    data.totalProducts > 0
      ? (data.productsInStock / data.totalProducts) * 10
      : 10

  const revenueTrend =
    data.revenuePrev7d > 0
      ? clamp(data.revenue7d / data.revenuePrev7d, 0, 2) * 5
      : 5

  const anomalyRate =
    data.totalOrders > 0
      ? (1 - data.anomalousOrders / data.totalOrders) * 10
      : 10

  const customerMix =
    data.totalCustomers > 0
      ? (data.returningCustomers / data.totalCustomers) * 10
      : 5

  const total =
    salesVelocity * 0.25 +
    inventoryHealth * 0.2 +
    revenueTrend * 0.25 +
    anomalyRate * 0.15 +
    customerMix * 0.15

  return {
    salesVelocity: Math.round(salesVelocity * 10) / 10,
    inventoryHealth: Math.round(inventoryHealth * 10) / 10,
    revenueTrend: Math.round(revenueTrend * 10) / 10,
    anomalyRate: Math.round(anomalyRate * 10) / 10,
    customerMix: Math.round(customerMix * 10) / 10,
    total: Math.round(total * 10) / 10,
  }
}

export function getScoreLabel(score: number): string {
  if (score >= 8.5) return 'excellent'
  if (score >= 7) return 'good'
  if (score >= 5) return 'fair'
  if (score >= 3) return 'poor'
  return 'critical'
}

export function getScoreColor(score: number): string {
  if (score >= 8.5) return '#00FF94'
  if (score >= 7) return '#00FF94'
  if (score >= 5) return '#FFB224'
  if (score >= 3) return '#FF8C00'
  return '#FF4444'
}

// Mock store data for demo — gives a score around 6.9 (FAIR)
export const MOCK_STORE_DATA: StoreData = {
  ordersToday: 23,
  avgDailyOrders: 18,
  productsInStock: 38,
  totalProducts: 42,
  revenue7d: 28450,
  revenuePrev7d: 24200,
  anomalousOrders: 1,
  totalOrders: 156,
  returningCustomers: 312,
  totalCustomers: 891,
}

// Alternative mock data for a healthier store (score ~8.2)
export const MOCK_STORE_DATA_GOOD: StoreData = {
  ordersToday: 32,
  avgDailyOrders: 18,
  productsInStock: 41,
  totalProducts: 42,
  revenue7d: 34200,
  revenuePrev7d: 24200,
  anomalousOrders: 0,
  totalOrders: 224,
  returningCustomers: 560,
  totalCustomers: 891,
}
