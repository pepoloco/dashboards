# Sales Dashboards (demo)

A public demo of internal sales and leadership dashboards, rebuilt with randomised mock data.
No real people, customers, funds or figures appear anywhere. All data is generated in the browser from a
seeded random generator, relative to today's date, so the demo never looks stale.

## Pages

| Route                | What it shows |
|----------------------|---------------|
| `/overview`          | Executive overview: signed volume vs last year and target pace, win rate, weighted pipeline, regional growth, top consultants |
| `/user-activation`   | User activation KPIs, growth over time, activation funnel, onboarding rate, weekly sign-ups & KYC completions, registration device |
| `/deals`             | Deals Closed · Brand Denmark (filterable), All Deals Closed Won, All Deals Closed Lost, Pipeline Report · Sales |
| `/pipeline-insights` | Win rate, ticket size and days to close per channel, won value by fund, weighted forecast, open pipeline ageing |
| `/sales-report`      | Sales Report by Consultant: monthly signed volume vs. target per region, plus meetings booked/attended |
| `/scorecard`         | Consultant scorecard per region: target attainment, year-end pace, show rate, signed per meeting |

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build      # static export to out/
npm start          # serve out/ locally
```

Don't run `npm run build` while `npm run dev` is running; both write to `.next/`.
