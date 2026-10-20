"use client"
import { useMemo, useState } from "react"
import DemoNav from "@/components/DemoNav"
import ChartCanvas from "@/components/ChartCanvas"
import Delta from "@/components/Delta"
import { useDemoData } from "@/lib/useDemoData"
import { buildSalesReport, type RegionKey } from "@/lib/mock/salesReport"
import { C, baseOptions, legend, scales, tooltip } from "@/lib/chartTheme"
import { fmtCell } from "@/lib/format"
import { REGION_LABELS, consultantRows, money, type ConsultantRow } from "@/lib/salesMetrics"

const REGIONS: RegionKey[] = ["dk", "se", "at", "shipping"]
const POINT = [C.G, C.P, C.A, C.B, C.R, "#0f766e", "#c2410c", "#3730a3"]

type SortKey = "ytd" | "pctTarget" | "projected" | "yoy" | "deals" | "avgTicket" | "attended" | "showRate" | "perMeeting"

const COLUMNS: { key: SortKey; label: string; title: string }[] = [
  { key: "ytd",        label: "Signed YTD",   title: "Closed Won this year" },
  { key: "pctTarget",  label: "% Target",     title: "Signed YTD / yearly target" },
  { key: "projected",  label: "Year-end pace", title: "Run-rate since 1 Jan (or start date) extended to 31 Dec" },
  { key: "yoy",        label: "vs LY",        title: "Signed YTD vs same period last year" },
  { key: "deals",      label: "Deals",        title: "Closed Won deals this year" },
  { key: "avgTicket",  label: "Avg ticket",   title: "Signed YTD / deals" },
  { key: "attended",   label: "Meetings held", title: "Meetings attended (consultant is host)" },
  { key: "showRate",   label: "Show rate",    title: "Meetings attended / meetings booked" },
  { key: "perMeeting", label: "Signed / meeting", title: "Signed YTD / meetings attended" },
]

const pctColor = (p: number | null) =>
  p === null ? "var(--ink3)" : p >= 100 ? "#059669" : p >= 75 ? "#d97706" : p >= 50 ? "#ea580c" : "#dc2626"

const sum = (rows: ConsultantRow[], f: (r: ConsultantRow) => number) => rows.reduce((s, r) => s + f(r), 0)

function buildCharts(rows: ConsultantRow[], currency: string) {
  const money2 = (v: unknown) => money(Number(v), currency)
  return {
    scatter: {
      type: "scatter",
      data: { datasets: rows.map((r, i) => ({
        label: r.name, data: [{ x: r.attended, y: r.ytd }],
        backgroundColor: POINT[i % POINT.length], borderColor: "#fff", borderWidth: 1.5, pointRadius: 7, pointHoverRadius: 9,
      })) },
      options: { ...baseOptions,
        plugins: { legend: { ...legend, position: "bottom" }, tooltip: { ...tooltip, callbacks: {
          label: (c: { dataset: { label?: string }; raw: { x: number; y: number } }) => ` ${c.dataset.label}: ${c.raw.x} meetings · ${money2(c.raw.y)}`,
        } } },
        scales: {
          x: { ...scales.x, title: { display: true, text: "Meetings held YTD", color: C.MU, font: { size: 10 } } },
          y: { ...scales.y, ticks: { ...scales.y.ticks, callback: (v: unknown) => fmtCell(Number(v)) || "0" } },
        },
      },
    },
    pace: {
      type: "bar",
      data: { labels: rows.map(r => r.name), datasets: [
        { label: "Signed YTD",    data: rows.map(r => r.ytd),       backgroundColor: C.Gd, borderColor: C.G, borderWidth: 1.5, borderRadius: 4 },
        { label: "Year-end pace", data: rows.map(r => r.projected), backgroundColor: C.Bd, borderColor: C.B, borderWidth: 1.5, borderRadius: 4 },
        ...(rows.some(r => r.target > 0)
          ? [{ label: "Target", data: rows.map(r => r.target || null), backgroundColor: "transparent", borderColor: C.A, borderWidth: 2, borderDash: [4, 3], borderRadius: 4 }]
          : []),
      ] },
      options: { ...baseOptions, indexAxis: "y", interaction: { mode: "index", intersect: false },
        plugins: { legend, tooltip: { ...tooltip, displayColors: true, callbacks: {
          label: (c: { dataset: { label?: string }; raw: unknown }) => ` ${c.dataset.label}: ${money2(c.raw)}`,
        } } },
        scales: { ...scales, x: { ...scales.x, ticks: { ...scales.x.ticks, callback: (v: unknown) => fmtCell(Number(v)) || "0" } } },
      },
    },
  }
}

export default function ScorecardPage() {
  const data = useDemoData(buildSalesReport)
  const [region, setRegion] = useState<RegionKey>("dk")
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "ytd", desc: true })

  const report = data?.reports[region]
  const currency = report?.currency ?? ""
  const rows = useMemo(() => data ? consultantRows(data.reports[region], data.meetings[region], new Date(data.today)) : [], [data, region])
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = a[sort.key] ?? -Infinity, bv = b[sort.key] ?? -Infinity
    return sort.desc ? bv - av : av - bv
  }), [rows, sort])
  const charts = useMemo(() => buildCharts([...rows].sort((a, b) => b.ytd - a.ytd), currency), [rows, currency])

  const ytd = sum(rows, r => r.ytd), deals = sum(rows, r => r.deals)
  const attended = sum(rows, r => r.attended), booked = sum(rows, r => r.booked)
  const target = sum(rows, r => r.target), projected = sum(rows, r => r.projected)
  const lySame = sum(rows, r => r.lySame)

  const fmtVal = (r: ConsultantRow, k: SortKey) => {
    const v = r[k]
    if (v === null) return "—"
    switch (k) {
      case "ytd": case "projected": case "avgTicket": case "perMeeting": return fmtCell(v) || "—"
      case "pctTarget": case "showRate": return `${v.toFixed(0)}%`
      case "yoy": return <Delta pct={v} suffix="" />
      default: return String(v)
    }
  }

  return (
    <div className="page-bg">
      <DemoNav active="/scorecard" />
      <main className="wrap wide">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div className="page-eyebrow">Report</div>
            <h1 className="page-title">Consultant Scorecard</h1>
            <p className="page-sub">Activity → outcome per consultant · {data ? `${new Date(data.today).getFullYear()} YTD` : ""} · {currency}</p>
          </div>
          <div className="seg">
            {REGIONS.map(k => (
              <button key={k} className={k === region ? "on" : ""} onClick={() => setRegion(k)}>{REGION_LABELS[k]}</button>
            ))}
          </div>
        </div>

        {!data || !report ? <div className="loading">Loading…</div> : (<>
          <div className="g5">
            <div className="kpi" style={{ borderTopColor: C.G }}>
              <div className="kpi-lbl">Team signed YTD</div>
              <div className="kpi-val" style={{ color: C.G, fontSize: 30 }}>{money(ytd, currency)}</div>
              <div className="kpi-sub"><Delta pct={lySame > 0 ? (ytd / lySame - 1) * 100 : null} /> {rows.length} consultants</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.B }}>
              <div className="kpi-lbl">Year-end pace</div>
              <div className="kpi-val" style={{ color: C.B, fontSize: 30 }}>{money(projected, currency)}</div>
              <div className="kpi-sub">{target > 0 ? `${(projected / target * 100).toFixed(0)}% of ${fmtCell(target)} team target` : "No targets set for this region"}</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.P }}>
              <div className="kpi-lbl">Meetings held</div>
              <div className="kpi-val" style={{ color: C.P, fontSize: 30 }}>{attended}</div>
              <div className="kpi-sub">{booked > 0 ? `${(attended / booked * 100).toFixed(0)}% show rate` : ""} · {booked} booked</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.A }}>
              <div className="kpi-lbl">Signed per meeting</div>
              <div className="kpi-val" style={{ color: C.A, fontSize: 30 }}>{money(attended > 0 ? ytd / attended : 0, currency)}</div>
              <div className="kpi-sub">what one held meeting is worth</div>
            </div>
            <div className="kpi" style={{ borderTopColor: C.R }}>
              <div className="kpi-lbl">Avg ticket</div>
              <div className="kpi-val" style={{ color: C.R, fontSize: 30 }}>{money(deals > 0 ? ytd / deals : 0, currency)}</div>
              <div className="kpi-sub">{deals} deals closed YTD</div>
            </div>
          </div>

          <div className="tcard" style={{ marginTop: 16 }}>
            <div className="tcard-head">
              <span className="tcard-title">Scorecard · {REGION_LABELS[region]}</span>
              <span className="tcard-sub">Click a column to sort</span>
            </div>
            <div className="scroll-x">
              <table className="dt">
                <thead style={{ background: "var(--bei)" }}>
                  <tr>
                    <th>#</th><th className="stick" style={{ background: "var(--bei)" }}>Consultant</th>
                    {COLUMNS.map(c => (
                      <th key={c.key} className="r th-sort" title={c.title}
                        onClick={() => setSort(s => ({ key: c.key, desc: s.key === c.key ? !s.desc : true }))}
                        style={{ color: sort.key === c.key ? "var(--ink1)" : undefined }}>
                        {c.label}{sort.key === c.key ? (sort.desc ? " ↓" : " ↑") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={r.name}>
                      <td><span className="rank">{i + 1}</span></td>
                      <td className="stick" style={{ whiteSpace: "nowrap", background: "#fff" }}>
                        <div style={{ fontWeight: 600, color: "var(--ink1)" }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: "var(--ink3)" }}>since {new Date(r.start).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</div>
                      </td>
                      {COLUMNS.map(c => (
                        <td key={c.key} className="r" style={{
                          whiteSpace: "nowrap",
                          fontWeight: c.key === "ytd" || c.key === "pctTarget" ? 700 : undefined,
                          color: c.key === "pctTarget" ? pctColor(r.pctTarget) : c.key === "ytd" ? "var(--ink1)" : undefined,
                        }}>
                          {c.key === "pctTarget" && r.pctTarget !== null ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                              <div className="pbar" style={{ width: 60 }}><span style={{ width: `${Math.min(100, r.pctTarget)}%`, background: pctColor(r.pctTarget) }} /></div>
                              {fmtVal(r, c.key)}
                            </div>
                          ) : fmtVal(r, c.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="g2 mt">
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Meetings held vs signed volume</div><div className="cc-sub">Each dot is a consultant · up and to the right is best</div></div></div>
              <ChartCanvas config={charts.scatter} height={300} />
            </div>
            <div className="cc">
              <div className="cc-head"><div><div className="cc-title">Signed YTD vs year-end pace</div><div className="cc-sub">Current run-rate extended to 31 Dec{target > 0 ? " · dashed = yearly target" : ""}</div></div></div>
              <ChartCanvas config={charts.pace} height={300} />
            </div>
          </div>
        </>)}
      </main>
    </div>
  )
}
