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

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Shopify store access token
- An Anthropic API key (for the AI Chat feature on the Pulse page)

### 1. Clone & configure

```bash
git clone https://github.com/lamtrinh259/Shopify_AI_assistant.git
cd Shopify_AI_assistant
```

Create a `.env` file in the root:

```dotenv
SHOPIFY_ACCESS_TOKEN=shpss_your_token_here
SHOPIFY_STORE_URL=https://your-store.myshopify.com/

# Order simulator (creates fake orders every 60-180 seconds)
SIMULATOR_ENABLED=true
SIMULATOR_INTERVAL_MIN=60
SIMULATOR_INTERVAL_MAX=180
```

> **Note:** `SHOPIFY_STORE_URL` must include the `https://` prefix.

### 2. Install dependencies & seed demo data

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
python seed_demo.py
python -m uvicorn app.main:app --reload --port 8000
```

> `seed_demo.py` populates the local SQLite database with realistic demo data (products, orders, customers). Without this step the app will show empty or mock data.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Alternatively, if you just want to run both with one command (without seeding):

```bash
# From the repo root
npm run setup  # installs all dependencies
npm run dev    # starts both backend + frontend
```

> **Note:** `npm run dev` does not run the seed script. For the best demo experience, run `python seed_demo.py` in the `backend/` folder first.

### 4. Enable AI Chat (optional)

The AI Chat on the Pulse page is powered by Claude (Anthropic). To use it:

1. Get an API key from https://console.anthropic.com
2. Open the app at http://localhost:3000/pulse
3. Click the **🔑 Add Key** button in the chat panel
4. Paste your Anthropic API key and press Enter

The key is saved in your browser's `localStorage` — it's never sent anywhere except the local backend proxy, which forwards it directly to Anthropic. You do not need to add it to `.env`.

### Troubleshooting

| Problem | Fix |
|---|---|
| `EADDRINUSE :::3000` | Another process is using port 3000. Run `lsof -ti:3000 \| xargs kill -9` then retry. |
| All data shows `$0.00` | The Shopify sync failed. Delete `hackathon.db` and restart — check terminal for sync errors. |
| Backend won't start | Make sure `.env` has `SHOPIFY_ACCESS_TOKEN` (not `SHOPIFY_CLIENT_ID`). |
| AI Chat says "api_key required" | Click 🔑 Add Key in the chat panel and enter your Anthropic API key. |
| "Using demo data" banner | Backend isn't reachable. Make sure you ran `npm run dev` from the root, not from `frontend/`. |

---

## Architecture

```
Your laptop:
├── Next.js frontend        (localhost:3000)
├── FastAPI backend          (localhost:8000)
├── SQLite                   (hackathon.db — auto-synced from Shopify on startup)
└── .env                     (SHOPIFY_ACCESS_TOKEN + SHOPIFY_STORE_URL)
```

Everything runs locally. No external services required (Anthropic key is optional, only needed for AI Chat).

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
