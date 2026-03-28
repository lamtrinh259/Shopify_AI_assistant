# Shopify AI Assistant — Store Pulse

> An AI-powered command center for Shopify merchants. Real-time store health scoring, predictive analytics, customer intelligence, and a live AI chat — all in one dashboard.

## Demo

https://github.com/user-attachments/assets/2b0aaedb-6eb7-4c5b-8428-04496760b2e9

---

## What We Built

### Store Pulse — AI CEO Command Center (`/pulse`)
The centrepiece of the app. A real-time command center that gives merchants an at-a-glance view of their store's health:
- **Health Score Gauge** — composite score (0–10) calculated from revenue trend, AOV, conversion rate, and customer retention
- **Live KPI Cards** — revenue, orders, AOV, and customer count auto-updating in real-time
- **AI Chat** — conversational assistant that interprets store data and surfaces recommendations
- **Alert Feed** — proactive alerts for anomalies, low inventory, and customer churn risk
- **Action Panel** — one-click actions: create discounts, send emails, inject storefront widgets

### Inventory Predictions (`/predictions`)
- Calculates **daily sales velocity** per product from recent order history
- Shows **days-until-stockout** with colour-coded risk levels (red < 3 days, yellow < 7, green > 7)
- Falls back to smart defaults when live Shopify data is unavailable

### Customer Segments (`/segments`)
- **RFM analysis** (Recency, Frequency, Monetary) on all customers
- Scores each customer 1–5 across all three dimensions
- Classifies into 4 segments: Champions, Loyal, At Risk, Lost
- Visualised as a DonutChart with a filterable DataTable

### Anomaly Detector (`/anomalies`)
- Compares current-hour order volume against historical hourly baselines
- Flags statistical outliers (>2 standard deviations) in real-time
- HeatMap view of expected vs actual order patterns throughout the day

### Revenue Forecast (`/forecast`)
- 90 days of historical revenue pulled from Shopify analytics
- **Linear regression** projects the next 30 days
- Projected revenue displayed as a dashed line continuation on the chart
- KPI cards show projected total, growth rate, and confidence interval

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/lamtrinh259/Shopify_AI_assistant.git
cd Shopify_AI_assistant

# 2. Set your Shopify credentials
cp .env.example .env
# Edit .env — set SHOPIFY_ACCESS_TOKEN and SHOPIFY_STORE_URL

# 3. Install dependencies + start everything
npm run setup
npm run dev

# 4. Open http://localhost:3000/pulse
```

## Architecture

```
Your laptop:
├── Next.js frontend        (localhost:3000)
├── FastAPI backend          (localhost:8000)
├── SQLite                   (hackathon.db — auto-synced from Shopify on startup)
└── .env                     (SHOPIFY_ACCESS_TOKEN + SHOPIFY_STORE_URL)
```

Everything runs locally. No external services, no auth setup, no deployment needed.

## Pages

| Route | Feature |
|---|---|
| `/pulse` | AI command center — health score, live KPIs, AI chat, alerts |
| `/predictions` | Inventory stockout predictor |
| `/segments` | Customer RFM segmentation |
| `/anomalies` | Live order anomaly detection |
| `/forecast` | 30-day revenue forecasting |
| `/overview` | Dashboard overview |
| `/orders` | Order management with real-time highlighting |
| `/products` | Product catalog with variant detail |

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, pure SVG charts (no chart libraries)
- **Backend**: FastAPI, SQLite (via SQLAlchemy async), Shopify REST + GraphQL
- **Real-time**: Server-Sent Events (SSE) for live order and inventory updates
- **Simulator**: Built-in order simulator creates live events every 60–180s

---

Built for the Claude × Shopify Hackathon 2026.
