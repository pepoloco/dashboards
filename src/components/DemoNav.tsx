import Link from "next/link"

const PORTFOLIO_URL = "https://pepobanchev.com/"

const TABS = [
  { href: "/overview",          label: "Executive Overview" },
  { href: "/user-activation",   label: "User Activation" },
  { href: "/deals",             label: "Deals · Denmark" },
  { href: "/pipeline-insights", label: "Pipeline Insights" },
  { href: "/sales-report",      label: "Sales Report" },
  { href: "/scorecard",         label: "Consultant Scorecard" },
]

export default function DemoNav({ active }: { active?: string }) {
  return (
    <>
      <nav className="topnav">
        <Link href="/" className="brand">Sales Dashboards</Link>
        <a href={PORTFOLIO_URL} className="back-btn">Go Back to main page</a>
      </nav>
      <div className="tabs">
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={active === t.href ? "tab active" : "tab"}>
            {t.label}
          </Link>
        ))}
      </div>
    </>
  )
}
