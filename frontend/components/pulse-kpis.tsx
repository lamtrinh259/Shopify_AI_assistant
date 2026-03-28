import React from 'react'
import { formatCurrency, formatNumber } from '../lib/utils'
import Sparkline from './charts/Sparkline'

interface PulseKPIData {
  todayRevenue: number
  revenueChange: number
  ordersToday: number
  ordersChange: number
  activeCustomers: number
  customersChange: number
  avgOrderValue: number
  aovChange: number
  revenueSparkline: number[]
  ordersSparkline: number[]
}

interface PulseKPIsProps {
  data: PulseKPIData
  t: (key: string) => string
  loading?: boolean
}

function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <div className="flex items-center gap-1">
      <svg width="10" height="10" viewBox="0 0 10 10" className={isPositive ? 'text-status-success' : 'text-status-error'}>
        {isPositive ? (
          <path d="M5 1l4 5H1l4-5z" fill="currentColor" />
        ) : (
          <path d="M5 9l4-5H1l4 5z" fill="currentColor" />
        )}
      </svg>
      <span className={`text-xs font-medium ${isPositive ? 'text-status-success' : 'text-status-error'}`}>
        {Math.abs(value).toFixed(1)}%
      </span>
    </div>
  )
}

function KPISkeleton() {
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-4 animate-pulse">
      <div className="w-20 h-3 bg-surface-2 rounded mb-3" />
      <div className="w-16 h-7 bg-surface-2 rounded mb-2" />
      <div className="w-12 h-3 bg-surface-2 rounded" />
    </div>
  )
}

export default function PulseKPIs({ data, t, loading }: PulseKPIsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}
      </div>
    )
  }

  const kpis = [
    {
      title: t('todayRevenue'),
      value: formatCurrency(data.todayRevenue),
      change: data.revenueChange,
      sparkline: data.revenueSparkline,
      sparkColor: data.revenueChange >= 0 ? '#00FF94' : '#FF4444',
    },
    {
      title: t('ordersToday'),
      value: formatNumber(data.ordersToday),
      change: data.ordersChange,
      sparkline: data.ordersSparkline,
      sparkColor: data.ordersChange >= 0 ? '#00FF94' : '#FF4444',
    },
    {
      title: t('activeCustomers'),
      value: formatNumber(data.activeCustomers),
      change: data.customersChange,
      sparkline: null,
      sparkColor: '#3B82F6',
    },
    {
      title: t('avgOrderValue'),
      value: formatCurrency(data.avgOrderValue),
      change: data.aovChange,
      sparkline: null,
      sparkColor: '#FFB224',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="bg-surface-1 border border-border rounded-lg p-4 hover:border-border-hover transition-all duration-150 group"
        >
          <p className="text-xs text-text-tertiary mb-2 group-hover:text-text-secondary transition-colors">
            {kpi.title}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xl font-semibold text-text-primary font-mono">
                {kpi.value}
              </span>
              <div className="mt-1.5">
                <ChangeIndicator value={kpi.change} />
              </div>
            </div>
            {kpi.sparkline && (
              <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                <Sparkline data={kpi.sparkline} color={kpi.sparkColor} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Mock data for demo
export const MOCK_KPI_DATA: PulseKPIData = {
  todayRevenue: 4280,
  revenueChange: 17.6,
  ordersToday: 23,
  ordersChange: 27.8,
  activeCustomers: 312,
  customersChange: 12.4,
  avgOrderValue: 186.09,
  aovChange: -2.1,
  revenueSparkline: [180, 220, 195, 340, 280, 320, 428],
  ordersSparkline: [12, 15, 11, 22, 18, 20, 23],
}
