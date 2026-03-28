import React, { useState, useEffect } from 'react'
import { timeAgo } from '../lib/utils'

type AlertSeverity = 'critical' | 'warning' | 'info' | 'success'

interface Alert {
  id: string
  type: string
  title: string
  description: string
  severity: AlertSeverity
  timestamp: string
  actionable?: boolean
}

interface AlertFeedProps {
  alerts: Alert[]
  t: (key: string) => string
  loading?: boolean
  onAction?: (alertId: string) => void
}

const severityConfig: Record<AlertSeverity, { bg: string; border: string; icon: string; dot: string }> = {
  critical: {
    bg: 'bg-status-error/5',
    border: 'border-status-error/20',
    icon: 'text-status-error',
    dot: 'bg-status-error',
  },
  warning: {
    bg: 'bg-status-warning/5',
    border: 'border-status-warning/20',
    icon: 'text-status-warning',
    dot: 'bg-status-warning',
  },
  info: {
    bg: 'bg-status-info/5',
    border: 'border-status-info/20',
    icon: 'text-status-info',
    dot: 'bg-status-info',
  },
  success: {
    bg: 'bg-status-success/5',
    border: 'border-status-success/20',
    icon: 'text-status-success',
    dot: 'bg-status-success',
  },
}

function AlertIcon({ severity }: { severity: AlertSeverity }) {
  const color = severityConfig[severity].icon
  switch (severity) {
    case 'critical':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={color}>
          <path d="M8 1.5L1 14h14L8 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
          <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
        </svg>
      )
    case 'warning':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={color}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="10.5" r="0.7" fill="currentColor" />
        </svg>
      )
    case 'info':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={color}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="5" r="0.7" fill="currentColor" />
        </svg>
      )
    case 'success':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className={color}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
  }
}

function AlertSkeleton() {
  return (
    <div className="border border-border rounded-lg p-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-4 h-4 bg-surface-2 rounded-full mt-0.5" />
        <div className="flex-1">
          <div className="w-32 h-3.5 bg-surface-2 rounded mb-2" />
          <div className="w-48 h-3 bg-surface-2 rounded" />
        </div>
        <div className="w-10 h-3 bg-surface-2 rounded" />
      </div>
    </div>
  )
}

export default function AlertFeed({ alerts, t, loading, onAction }: AlertFeedProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<string[]>([])

  useEffect(() => {
    // Stagger alert appearance
    alerts.forEach((alert, i) => {
      setTimeout(() => {
        setVisibleAlerts((prev) => [...prev, alert.id])
      }, i * 100)
    })
  }, [alerts])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <AlertSkeleton key={i} />)}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg width="32" height="32" viewBox="0 0 32 32" className="text-status-success mb-3">
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <p className="text-sm text-text-secondary">{t('noAlerts')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity]
        const isVisible = visibleAlerts.includes(alert.id)

        return (
          <div
            key={alert.id}
            className={`${config.bg} border ${config.border} rounded-lg p-3 transition-all duration-300 ease-out hover:border-opacity-40 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <AlertIcon severity={alert.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-text-primary">
                    {alert.title}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {alert.description}
                </p>
                {alert.actionable && onAction && (
                  <button
                    onClick={() => onAction(alert.id)}
                    className="mt-2 text-xs text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    Take Action &rarr;
                  </button>
                )}
              </div>
              <span className="text-xs text-text-tertiary flex-shrink-0">
                {timeAgo(alert.timestamp)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Generate localized mock alerts
export function generateMockAlerts(t: (key: string) => string): Alert[] {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString()
  return [
    {
      id: '1',
      type: 'dead_stock',
      title: t('deadStock'),
      description: `"The Draft Snowboard" ${t('deadStockDesc')}`,
      severity: 'warning',
      timestamp: ago(5),
      actionable: true,
    },
    {
      id: '2',
      type: 'low_inventory',
      title: t('lowInventory'),
      description: `"The Complete Snowboard" — 3 ${t('lowInventoryDesc')} 2 ${t('days')}`,
      severity: 'critical',
      timestamp: ago(12),
      actionable: true,
    },
    {
      id: '3',
      type: 'sales_spike',
      title: t('salesSpike'),
      description: `4.2x ${t('salesSpikeDesc')}`,
      severity: 'success',
      timestamp: ago(18),
    },
    {
      id: '4',
      type: 'anomalous_order',
      title: t('anomalousOrder'),
      description: `Order #1042 — $1,249.99. ${t('anomalousOrderDesc')}`,
      severity: 'warning',
      timestamp: ago(25),
      actionable: true,
    },
    {
      id: '5',
      type: 'revenue_trend',
      title: t('revenueDropping'),
      description: `+17.6% ${t('vsPrev')}. ${t('revenueDropDesc')}`,
      severity: 'success',
      timestamp: ago(45),
    },
  ]
}

export type { Alert, AlertSeverity }
