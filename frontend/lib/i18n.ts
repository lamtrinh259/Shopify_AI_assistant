import { useState, useCallback, createContext, useContext } from 'react'

type Lang = 'en' | 'es'

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation
    storePulse: 'Store Pulse',
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    forecast: 'Forecast',

    // Health Score
    healthScore: 'Health Score',
    storeHealth: 'Store Health',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',

    // Score Breakdown
    salesVelocity: 'Sales Velocity',
    inventoryHealth: 'Inventory Health',
    revenueTrend: 'Revenue Trend',
    anomalyRate: 'Anomaly Rate',
    customerMix: 'Customer Mix',
    scoreBreakdown: 'Score Breakdown',

    // KPIs
    todayRevenue: "Today's Revenue",
    ordersToday: 'Orders Today',
    activeCustomers: 'Active Customers',
    conversionRate: 'Conversion Rate',
    avgOrderValue: 'Avg Order Value',
    totalRevenue: 'Total Revenue',

    // Alerts
    smartAlerts: 'Smart Alerts',
    alerts: 'Alerts',
    noAlerts: 'All systems healthy',
    deadStock: 'Dead Stock Detected',
    deadStockDesc: 'hasn\'t sold in 14+ days. Consider a discount.',
    lowInventory: 'Low Inventory Warning',
    lowInventoryDesc: 'units left. Estimated stockout in',
    days: 'days',
    salesSpike: 'Sales Spike Detected',
    salesSpikeDesc: 'above normal for this hour',
    anomalousOrder: 'Anomalous Order',
    anomalousOrderDesc: 'High-value order from new customer — review recommended',
    newCustomerSurge: 'New Customer Surge',
    newCustomerSurgeDesc: 'new customers today, above average',
    revenueDropping: 'Revenue Dropping',
    revenueDropDesc: 'Revenue down vs last week',

    // Actions
    aiActions: 'AI Actions',
    createDiscount: 'Create Discount',
    createDiscountDesc: 'Auto-generate discount for underperforming products',
    sendEmail: 'Send Re-engagement Email',
    sendEmailDesc: 'Reach out to dormant customers',
    flagOrder: 'Flag Suspicious Order',
    flagOrderDesc: 'Mark anomalous orders for manual review',
    bundleSuggestion: 'Bundle Suggestion',
    bundleSuggestionDesc: 'AI-generated product bundle based on purchase patterns',
    executing: 'Executing...',
    success: 'Success!',
    failed: 'Failed',

    // Live Feed
    liveFeed: 'Live Feed',
    connected: 'Connected',
    offline: 'Offline',
    noEvents: 'No events yet',

    // AI Chat
    aiCeo: 'AI CEO',
    askAnything: 'Ask anything about your store...',

    // General
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    viewAll: 'View All',
    lastUpdated: 'Last updated',
    vsAvg: 'vs avg',
    vsPrev: 'vs prev',
  },
  es: {
    // Navigation
    storePulse: 'Store Pulse',
    dashboard: 'Panel',
    products: 'Productos',
    orders: 'Pedidos',
    forecast: 'Pronóstico',

    // Health Score
    healthScore: 'Puntuación de Salud',
    storeHealth: 'Salud de la Tienda',
    excellent: 'Excelente',
    good: 'Bueno',
    fair: 'Regular',
    poor: 'Bajo',
    critical: 'Crítico',

    // Score Breakdown
    salesVelocity: 'Velocidad de Ventas',
    inventoryHealth: 'Salud del Inventario',
    revenueTrend: 'Tendencia de Ingresos',
    anomalyRate: 'Tasa de Anomalías',
    customerMix: 'Mix de Clientes',
    scoreBreakdown: 'Desglose del Puntaje',

    // KPIs
    todayRevenue: 'Ingresos de Hoy',
    ordersToday: 'Pedidos Hoy',
    activeCustomers: 'Clientes Activos',
    conversionRate: 'Tasa de Conversión',
    avgOrderValue: 'Ticket Promedio',
    totalRevenue: 'Ingresos Totales',

    // Alerts
    smartAlerts: 'Alertas Inteligentes',
    alerts: 'Alertas',
    noAlerts: 'Todos los sistemas saludables',
    deadStock: 'Stock Muerto Detectado',
    deadStockDesc: 'sin vender en 14+ días. Considera un descuento.',
    lowInventory: 'Alerta de Inventario Bajo',
    lowInventoryDesc: 'unidades restantes. Agotamiento estimado en',
    days: 'días',
    salesSpike: 'Pico de Ventas Detectado',
    salesSpikeDesc: 'por encima de lo normal para esta hora',
    anomalousOrder: 'Pedido Anómalo',
    anomalousOrderDesc: 'Pedido de alto valor de cliente nuevo — revisión recomendada',
    newCustomerSurge: 'Oleada de Clientes Nuevos',
    newCustomerSurgeDesc: 'clientes nuevos hoy, por encima del promedio',
    revenueDropping: 'Ingresos Bajando',
    revenueDropDesc: 'Ingresos abajo vs semana pasada',

    // Actions
    aiActions: 'Acciones IA',
    createDiscount: 'Crear Descuento',
    createDiscountDesc: 'Auto-generar descuento para productos con bajo rendimiento',
    sendEmail: 'Enviar Email de Reactivación',
    sendEmailDesc: 'Contactar clientes dormidos',
    flagOrder: 'Marcar Pedido Sospechoso',
    flagOrderDesc: 'Marcar pedidos anómalos para revisión manual',
    bundleSuggestion: 'Sugerencia de Bundle',
    bundleSuggestionDesc: 'Bundle generado por IA basado en patrones de compra',
    executing: 'Ejecutando...',
    success: '¡Éxito!',
    failed: 'Falló',

    // Live Feed
    liveFeed: 'Feed en Vivo',
    connected: 'Conectado',
    offline: 'Desconectado',
    noEvents: 'Sin eventos aún',

    // AI Chat
    aiCeo: 'CEO IA',
    askAnything: 'Pregunta lo que sea sobre tu tienda...',

    // General
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    viewAll: 'Ver Todo',
    lastUpdated: 'Última actualización',
    vsAvg: 'vs prom',
    vsPrev: 'vs ant',
  },
}

export type { Lang }

export function useTranslation() {
  const [lang, setLang] = useState<Lang>('en')
  const t = useCallback(
    (key: string): string => translations[lang]?.[key] || key,
    [lang]
  )
  return { t, lang, setLang }
}

export function getTranslation(lang: Lang, key: string): string {
  return translations[lang]?.[key] || key
}
