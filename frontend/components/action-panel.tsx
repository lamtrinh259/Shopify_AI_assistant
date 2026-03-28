import React, { useState } from 'react'
import { api } from '../lib/api'

type ActionStatus = 'idle' | 'executing' | 'success' | 'failed'

interface ActionConfig {
  id: string
  titleKey: string
  descKey: string
  icon: React.ReactNode
  color: string
  execute: () => Promise<void>
}

interface ActionPanelProps {
  t: (key: string) => string
  loading?: boolean
}

function ActionSkeleton() {
  return (
    <div className="bg-surface-1 border border-border rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-surface-2 rounded-lg" />
        <div className="w-24 h-4 bg-surface-2 rounded" />
      </div>
      <div className="w-40 h-3 bg-surface-2 rounded" />
    </div>
  )
}

export default function ActionPanel({ t, loading }: ActionPanelProps) {
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({})

  const setStatus = (id: string, status: ActionStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: status }))
    if (status === 'success' || status === 'failed') {
      setTimeout(() => setStatuses((prev) => ({ ...prev, [id]: 'idle' })), 2500)
    }
  }

  const actions: ActionConfig[] = [
    {
      id: 'discount',
      titleKey: 'createDiscount',
      descKey: 'createDiscountDesc',
      color: '#FFB224',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6 7l3-5 3 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M6 7h6a2 2 0 012 2v6a1 1 0 01-1 1H7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 11h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
      execute: async () => {
        const code = `PULSE${Math.floor(Math.random() * 900 + 100)}`
        await api.createDiscount(code, 20)
      },
    },
    {
      id: 'email',
      titleKey: 'sendEmail',
      descKey: 'sendEmailDesc',
      color: '#3B82F6',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      ),
      execute: async () => {
        await api.sendEmail(
          'dormant-customers@store.com',
          'We miss you! Here\'s 15% off',
          '<h2>Come back!</h2><p>Use code COMEBACK15 for 15% off your next order.</p>'
        )
      },
    },
    {
      id: 'flag',
      titleKey: 'flagOrder',
      descKey: 'flagOrderDesc',
      color: '#FF4444',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 2v14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M4 3h9l-2 3 2 3H4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      ),
      execute: async () => {
        // Simulated action
        await new Promise((r) => setTimeout(r, 800))
      },
    },
    {
      id: 'bundle',
      titleKey: 'bundleSuggestion',
      descKey: 'bundleSuggestionDesc',
      color: '#00FF94',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="6" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="11" y="6" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M9 3v2M9 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
      execute: async () => {
        await new Promise((r) => setTimeout(r, 1000))
      },
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <ActionSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const status = statuses[action.id] || 'idle'
        const isExecuting = status === 'executing'
        const isSuccess = status === 'success'
        const isFailed = status === 'failed'

        return (
          <button
            key={action.id}
            onClick={async () => {
              if (isExecuting) return
              setStatus(action.id, 'executing')
              try {
                await action.execute()
                setStatus(action.id, 'success')
              } catch {
                setStatus(action.id, 'failed')
              }
            }}
            disabled={isExecuting}
            className={`bg-surface-1 border rounded-lg p-4 text-left transition-all duration-200 group relative overflow-hidden ${
              isSuccess
                ? 'border-status-success/40'
                : isFailed
                ? 'border-status-error/40'
                : 'border-border hover:border-border-hover'
            }`}
          >
            {/* Executing shimmer */}
            {isExecuting && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            )}

            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: `${action.color}15`, color: action.color }}
              >
                {isExecuting ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" className="animate-spin">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="30 14" />
                  </svg>
                ) : isSuccess ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" className="text-status-success">
                    <path d="M5 9l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                ) : (
                  action.icon
                )}
              </div>
              <span className="text-sm font-medium text-text-primary">
                {isExecuting ? t('executing') : isSuccess ? t('success') : isFailed ? t('failed') : t(action.titleKey)}
              </span>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed group-hover:text-text-secondary transition-colors">
              {t(action.descKey)}
            </p>
          </button>
        )
      })}
    </div>
  )
}
