# Store Pulse — Demo Script (2 minutes)

## Before the Demo
1. Open `http://localhost:3000` (redirects to /pulse)
2. Make sure both servers are running:
   - Backend: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
   - Frontend: `cd frontend && npm run dev`
3. Have the page loaded and scrolled to top
4. Set language to EN (click EN button)

---

## The Script

### 0:00 — The Hook (10s)
> "What if your Shopify store had an AI CEO that never sleeps? That monitors every order, predicts problems before they happen, and takes action automatically?"

**[Point to the Health Score gauge showing 6.9]**

> "This is Store Pulse. Right now, our store health is 6.9 out of 10 — Fair. Let me show you why."

---

### 0:10 — Live Data (15s)
**[Point to the KPIs — they should be updating in real-time]**

> "These numbers are live. See? $4,200 in revenue today... now $4,300... orders coming in every few seconds."

**[Point to Live Feed on the right — green "Live" dot pulsing]**

> "Every order, every new customer, every inventory change — all in real-time."

---

### 0:25 — Smart Alerts (15s)
**[Point to Smart Alerts section]**

> "The AI CEO doesn't just show data — it thinks. It detected that 'The Draft Snowboard' hasn't sold in 14 days — dead stock. It found 'The Complete Snowboard' will be out of stock in 2 days. And it spotted a 4x sales spike happening right now."

---

### 0:40 — AI Actions (10s)
**[Scroll down to AI Actions]**

> "One click to act. Create a discount for dead stock. Send a re-engagement email to dormant customers. No more analysis paralysis."

**[Click "Create Discount" button — show the executing animation]**

---

### 0:50 — AI Chat (15s)
**[Point to AI CEO Chat section]**

> "And you can ask it anything."

**[Click "How is my store doing?" button — wait for response]**

> "It analyzes your data and gives actionable recommendations. Not generic advice — specific to YOUR store."

---

### 1:05 — Predictions (15s)
**[Click "Stockout Risk" in sidebar]**

> "Store Pulse predicts inventory stockouts before they happen. These two products will run out within 48 hours. That's $270 per day in lost sales if we don't act."

**[Point to the red warning card at top]**

---

### 1:20 — Revenue Forecast (10s)
**[Click "Revenue Forecast" in sidebar]**

> "Linear regression on 90 days of data. Projected: $87,000 next month, 11% growth. The AI recommends scaling ad spend to ride this momentum."

---

### 1:30 — Anomaly Detection (10s)
**[Click "Anomaly Radar" in sidebar]**

> "Real-time anomaly detection. Right now it's flagging a 4x spike in orders — could be a viral moment or bot activity. The system watches 24/7."

**[Point to the red ANOMALY DETECTED banner]**

---

### 1:40 — i18n (5s)
**[Go back to /pulse, click ES button]**

> "And everything works in English and Spanish — because Latin American e-commerce matters."

---

### 1:45 — The Close (15s)
**[Switch back to EN]**

> "Store Pulse is an AI CEO for your Shopify store. It monitors health, predicts problems, detects anomalies, forecasts revenue, segments customers — and takes action. All in real-time."

> **"Your store never sleeps. Neither does Store Pulse."**

---

## Tips
- Keep scrolling smooth, not jerky
- Let the live data update naturally — don't rush past it
- The AI Chat response takes 1-2 seconds — that's intentional, shows it's "thinking"
- If judges ask about data: "This is a simulated store with 90 days of order history and real-time event simulation"
- If judges ask about Shopify integration: "The backend connects to Shopify's REST and GraphQL APIs. It auto-syncs products, orders, and customers, plus has an order simulator for demos"
