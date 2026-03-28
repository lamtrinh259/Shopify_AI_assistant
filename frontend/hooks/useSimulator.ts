import { useState, useEffect, useCallback, useRef } from 'react'
import type { LiveEvent } from '../lib/types'

// Simulated product catalog
const PRODUCTS = [
  { title: 'Classic Black T-Shirt', price: 29.99 },
  { title: 'Minimalist Watch Silver', price: 189.99 },
  { title: 'Organic Cotton Hoodie', price: 79.99 },
  { title: 'Leather Crossbody Bag', price: 124.99 },
  { title: 'Wireless Earbuds Pro', price: 149.99 },
  { title: 'Running Shoes V2', price: 109.99 },
  { title: 'Ceramic Coffee Mug Set', price: 34.99 },
  { title: 'Stainless Water Bottle', price: 24.99 },
]

const CUSTOMERS = [
  'emma.w@gmail.com', 'james.c@outlook.com', 'sofia.m@yahoo.com',
  'alex.t@gmail.com', 'nina.k@hotmail.com', 'lucas.r@gmail.com',
  'maria.g@icloud.com', 'david.t@gmail.com', 'sarah.j@outlook.com',
  'mike.l@gmail.com', 'aisha.p@yahoo.com', 'tom.n@gmail.com',
]

const EVENT_TYPES: LiveEvent['event_type'][] = [
  'new_order', 'new_order', 'new_order', // 3x weight for orders
  'customer_created',
  'inventory_change',
  'product_update',
]

let eventCounter = 100

function generateEvent(): LiveEvent {
  eventCounter++
  const type = EVENT_TYPES[eventCounter % EVENT_TYPES.length]
  const now = new Date().toISOString()

  switch (type) {
    case 'new_order': {
      const product = PRODUCTS[eventCounter % PRODUCTS.length]
      const qty = 1 + (eventCounter % 3)
      const total = Math.round(product.price * qty * 100) / 100
      return {
        id: `sim-${eventCounter}`,
        event_type: 'new_order',
        payload: {
          order_number: String(1042 + eventCounter),
          total_price: total,
          product: product.title,
          quantity: qty,
        },
        created_at: now,
      }
    }
    case 'customer_created': {
      const email = CUSTOMERS[eventCounter % CUSTOMERS.length]
      return {
        id: `sim-${eventCounter}`,
        event_type: 'customer_created',
        payload: { email },
        created_at: now,
      }
    }
    case 'inventory_change': {
      const product = PRODUCTS[eventCounter % PRODUCTS.length]
      return {
        id: `sim-${eventCounter}`,
        event_type: 'inventory_change',
        payload: {
          product_title: product.title,
          change: -(1 + (eventCounter % 5)),
        },
        created_at: now,
      }
    }
    case 'product_update': {
      const product = PRODUCTS[eventCounter % PRODUCTS.length]
      return {
        id: `sim-${eventCounter}`,
        event_type: 'product_update',
        payload: { title: product.title },
        created_at: now,
      }
    }
    default:
      return {
        id: `sim-${eventCounter}`,
        event_type: 'new_order',
        payload: { order_number: String(1042 + eventCounter), total_price: 99.99 },
        created_at: now,
      }
  }
}

export interface SimulatorState {
  events: LiveEvent[]
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  isRunning: boolean
}

export function useSimulator(intervalMs = 6000, maxEvents = 50) {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [totalRevenue, setTotalRevenue] = useState(4280)
  const [totalOrders, setTotalOrders] = useState(23)
  const [totalCustomers, setTotalCustomers] = useState(312)
  const [isRunning, setIsRunning] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const addEvent = useCallback(() => {
    const event = generateEvent()
    setEvents((prev) => [event, ...prev].slice(0, maxEvents))

    if (event.event_type === 'new_order') {
      const revenue = event.payload.total_price || 0
      setTotalRevenue((prev) => Math.round((prev + revenue) * 100) / 100)
      setTotalOrders((prev) => prev + 1)
    }
    if (event.event_type === 'customer_created') {
      setTotalCustomers((prev) => prev + 1)
    }
  }, [maxEvents])

  useEffect(() => {
    if (!isRunning) return

    // Add first event quickly
    const initialTimer = setTimeout(addEvent, 2000)

    // Then add events at interval (with some jitter)
    intervalRef.current = setInterval(() => {
      addEvent()
    }, intervalMs + (Math.random() * 3000 - 1500)) // ±1.5s jitter

    return () => {
      clearTimeout(initialTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, intervalMs, addEvent])

  return {
    events,
    totalRevenue,
    totalOrders,
    totalCustomers,
    isRunning,
    setIsRunning,
  }
}
