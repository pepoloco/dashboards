# Sales Dashboards 

A public demo of internal sales and leadership dashboards, rebuilt with **randomised mock data**.
No real people, customers, funds or figures appear anywhere. All data is generated in the browser from a
seeded random generator, relative to today's date, so the demo never looks stale.

## Pages

| Route              | What it shows |
|--------------------|---------------|
| `/user-activation` | User activation KPIs, growth over time, activation funnel, onboarding rate, weekly sign-ups & KYC completions, registration device |
| `/deals`           | Deals Closed · Brand Denmark (filterable), All Deals Closed Won, All Deals Closed Lost, Pipeline Report · Sales |
| `/sales-report`    | Sales Report by Consultant: monthly signed volume vs. target per region, plus meetings booked/attended |

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## Stack

Next.js 15 (App Router) · React 19 · Chart.js 4 · TypeScript. No backend, no API keys, no environment variables.

Mock data lives in `src/lib/mock/`. Change a seed in `rng(...)` there to get a different dataset.

## Deploy

Import the repo in Vercel. The framework is detected automatically, and no settings or env vars are needed.
