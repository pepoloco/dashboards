"use client"
import { useMemo } from "react"
import DemoNav from "@/components/DemoNav"
import ChartCanvas from "@/components/ChartCanvas"
import { useDemoData } from "@/lib/useDemoData"
import { buildDkDeals, type Deal, type DealsData } from "@/lib/mock/deals"
import { C, baseOptions, legend, scales, tooltip } from "@/lib/chartTheme"
import { fmt, fmtCell } from "@/lib/format"
import { STAGE_PROB, money } from "@/lib/salesMetrics"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const FUND_COLORS = [C.G, C.P, C.A, C.B, C.R, "#0f766e"]
const FUND_BG     = [C.Gd, C.Pd, C.Ad, C.Bd, C.Rd, "rgba(15,118,110,.12)"]
const AGE_BUCKETS: [string, number][] = [["0–14 days", 14], ["15–30 days", 30], ["31–60 days", 60], ["60+ days", Infinity]]

const sum = (arr: Deal[]) => arr.reduce((s, d) => s + d.amount, 0)
const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86400000
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0)
const weighted = (arr: Deal[]) => arr.reduce((s, d) => s + d.amount * (STAGE_PROB[d.dealStage] ?? 0), 0)

function stats(deals: Deal[]) {
  const won  = deals.filter(d => d.dealStage === "Closed Won")
  const lost = deals.filter(d => d.dealStage === "Closed Lost")
  const open = deals.filter(d => STAGE_PROB[d.dealStage] !== undefined)
  return {
    total: deals.length, won, lost, open,
    winRate: won.length + lost.length > 0 ? won.length / (won.length + lost.length) * 100 : null,
    avgTicket: won.length ? sum(won) / won.length : 0,
    cycle: avg(won.map(d => days(d.createdate, d.closedate!))),
    weighted: weighted(open),
  }
}

function analyse(data: DealsData) {
  const all = stats(data.deals)
  const channels = data.pipelines.map(p => ({ name: p, ...stats(data.deals.filter(d => d.pipeline === p)) }))
    .sort((a, b) => sum(b.won) - sum(a.won))
  const funds = [...new Set(data.deals.map(d => d.fund))]
    .map(f => ({ fund: f, value: sum(all.won.filter(d => d.fund === f)) }))
    .sort((a, b) => b.value - a.value)
  const digital = all.won.filter(d => d.signedVia === "Investor App").length

  const thisMonth = new Date(data.ytdTo).getMonth()
  const byMonth = (arr: Deal[]) => MONTHS.map((_, m) => sum(arr.filter(d => new Date(d.closedate!).getMonth() === m)))
  const age = (stage: string) => AGE_BUCKETS.map(([, max], i) => all.open.filter(d => {
    const a = days(d.createdate, data.ytdTo)
    return d.dealStage === stage && a <= max && (i === 0 || a > AGE_BUCKETS[i - 1][1])
  }).length)

  return {
    all, channels, funds, digital, months: MONTHS.slice(0, thisMonth + 1),
    wonByMonth: byMonth(all.won).slice(0, thisMonth + 1), lostByMonth: byMonth(all.lost).slice(0, thisMonth + 1),
    ageNeg: age("Negotiations"), ageSub: age("Subscription Form Sent"),
  }
}

type Analysis = ReturnType<typeof analyse>

function buildCharts(a: Analysis) {
  const bar = (label: string, data: number[], color: string, bg: string) =>
    ({ label, data, backgroundColor: bg, borderColor: color, borderWidth: 1.5, borderRadius: 4 })
  return {
    monthly: {
      type: "bar",
      data: { labels: a.months, datasets: [bar("Won", a.wonByMonth, C.G, C.Gd), bar("Lost", a.lostByMonth, C.A, C.Ad)] },
      options: { ...baseOptions, interaction: { mode: "index", intersect: false },
        plugins: { legend, tooltip: { ...tooltip, displayColors: true, callbacks: {
          label: (c: { dataset: { label?: string }; raw: unknown }) => ` ${c.dataset.label}: ${money(Number(c.raw), "DKK")}`,
        } } },
        scales: { ...scales, y: { ...scales.y, ticks: { ...scales.y.ticks, callback: (v: unknown) => fmtCell(Number(v)) || "0" } } },
      },
    },
    winRate: {
      type: "bar",
      data: { labels: a.channels.map(c => c.name), datasets: [{
        data: a.channels.map(c => Math.round(c.winRate ?? 0)), backgroundColor: C.Pd, borderColor: C.P, borderWidth: 1.5, borderRadius: 4,
      }] },
      options: { ...baseOptions, indexAxis: "y",
        plugins: { ...baseOptions.plugins, tooltip: { ...tooltip, callbacks: { label: (c: { raw: unknown }) => ` ${c.raw}% win rate` } } },
        scales: { ...scales, x: { ...scales.x, min: 0, max: 100, ticks: { ...scales.x.ticks, callback: (v: unknown) => v + "%" } } },
      },
    },
    funds: {
      type: "doughnut",
      data: { labels: a.funds.map(f => f.fund), datasets: [{
        data: a.funds.map(f => f.value), backgroundColor: FUND_BG, borderColor: FUND_COLORS, borderWidth: 2, hoverOffset: 5,
      }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "64%", animation: { duration: 500 },
        plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { label: (c: { raw: unknown }) => ` ${money(Number(c.raw), "DKK")}` } } } },
    },
    ageing: {
      type: "bar",
      data: { labels: AGE_BUCKETS.map(b => b[0]), datasets: [
        bar("Negotiations", a.ageNeg, C.B, C.Bd),
        bar("Subscription Form Sent", a.ageSub, C.P, C.Pd),
      ] },
      options: { ...baseOptions, interaction: { mode: "index", intersect: false },
        plugins: { legend, tooltip: { ...tooltip, displayColors: true } },
        scales: { x: { ...scales.x, stacked: true }, y: { ...scales.y, stacked: true, ticks: { ...scales.y.ticks, precision: 0 } } },
      },
    },
  }
}

export default function PipelineInsightsPage() {
  const data = useDemoData(buildDkDeals)
  const a = useMemo(() => data && analyse(data), [data])
  const charts = useMemo(() => a && buildCharts(a), [a])
  const fundTotal = a ? a.funds.reduce((s, f) => s + f.value, 0) : 0

  return (
    <div className="page-bg">
      <DemoNav active="/pipeline-insights" />
      <main className="wrap">
        <div style={{ marginBottom: 24 }}>
          <div className="page-eyebrow">Report</div>
          <h1 className="page-title">Pipeline Insights · Denmark</h1>
          <p className="page-sub">Which channels and funds convert, how fast, and what the open pipeline is worth · {data?.year} YTD · DKK</p>
        </div>

        {!data || !a || !charts ? <div className="loading">Loading…</div> : (<>
          <div className="g5">
            <div className="kpi" style={{ borderTopColor: C.P }}>
              <div className="kpi-lbl">Win rate</div>
              <div className="kpi-val" style={{ color: C.P }}>{(a.all.winRate ?? 0).toFixed(0)}%</div>
              <div className="kpi-sub">{a.all.won.length} won of {a.all.won.length + a.all.lost.length} closed</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.G }}>
              <div className="kpi-lbl">Avg ticket</div>
              <div className="kpi-val" style={{ color: C.G }}>{fmtCell(a.all.avgTicket)}</div>
              <div className="kpi-sub">DKK per Closed Won deal</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.B }}>
              <div className="kpi-lbl">Days to close</div>
              <div className="kpi-val" style={{ color: C.B }}>{a.all.cycle.toFixed(0)}</div>
              <div className="kpi-sub">avg created → Closed Won</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.A }}>
              <div className="kpi-lbl">Forecast</div>
              <div className="kpi-val" style={{ color: C.A }}>{fmtCell(a.all.weighted)}</div>
              <div className="kpi-sub">{a.all.open.length} open deals · {fmtCell(sum(a.all.open))} unweighted</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.R }}>
              <div className="kpi-lbl">Signed in app</div>
              <div className="kpi-val" style={{ color: C.R }}>{Math.round(a.digital / (a.all.won.length || 1) * 100)}%</div>
              <div className="kpi-sub">{a.digital} of {a.all.won.length} won deals via Investor App</div>
            </div>
          </div>

          <div className="sec"><span className="sec-text">Channel performance</span></div>
          <div className="tcard">
            <div className="tcard-head">
              <span className="tcard-title">By pipeline · ranked by won value</span>
              <span className="tcard-sub">Forecast weights: Negotiations {STAGE_PROB["Negotiations"]! * 100}% · Subscription Form Sent {STAGE_PROB["Subscription Form Sent"]! * 100}%</span>
            </div>
            <div className="scroll-x">
              <table className="dt">
                <thead style={{ background: "var(--bei)" }}>
                  <tr>
                    <th>Pipeline</th><th className="r">Deals</th><th className="r">Won</th><th className="r">Lost</th><th className="r">Open</th>
                    <th className="r">Win rate</th><th className="r">Won value</th><th className="r">Avg ticket</th><th className="r">Days to close</th><th className="r">Forecast</th>
                  </tr>
                </thead>
                <tbody>
                  {a.channels.map(c => (
                    <tr key={c.name}>
                      <td style={{ fontWeight: 600, color: "var(--ink1)", whiteSpace: "nowrap" }}>{c.name}</td>
                      <td className="r">{c.total}</td>
                      <td className="r" style={{ color: "var(--grn)" }}>{c.won.length}</td>
                      <td className="r" style={{ color: "var(--gld)" }}>{c.lost.length}</td>
                      <td className="r">{c.open.length}</td>
                      <td className="r" style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <div className="pbar" style={{ width: 60 }}><span style={{ width: `${c.winRate ?? 0}%`, background: "var(--pur)" }} /></div>
                          <b style={{ minWidth: 32 }}>{c.winRate !== null ? `${c.winRate.toFixed(0)}%` : "—"}</b>
                        </div>
                      </td>
                      <td className="r" style={{ fontWeight: 600, color: "var(--grn)", whiteSpace: "nowrap" }}>{fmt(sum(c.won))}</td>
                      <td className="r">{fmtCell(c.avgTicket) || "—"}</td>
                      <td className="r">{c.won.length ? c.cycle.toFixed(0) : "—"}</td>
                      <td className="r" style={{ color: "var(--gld)", fontWeight: 600 }}>{fmtCell(c.weighted) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="g2 mt">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Win rate by pipeline</div><div className="cc-sub">Won / (Won + Lost)</div></div></div>
              <ChartCanvas config={charts.winRate} />
            </div>
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Won vs lost per month</div><div className="cc-sub">by close date · DKK</div></div></div>
              <ChartCanvas config={charts.monthly} />
            </div>
          </div>

          <div className="sec"><span className="sec-text">Product mix &amp; open pipeline</span></div>
          <div className="g2">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Won value by fund</div><div className="cc-sub">Closed Won · {data.year} YTD</div></div></div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ width: 180, flexShrink: 0 }}><ChartCanvas config={charts.funds} height={180} /></div>
                <div style={{ flex: 1, minWidth: 200, paddingTop: 4 }}>
                  {a.funds.map((f, i) => (
                    <div key={f.fund} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #e2ddd4" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: FUND_COLORS[i % FUND_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--ink2)" }}>{f.fund}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink1)" }}>{fmtCell(f.value)}</span>
                        <span style={{ fontSize: 11, color: "var(--ink3)", minWidth: 32, textAlign: "right" }}>{Math.round(f.value / (fundTotal || 1) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Open pipeline ageing</div><div className="cc-sub">Open deals by days since created · older deals need follow-up</div></div></div>
              <ChartCanvas config={charts.ageing} />
            </div>
          </div>
        </>)}
      </main>
    </div>
  )
}
