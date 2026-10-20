import Link from "next/link"
import DemoNav from "@/components/DemoNav"

const CARDS = [
  {
    href: "/overview",
    title: "Executive Overview",
    text: "One page for leadership: signed volume vs last year and target pace, win rate, weighted pipeline, regional growth and top consultants.",
    color: "var(--ink)",
  },
  {
    href: "/user-activation",
    title: "User Activation",
    text: "App sign-ups, KYC completion and funded users since launch: growth curves, activation funnel, weekly activity and registration devices.",
    color: "var(--pur)",
  },
  {
    href: "/deals",
    title: "Deals · Denmark",
    text: "Closed won and closed lost deals with live filters by close date, stage, status, pipeline and owner, plus a pipeline report by stage.",
    color: "var(--grn)",
  },
  {
    href: "/pipeline-insights",
    title: "Pipeline Insights",
    text: "Win rate, ticket size and days to close per channel, won volume by fund, weighted forecast and ageing of open deals.",
    color: "var(--gld)",
  },
  {
    href: "/sales-report",
    title: "Sales Report by Consultant",
    text: "Signed volume per consultant per month across three years, tracked against yearly targets, with meeting activity per region.",
    color: "var(--blu)",
  },
  {
    href: "/scorecard",
    title: "Consultant Scorecard",
    text: "Sortable ranking per region: target attainment, year-end pace, show rate and signed volume per meeting held.",
    color: "var(--red)",
  },
]

export default function Home() {
  return (
    <div className="page-bg">
      <DemoNav />
      <main className="wrap">
        <div className="page-eyebrow">Live demo</div>
        <h1 className="page-title">Sales &amp; leadership dashboards</h1>
        <p className="page-sub" style={{ maxWidth: 640 }}>
          Rebuilt from internal dashboards that run on CRM data, shipped with Next.js and Vercel.
          Every number, name and fund on these pages is randomised mock data.
        </p>
        <div className="hub-grid">
          {CARDS.map(c => (
            <Link key={c.href} href={c.href} className="hub-card" style={{ borderTopColor: c.color }}>
              <h2>{c.title}</h2>
              <p>{c.text}</p>
              <span className="go" style={{ color: c.color }}>Open dashboard</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
