"use client"
import { useMemo } from "react"
import Link from "next/link"
import DemoNav from "@/components/DemoNav"
import ChartCanvas from "@/components/ChartCanvas"
import Delta from "@/components/Delta"
import { useDemoData } from "@/lib/useDemoData"
import { buildSalesReport, type RegionKey, type SalesReportData } from "@/lib/mock/salesReport"
import { buildDkDeals, type DealsData } from "@/lib/mock/deals"
import { buildUsersData, type UsersData } from "@/lib/mock/users"
import { C, baseOptions, legend, scales, tooltip } from "@/lib/chartTheme"
import { fmtCell } from "@/lib/format"
import { REGION_LABELS, STAGE_PROB, consultantRows, growth, money, monthly, samePeriod } from "@/lib/salesMetrics"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const REGIONS: RegionKey[] = ["dk", "se", "at", "shipping"]

const pct = (n: number, of: number) => Math.round(n / (of || 1) * 100)
const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0)

function summarise(sales: SalesReportData, deals: DealsData, users: UsersData) {
  const today = new Date(sales.today)
  const year = today.getFullYear(), m = today.getMonth()
  const dk = sales.reports.dk

  // Denmark: this year vs last year
  const thisYear = monthly(dk, year), lastYear = monthly(dk, year - 1)
  const ytd = sum(thisYear), lySame = samePeriod(lastYear, today)
  const teamTarget = sum(Object.values(dk.targets))
  const rows = consultantRows(dk, sales.meetings.dk, today)
  const projected = sum(rows.map(r => r.projected))

  // Deals: win rate and open pipeline
  const won  = deals.deals.filter(d => d.dealStage === "Closed Won")
  const lost = deals.deals.filter(d => d.dealStage === "Closed Lost")
  const open = deals.deals.filter(d => STAGE_PROB[d.dealStage] !== undefined)
  const openValue = sum(open.map(d => d.amount))
  const weighted  = sum(open.map(d => d.amount * (STAGE_PROB[d.dealStage] ?? 0)))

  const regions = REGIONS.map(k => {
    const r = sales.reports[k]
    const now = sum(monthly(r, year)), before = samePeriod(monthly(r, year - 1), today)
    const deals = sum(monthly(r, year, "count"))
    const attended = sum(r.consultants.map(c => sum(Object.values(sales.meetings[k].attended.data[c]?.[year] ?? {}))))
    return { key: k, label: REGION_LABELS[k], currency: r.currency, now, before, yoy: growth(now, before), deals, attended, team: r.consultants.length }
  })

  let a = 0, b = 0
  const cumThis = thisYear.map((v, i) => (i <= m ? (a += v) : null))
  const cumLast = lastYear.map(v => (b += v))
  const pace = MONTHS.map((_, i) => teamTarget / 12 * (i + 1))

  return {
    today, year, ytd, lySame, yoy: growth(ytd, lySame), teamTarget, projected,
    winRate: pct(won.length, won.length + lost.length), won, lost, open, openValue, weighted,
    act: users.activation, regions,
    top: [...rows].sort((x, y) => y.ytd - x.ytd).slice(0, 5),
    thisYear: thisYear.map((v, i) => (i <= m ? v : null)), lastYear, cumThis, cumLast, pace,
  }
}

type Summary = ReturnType<typeof summarise>

function buildCharts(s: Summary) {
  const yTicks = { ...scales.y, ticks: { ...scales.y.ticks, callback: (v: unknown) => fmtCell(Number(v)) || "0" } }
  const tip = { ...tooltip, displayColors: true, callbacks: { label: (c: { dataset: { label?: string }; raw: unknown }) => ` ${c.dataset.label}: ${money(Number(c.raw), "DKK")}` } }
  const opts = { ...baseOptions, interaction: { mode: "index", intersect: false }, plugins: { legend, tooltip: tip }, scales: { ...scales, y: yTicks } }
  return {
    monthly: {
      type: "bar",
      data: { labels: MONTHS, datasets: [
        { label: `${s.year}`,     data: s.thisYear, backgroundColor: C.Gd, borderColor: C.G, borderWidth: 1.5, borderRadius: 4 },
        { label: `${s.year - 1}`, data: s.lastYear, backgroundColor: "rgba(122,126,154,.12)", borderColor: C.MU, borderWidth: 1.5, borderRadius: 4 },
      ] },
      options: opts,
    },
    cumulative: {
      type: "line",
      data: { labels: MONTHS, datasets: [
        { label: `${s.year} YTD`,  data: s.cumThis, borderColor: C.G, backgroundColor: C.Gd, fill: true, tension: .3, pointRadius: 3, borderWidth: 2.5 },
        { label: `${s.year - 1}`,  data: s.cumLast, borderColor: C.MU, backgroundColor: "transparent", tension: .3, pointRadius: 0, borderWidth: 2 },
        { label: "Target pace",    data: s.pace,    borderColor: C.A, backgroundColor: "transparent", borderDash: [6, 4], pointRadius: 0, borderWidth: 2 },
      ] },
      options: opts,
    },
  }
}

function Kpi({ label, value, color, children }: { label: string; value: string; color: string; children: React.ReactNode }) {
  return (
    <div className="kpi" style={{ borderTopColor: color }}>
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val" style={{ color, fontSize: 30 }}>{value}</div>
      <div className="kpi-sub">{children}</div>
    </div>
  )
}

export default function OverviewPage() {
  const sales = useDemoData(buildSalesReport)
  const deals = useDemoData(buildDkDeals)
  const users = useDemoData(buildUsersData)
  const s = useMemo(() => sales && deals && users && summarise(sales, deals, users), [sales, deals, users])
  const charts = useMemo(() => s && buildCharts(s), [s])
  const asOf = s?.today.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="page-bg">
      <DemoNav active="/overview" />
      <main className="wrap">
        <div style={{ marginBottom: 24 }}>
          <div className="page-eyebrow">Leadership</div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-sub">Sales, pipeline and investor app on one page · {s ? `${s.year} YTD to ${asOf}` : ""}</p>
        </div>

        {!s || !charts ? <div className="loading">Loading…</div> : (<>
          <div className="g5">
            <Kpi label="Signed YTD · Denmark" value={money(s.ytd, "DKK")} color={C.G}>
              <Delta pct={s.yoy} /> same period LY {fmtCell(s.lySame)}
            </Kpi>
            <Kpi label="Team target attainment" value={`${pct(s.ytd, s.teamTarget)}%`} color={C.B}>
              of {money(s.teamTarget, "DKK")} · on pace for {pct(s.projected, s.teamTarget)}%
            </Kpi>
            <Kpi label="Win rate" value={`${s.winRate}%`} color={C.P}>
              {s.won.length} won · {s.lost.length} lost · closed deals YTD
            </Kpi>
            <Kpi label="Weighted pipeline" value={money(s.weighted, "DKK")} color={C.A}>
              {s.open.length} open deals · {fmtCell(s.openValue)} unweighted
            </Kpi>
            <Kpi label="Funded app users" value={String(s.act.funded)} color={C.R}>
              {pct(s.act.funded, s.act.created)}% of {s.act.created} registered since launch
            </Kpi>
          </div>

          <div className="sec"><span className="sec-text">Denmark · signed volume</span></div>
          <div className="g2">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Signed per month</div><div className="cc-sub">Closed Won · {s.year} vs {s.year - 1} · DKK</div></div></div>
              <ChartCanvas config={charts.monthly} height={240} />
            </div>
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Cumulative vs target pace</div><div className="cc-sub">Team yearly target spread evenly across months</div></div></div>
              <ChartCanvas config={charts.cumulative} height={240} />
            </div>
          </div>

          <div className="g2 mt">
            <div className="tcard">
              <div className="tcard-head">
                <span className="tcard-title">Regions · {s.year} YTD vs same period last year</span>
                <Link href="/sales-report" className="tcard-sub" style={{ color: "var(--blu)" }}>Sales report →</Link>
              </div>
              <div className="scroll-x">
                <table className="dt">
                  <thead><tr><th>Region</th><th className="r">Signed YTD</th><th className="r">Deals</th><th className="r">Meetings held</th><th className="r">vs LY</th></tr></thead>
                  <tbody>
                    {s.regions.map(r => (
                      <tr key={r.key}>
                        <td style={{ fontWeight: 600, color: "var(--ink1)" }}>{r.label}<div style={{ fontSize: 10, color: "var(--ink3)", fontWeight: 400 }}>{r.team} consultants</div></td>
                        <td className="r" style={{ fontWeight: 600, color: "var(--ink1)" }}>{money(r.now, r.currency)}</td>
                        <td className="r">{r.deals}</td>
                        <td className="r">{r.attended}</td>
                        <td className="r"><Delta pct={r.yoy} suffix="" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="tcard">
              <div className="tcard-head">
                <span className="tcard-title">Top consultants · Denmark YTD</span>
                <Link href="/scorecard" className="tcard-sub" style={{ color: "var(--blu)" }}>Full scorecard →</Link>
              </div>
              <div style={{ padding: "6px 20px 14px" }}>
                {s.top.map((r, i) => {
                  const p = r.pctTarget ?? 0
                  const color = p >= 100 ? "var(--grn)" : p >= 75 ? "#d97706" : "#dc2626"
                  return (
                    <div key={r.name} style={{ padding: "9px 0", borderBottom: i < s.top.length - 1 ? "1px solid var(--bdr)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink1)" }}><span className="rank">{i + 1}</span>{r.name}</span>
                        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          <b style={{ color: "var(--ink1)" }}>{fmtCell(r.ytd)}</b>
                          <span style={{ color, fontWeight: 700, marginLeft: 8 }}>{r.pctTarget !== null ? `${r.pctTarget.toFixed(0)}%` : "—"}</span>
                        </span>
                      </div>
                      <div className="pbar"><span style={{ width: `${Math.min(100, p)}%`, background: color }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>)}
      </main>
    </div>
  )
}
