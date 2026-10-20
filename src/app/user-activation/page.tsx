"use client"
import { useMemo } from "react"
import DemoNav from "@/components/DemoNav"
import ChartCanvas from "@/components/ChartCanvas"
import { useDemoData } from "@/lib/useDemoData"
import { buildUsersData, type UsersData } from "@/lib/mock/users"
import { C, baseOptions, legend, scales, tooltip } from "@/lib/chartTheme"

const DEV_COLORS = [C.G, C.P, C.A, C.B, "#8b5cf6", C.R]
const DEV_BG     = [C.Gd, C.Pd, C.Ad, C.Bd, "rgba(139,92,246,.12)", C.Rd]

const pct = (n: number, of: number) => Math.round(n / (of || 1) * 100)

function buildCharts(d: UsersData) {
  const act = d.activation
  const lineDs = (label: string, data: number[], color: string) =>
    ({ label, data, borderColor: color, backgroundColor: "transparent", tension: .4, pointRadius: 3, pointBackgroundColor: color, borderWidth: 2.5 })
  const barDs = (label: string, data: number[], color: string, bg: string) =>
    ({ label, data, backgroundColor: bg, borderColor: color, borderWidth: 1.5, borderRadius: 4 })
  const withLegend = { ...baseOptions, interaction: { mode: "index", intersect: false }, plugins: { ...baseOptions.plugins, legend } }
  const doughnutOpts = (tip: (v: number) => string) => ({
    responsive: true, maintainAspectRatio: false, cutout: "64%", animation: { duration: 500 },
    plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { label: (c: { raw: unknown }) => tip(Number(c.raw)) } } },
  })

  return {
    cumulative: {
      type: "line",
      data: { labels: d.cumulative.map(m => m.label), datasets: [
        lineDs("Created",   d.cumulative.map(m => m.created),   C.G),
        lineDs("Onboarded", d.cumulative.map(m => m.onboarded), C.P),
        lineDs("Funded",    d.cumulative.map(m => m.funded),    C.A),
      ] },
      options: withLegend,
    },
    perMonth: {
      type: "bar",
      data: { labels: d.byMonth.map(m => m.label), datasets: [
        barDs("Created",   d.byMonth.map(m => m.created),   C.G, C.Gd),
        barDs("Onboarded", d.byMonth.map(m => m.onboarded), C.P, C.Pd),
        barDs("Funded",    d.byMonth.map(m => m.funded),    C.A, C.Ad),
      ] },
      options: withLegend,
    },
    funnel: {
      type: "bar",
      data: { labels: ["Created", "Onboarded", "Funded"], datasets: [{
        data: [act.created, act.onboarded, act.funded],
        backgroundColor: [C.Gd, C.Pd, C.Ad], borderColor: [C.G, C.P, C.A], borderWidth: 1.5, borderRadius: 5,
      }] },
      options: { ...baseOptions, indexAxis: "y", plugins: { ...baseOptions.plugins, tooltip: { ...tooltip, callbacks: {
        label: (c: { raw: unknown }) => ` ${Number(c.raw)} (${pct(Number(c.raw), act.created)}%)`,
      } } } },
    },
    rate: {
      type: "line",
      data: { labels: d.cumulative.map(m => m.label), datasets: [
        lineDs("Onboarding rate", d.cumulative.map(m => pct(m.onboarded, m.created)), C.P),
      ] },
      options: { ...baseOptions,
        plugins: { ...baseOptions.plugins, tooltip: { ...tooltip, callbacks: { label: (c: { raw: unknown }) => ` ${Number(c.raw)}%` } } },
        scales: { ...scales, y: { ...scales.y, min: 0, max: 100, ticks: { ...scales.y.ticks, callback: (v: unknown) => v + "%" } } },
      },
    },
    weekly: {
      type: "bar",
      data: { labels: d.byWeek.map(w => w.label), datasets: [
        barDs("Signed up",    d.byWeek.map(w => w.created),   C.G, C.Gd),
        barDs("KYC complete", d.byWeek.map(w => w.onboarded), C.P, C.Pd),
      ] },
      options: withLegend,
    },
    devices: {
      type: "doughnut",
      data: { labels: d.devices.map(x => x.device), datasets: [{
        data: d.devices.map(x => x.count),
        backgroundColor: DEV_BG.slice(0, d.devices.length), borderColor: DEV_COLORS.slice(0, d.devices.length),
        borderWidth: 2, hoverOffset: 5,
      }] },
      options: doughnutOpts(v => ` ${v} (${pct(v, act.created)}%)`),
    },
  }
}

export default function UserActivationPage() {
  const data = useDemoData(buildUsersData)
  const charts = useMemo(() => data && buildCharts(data), [data])
  const act = data?.activation

  return (
    <div className="page-bg">
      <DemoNav active="/user-activation" />
      <main className="wrap">
        <div style={{ marginBottom: 24 }}>
          <div className="page-eyebrow">Report</div>
          <h1 className="page-title">User Activation · Investor App</h1>
          <p className="page-sub">Contacts with customer ID, excluding test accounts · DKK</p>
        </div>

        {!data || !charts || !act ? <div className="loading">Loading…</div> : (<>

          {/* ── User Activation KPIs ── */}
          <div className="sec"><span className="sec-text">User Activation · Since launch</span></div>
          <div className="g5">
            <div className="kpi" style={{ borderTopColor: C.B }}>
              <div className="kpi-lbl">Downloaded app</div>
              <div className="kpi-val" style={{ color: C.B }}>{act.appDownloads}</div>
              <div className="kpi-sub">{pct(act.appDownloads, act.created)}% · iOS + Android registrations</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.G }}>
              <div className="kpi-lbl">Registered users</div>
              <div className="kpi-val" style={{ color: C.G }}>{act.created}</div>
              <div className="kpi-sub">have customer ID · excl. internal</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.P }}>
              <div className="kpi-lbl">KYC complete</div>
              <div className="kpi-val" style={{ color: C.P }}>{act.onboarded}</div>
              <div className="kpi-sub">{pct(act.onboarded, act.created)}% of registered</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.R }}>
              <div className="kpi-lbl">KYC pending</div>
              <div className="kpi-val" style={{ color: C.R }}>{act.created - act.onboarded}</div>
              <div className="kpi-sub">{pct(act.created - act.onboarded, act.created)}% of registered</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.A }}>
              <div className="kpi-lbl">Funded users</div>
              <div className="kpi-val" style={{ color: C.A }}>{act.funded}</div>
              <div className="kpi-sub">total AuC ≥ 1 · invested</div>
            </div>
          </div>

          {/* ── Growth ── */}
          <div className="sec"><span className="sec-text">Growth over time · Since launch</span></div>
          <div className="g2">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Cumulative users</div><div className="cc-sub">Created · Onboarded · Funded</div></div></div>
              <ChartCanvas config={charts.cumulative} />
            </div>
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">New users per month</div><div className="cc-sub">signup_time</div></div></div>
              <ChartCanvas config={charts.perMonth} />
            </div>
          </div>
          <div className="cc mt">
            <div className="cc-head"><div><div className="cc-title">Activation funnel</div><div className="cc-sub">Created → Onboarded → Funded · since launch</div></div></div>
            <ChartCanvas config={charts.funnel} height={200} />
          </div>
          <div className="g2 mt">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Onboarding rate over time</div><div className="cc-sub">Cumulative Onboarded / Created</div></div></div>
              <ChartCanvas config={charts.rate} />
            </div>
            <div className="cc" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div className="cc-head"><div><div className="cc-title">Activation rate</div><div className="cc-sub">Onboarded / Created · since launch</div></div></div>
              <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-.02em", color: C.P, lineHeight: 1, paddingBottom: 8 }}>
                {pct(act.onboarded, act.created)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--ink3)" }}>{act.onboarded} of {act.created} users onboarded</div>
            </div>
          </div>

          {/* ── Weekly activity ── */}
          <div className="sec"><span className="sec-text">Weekly activity · last 13 weeks</span></div>
          <div className="g2">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Weekly sign-ups &amp; KYC completions</div><div className="cc-sub">signup_time · onboarding_complete_time</div></div></div>
              <ChartCanvas config={charts.weekly} />
            </div>
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Registration Device</div><div className="cc-sub">registration_device · all registered users</div></div></div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ width: 180, flexShrink: 0 }}><ChartCanvas config={charts.devices} height={180} /></div>
                <div style={{ flex: 1, minWidth: 180, paddingTop: 4 }}>
                  {data.devices.map((d, i) => (
                    <div key={d.device} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2ddd4" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: DEV_COLORS[i % DEV_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "var(--ink2)" }}>{d.device}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink1)" }}>{d.count}</span>
                        <span style={{ fontSize: 11, color: "var(--ink3)", minWidth: 32, textAlign: "right" }}>{d.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>)}
      </main>
    </div>
  )
}
