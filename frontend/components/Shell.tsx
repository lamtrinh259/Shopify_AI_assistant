import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { cn } from '../lib/utils'
import { STORE_URL } from '../lib/constants'

interface ShellProps {
  title: string
  children: React.ReactNode
}

interface NavItem {
  href: string
  label: string
  description: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'AI Intelligence',
    items: [
      {
        href: '/pulse',
        label: 'Command Center',
        description: 'Health score & alerts',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M4 8h2l1.5-3 2 6L11 8h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        ),
      },
      {
        href: '/predictions',
        label: 'Stockout Risk',
        description: 'Inventory forecasts',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 12l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 4h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: '/segments',
        label: 'Customers',
        description: 'RFM segmentation',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M8 2v6h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M8 8l-4.2 4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        href: '/forecast',
        label: 'Revenue Forecast',
        description: '30-day projection',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 12l4-3 3 2 5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 4h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 8l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2 2" />
          </svg>
        ),
      },
      {
        href: '/anomalies',
        label: 'Anomaly Radar',
        description: 'Pattern detection',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L1 14h14L8 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
            <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Store Data',
    items: [
      {
        href: '/overview',
        label: 'Overview',
        description: 'Revenue & trends',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
      },
      {
        href: '/products',
        label: 'Products',
        description: 'Catalog & inventory',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M2 6h12" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 6v7" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
      },
      {
        href: '/orders',
        label: 'Orders',
        description: 'Fulfillment & payments',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 2h8l2 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6l2-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M2 6h12" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
]

export default function Shell({ title, children }: ShellProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayStoreUrl = mounted ? STORE_URL : ''

  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-1 border-r border-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border">
          <Link href="/pulse" className="flex items-center gap-2.5 group">
            <span className="w-3 h-3 rounded-full bg-paint-yellow animate-pulse group-hover:shadow-[0_0_8px_rgba(240,185,11,0.5)] transition-shadow" />
            <div>
              <span className="text-sm font-bold text-text-primary tracking-tight font-headline block">Store Pulse</span>
              <span className="text-[10px] text-text-tertiary font-mono">AI Store CEO</span>
            </div>
          </Link>
        </div>

        {/* Navigation with sections */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-label px-4 mb-2">{section.title}</p>
              <div className="px-2 space-y-0.5">
                {section.items.map((item) => {
                  const active = router.pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ease-out group relative',
                        active
                          ? 'bg-paint-yellow/10 text-paint-yellow nav-active-glow'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                      )}
                    >
                      <span className={cn(
                        'flex-shrink-0 transition-colors',
                        active ? 'text-paint-yellow' : 'text-text-tertiary group-hover:text-text-secondary'
                      )}>
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <span className={cn(
                          'block text-xs font-medium truncate',
                          active ? 'text-paint-yellow' : ''
                        )}>
                          {item.label}
                        </span>
                        {!active && (
                          <span className="block text-[10px] text-text-tertiary truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              displayStoreUrl ? 'bg-paint-green' : 'bg-paint-orange'
            )} />
            <span className="text-[10px] text-text-tertiary truncate font-mono">
              {displayStoreUrl || 'demo mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-11 bg-surface-1 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-text-primary font-headline tracking-tight">{title}</h1>
          <div className="flex items-center gap-3">
            {mounted && displayStoreUrl && (
              <a
                href={`${displayStoreUrl}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-text-tertiary hover:text-paint-yellow transition-colors font-mono"
              >
                Admin &rarr;
              </a>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
