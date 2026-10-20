"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import DemoNav from "@/components/DemoNav"
import { useDemoData } from "@/lib/useDemoData"
import { fmtCell } from "@/lib/format"
import {
  buildSalesReport, type DealRef, type MeetingTableData, type RegionKey, type ReportData,
} from "@/lib/mock/salesReport"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const TABS: { key: RegionKey; label: string; subtitle: string; coac: boolean }[] = [
  { key: "dk",       label: "Denmark",  subtitle: "Phone Sales · DKK",  coac: true  },
  { key: "se",       label: "Sweden",   subtitle: "Phone Sales · SEK",  coac: true  },
  { key: "at",       label: "Austria",  subtitle: "Team Austria · EUR", coac: true  },
  { key: "shipping", label: "Shipping", subtitle: "All owners · USD",   coac: false },
]

const PALETTE = [
  { bg: "#92400e", text: "#fff", light: "#fef3c7" },
  { bg: "#065f46", text: "#fff", light: "#d1fae5" },
  { bg: "#1d4ed8", text: "#fff", light: "#dbeafe" },
  { bg: "#6d28d9", text: "#fff", light: "#ede9fe" },
  { bg: "#c2410c", text: "#fff", light: "#ffedd5" },
  { bg: "#3730a3", text: "#fff", light: "#e0e7ff" },
  { bg: "#be123c", text: "#fff", light: "#ffe4e6" },
  { bg: "#0369a1", text: "#fff", light: "#e0f2fe" },
  { bg: "#0f766e", text: "#fff", light: "#ccfbf1" },
]
const clr = (i: number) => PALETTE[i % PALETTE.length]

const bdr  = "1px solid var(--bdr)"
const bdr2 = "2px solid var(--bdr)"

function Flag({ region }: { region: RegionKey }) {
  const box = { width: 32, height: 22, borderRadius: 3, flexShrink: 0, display: "block" } as const
  if (region === "dk") return (
    <svg viewBox="0 0 37 28" style={box}><rect width="37" height="28" fill="#c8102e" /><rect x="12" width="4" height="28" fill="#fff" /><rect y="12" width="37" height="4" fill="#fff" /></svg>
  )
  if (region === "se") return (
    <svg viewBox="0 0 16 10" style={box}><rect width="16" height="10" fill="#006aa7" /><rect x="5" width="2" height="10" fill="#fecc00" /><rect y="4" width="16" height="2" fill="#fecc00" /></svg>
  )
  if (region === "at") return (
    <svg viewBox="0 0 9 6" style={box}><rect width="9" height="6" fill="#c8102e" /><rect y="2" width="9" height="2" fill="#fff" /></svg>
  )
  return (
    <svg viewBox="0 0 32 22" style={box}>
      <rect width="32" height="22" fill="#0f4c5c" />
      <path d="M7 13h18l-3 4H10z" fill="#fff" /><rect x="15" y="5" width="2" height="8" fill="#fff" /><path d="M17 6l5 5h-5z" fill="#9fd8df" />
    </svg>
  )
}

function DealPopover({ deals, x, y, onClose }: { deals: DealRef[]; x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const popW = Math.min(340, window.innerWidth - 24)
  const left = x + popW > window.innerWidth - 12 ? Math.max(12, x - popW - 4) : x + 8
  const top  = Math.max(8, Math.min(y - 20, window.innerHeight - 320))

  return (
    <div ref={ref} style={{
      position: "fixed", left, top, zIndex: 9999, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,.18)", width: popW, maxHeight: 320, overflowY: "auto", fontSize: 12,
    }}>
      <div style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: ".07em", textTransform: "uppercase" }}>
        {deals.length} Deal{deals.length !== 1 ? "s" : ""}
      </div>
      {deals.map((d, i) => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 14px", borderBottom: i < deals.length - 1 ? "1px solid #f9fafb" : "none" }}>
          <span style={{ color: "#111827", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
          <span style={{ color: "#0091ae", fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fmtCell(d.amount)}</span>
        </div>
      ))}
    </div>
  )
}

const yearLabel = (y: number, current: number) => (y === current ? `${y} YTD` : String(y))

function ConsultantHeader({ consultants, years, current, startDates }: {
  consultants: string[]; years: number[]; current: number; startDates?: Record<string, string>
}) {
  return (<>
    <tr>
      <th rowSpan={2} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink3)", borderBottom: bdr2, borderRight: bdr2, verticalAlign: "bottom", whiteSpace: "nowrap", background: "var(--bg)" }}>Month</th>
      {consultants.map((c, ci) => (
        <th key={c} colSpan={years.length} style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, background: clr(ci).bg, color: clr(ci).text, borderRight: bdr2, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em" }}>
          {c}
          {startDates?.[c] && (
            <span style={{ display: "block", fontSize: 9, fontWeight: 400, opacity: 0.75, marginTop: 2 }}>
              since {new Date(startDates[c]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </th>
      ))}
    </tr>
    <tr>
      {consultants.map((c, ci) => years.map((y, yi) => (
        <th key={`${c}-${y}`} style={{ padding: "5px 10px", textAlign: "right", fontSize: 9, fontWeight: 700, color: clr(ci).bg, background: clr(ci).light, borderBottom: bdr, borderRight: yi === years.length - 1 ? bdr2 : bdr, whiteSpace: "nowrap" }}>
          {yearLabel(y, current)}
        </th>
      )))}
    </tr>
  </>)
}

function SalesTable({ report, current }: { report: ReportData; current: number }) {
  const { consultants, data, years, targets, startDates } = report
  const [popover, setPopover] = useState<{ deals: DealRef[]; x: number; y: number } | null>(null)

  const totals = useMemo(() => {
    const t: Record<string, Record<number, number>> = {}
    for (const c of consultants) {
      t[c] = {}
      for (const y of years) t[c][y] = Object.values(data[c]?.[y] ?? {}).reduce((s, cell) => s + cell.amount, 0)
    }
    return t
  }, [consultants, years, data])

  // No target for years before the consultant started.
  const targetFor = (c: string, y: number) =>
    startDates[c] && new Date(startDates[c]).getFullYear() > y ? 0 : targets[c] ?? 0

  const sideTh = (label: string, last = false) => (
    <th style={{ padding: "5px 16px", textAlign: "left", fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink3)", borderBottom: last ? bdr2 : bdr, borderRight: bdr2, whiteSpace: "nowrap", background: "var(--bg)" }}>{label}</th>
  )

  return (
    <>
      {popover && <DealPopover {...popover} onClose={() => setPopover(null)} />}
      <div className="scroll-x">
        <table style={{ fontSize: 12 }}>
          <thead>
            <ConsultantHeader consultants={consultants} years={years} current={current} startDates={startDates} />
            <tr>
              {sideTh("Target")}
              {consultants.map(c => years.map((y, yi) => {
                const target = targetFor(c, y)
                return (
                  <th key={`${c}-${y}`} style={{ padding: "5px 10px", textAlign: "right", fontSize: 9, fontWeight: 600, color: "var(--ink3)", background: "var(--bg)", borderBottom: bdr, borderRight: yi === years.length - 1 ? bdr2 : bdr, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {target > 0 ? fmtCell(target) : "—"}
                  </th>
                )
              }))}
            </tr>
            <tr>
              {sideTh("% of Target", true)}
              {consultants.map(c => years.map((y, yi) => {
                const target = targetFor(c, y)
                const p = target > 0 ? (totals[c][y] / target) * 100 : null
                const color = p === null ? "var(--ink3)" : p >= 100 ? "#059669" : p >= 75 ? "#d97706" : p >= 50 ? "#ea580c" : "#dc2626"
                return (
                  <th key={`${c}-${y}`} style={{ padding: "5px 10px", textAlign: "right", fontSize: 10, fontWeight: 700, color, background: "var(--bg)", borderBottom: bdr2, borderRight: yi === years.length - 1 ? bdr2 : bdr, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {p !== null ? `${p.toFixed(1)}%` : "—"}
                  </th>
                )
              }))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, mi) => (
              <tr key={month} style={{ background: mi % 2 === 0 ? "var(--card)" : "var(--bg)" }}>
                <td style={{ padding: "9px 16px", fontWeight: 600, fontSize: 12, color: "var(--ink2)", borderRight: bdr2, borderBottom: bdr, whiteSpace: "nowrap" }}>{month}</td>
                {consultants.map((c, ci) => years.map((y, yi) => {
                  const cell = data[c]?.[y]?.[mi + 1]
                  const clickable = !!cell && cell.amount > 0
                  return (
                    <td key={`${c}-${y}`}
                      onClick={clickable ? e => { e.stopPropagation(); setPopover({ deals: cell.deals, x: e.clientX, y: e.clientY }) } : undefined}
                      style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", borderRight: yi === years.length - 1 ? bdr2 : bdr, borderBottom: bdr, cursor: clickable ? "pointer" : "default", whiteSpace: "nowrap" }}>
                      {clickable ? (<>
                        <div style={{ fontSize: 13, fontWeight: 700, color: clr(ci).bg, lineHeight: 1.2 }}>{fmtCell(cell.amount)}</div>
                        <div style={{ fontSize: 9, color: "var(--ink3)", lineHeight: 1.3 }}>{cell.count} deal{cell.count !== 1 ? "s" : ""}</div>
                      </>) : <span style={{ color: "var(--ink3)", opacity: .4, fontSize: 11 }}>—</span>}
                    </td>
                  )
                }))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: bdr2 }}>
              <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 10, color: "var(--ink1)", letterSpacing: ".06em", textTransform: "uppercase", borderRight: bdr2 }}>Total</td>
              {consultants.map((c, ci) => years.map((y, yi) => {
                const total = totals[c][y]
                return (
                  <td key={`${c}-${y}`} style={{ padding: "10px", textAlign: "right", fontWeight: 700, fontSize: 13, fontVariantNumeric: "tabular-nums", color: total > 0 ? clr(ci).bg : "var(--ink3)", background: total > 0 ? clr(ci).light : "transparent", borderRight: yi === years.length - 1 ? bdr2 : bdr, whiteSpace: "nowrap" }}>
                    {total > 0 ? fmtCell(total) : "—"}
                  </td>
                )
              }))}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}

function MeetingsCountTable({ report, title, current }: {
  report: MeetingTableData; title: string; current: number
}) {
  const { consultants, years, data } = report
  const count = (c: string, y: number, m: number) => data[c]?.[y]?.[m] ?? 0
  const total = (c: string, y: number) => Array.from({ length: 12 }, (_, i) => count(c, y, i + 1)).reduce((s, n) => s + n, 0)

  return (
    <div style={{ borderTop: bdr2 }}>
      <div style={{ padding: "10px 16px", background: "var(--bg)", borderBottom: bdr, fontSize: 12, fontWeight: 700, color: "var(--ink2)", letterSpacing: ".04em" }}>{title}</div>
      <div className="scroll-x">
        <table style={{ fontSize: 12 }}>
          <thead><ConsultantHeader consultants={consultants} years={years} current={current} /></thead>
          <tbody>
            {MONTHS.map((month, mi) => (
              <tr key={month} style={{ background: mi % 2 === 0 ? "var(--card)" : "var(--bg)" }}>
                <td style={{ padding: "9px 16px", fontWeight: 600, fontSize: 12, color: "var(--ink2)", borderRight: bdr2, borderBottom: bdr, whiteSpace: "nowrap" }}>{month}</td>
                {consultants.map((c, ci) => years.map((y, yi) => {
                  const n = count(c, y, mi + 1)
                  return (
                    <td key={`${c}-${y}`} style={{ padding: "7px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", borderRight: yi === years.length - 1 ? bdr2 : bdr, borderBottom: bdr }}>
                      {n > 0 ? <div style={{ fontSize: 13, fontWeight: 700, color: clr(ci).bg }}>{n}</div> : <span style={{ color: "var(--ink3)", opacity: .4, fontSize: 11 }}>—</span>}
                    </td>
                  )
                }))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: bdr2 }}>
              <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 10, color: "var(--ink1)", letterSpacing: ".06em", textTransform: "uppercase", borderRight: bdr2 }}>Total</td>
              {consultants.map((c, ci) => years.map((y, yi) => {
                const t = total(c, y)
                return (
                  <td key={`${c}-${y}`} style={{ padding: "10px", textAlign: "right", fontWeight: 700, fontSize: 13, color: t > 0 ? clr(ci).bg : "var(--ink3)", background: t > 0 ? clr(ci).light : "transparent", borderRight: yi === years.length - 1 ? bdr2 : bdr }}>
                    {t > 0 ? t : "—"}
                  </td>
                )
              }))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default function SalesReportPage() {
  const data = useDemoData(buildSalesReport)
  const [region, setRegion]   = useState<RegionKey>("dk")
  const [section, setSection] = useState<"deals" | "meetings">("deals")

  const tab = TABS.find(t => t.key === region)!
  const current = data?.years[data.years.length - 1] ?? 0
  const ytdLabel = data ? new Date(data.today).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""

  return (
    <div className="page-bg">
      <DemoNav active="/sales-report" />
      <main className="wrap wide">
        <div style={{ marginBottom: 20 }}>
          <div className="page-eyebrow">Report</div>
          <h1 className="page-title">Sales Report by Consultant</h1>
          <p className="page-sub">Closed Won deals and meeting activity by consultant</p>
        </div>

        {!data ? <div className="loading">Loading…</div> : (<>
          {/* Region tabs */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--bdr)", overflowX: "auto" }}>
            {TABS.map(t => {
              const active = t.key === region
              return (
                <button key={t.key} onClick={() => setRegion(t.key)} style={{
                  padding: "10px 20px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                  fontWeight: active ? 700 : 500, color: active ? "var(--ink1)" : "var(--ink3)", background: "transparent",
                  borderBottom: active ? "2px solid var(--ink1)" : "2px solid transparent", marginBottom: -2,
                  display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
                }}>
                  <Flag region={t.key} />{t.label}
                </button>
              )
            })}
          </div>

          <div style={{ background: "var(--card)", border: bdr, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
            {/* Region subtitle + Deals | Meetings */}
            <div style={{ padding: "10px 16px", borderBottom: bdr, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Flag region={tab.key} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink1)" }}>{tab.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                    {tab.subtitle}{tab.coac ? " · compliance-checked" : " · all Closed Won"} · {current} YTD to {ytdLabel}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, background: "var(--bdr)", borderRadius: 8, padding: 3 }}>
                {(["deals", "meetings"] as const).map(s => (
                  <button key={s} onClick={() => setSection(s)} style={{
                    padding: "5px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                    fontWeight: section === s ? 700 : 500, background: section === s ? "var(--card)" : "transparent",
                    color: section === s ? "var(--ink1)" : "var(--ink3)", boxShadow: section === s ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                  }}>
                    {s === "deals" ? "Deals" : "Meetings"}
                  </button>
                ))}
              </div>
            </div>

            {section === "deals" && (<>
              <SalesTable key={region} report={data.reports[region]} current={current} />
              <div style={{ textAlign: "right", fontSize: 10, color: "var(--ink3)", padding: "8px 16px", borderTop: bdr }}>
                {data.reports[region].currency} · Grouped by deal owner + close date · Click a cell to see its deals · Generated: {new Date(data.today).toLocaleString("en-GB")}
              </div>
            </>)}

            {section === "meetings" && (
              <div>
                <MeetingsCountTable report={data.meetings[region].booked}   title="Meetings Booked (created by consultant)"    current={current} />
                <MeetingsCountTable report={data.meetings[region].attended} title="All Meetings Attended (consultant is host)" current={current} />
              </div>
            )}
          </div>
        </>)}
      </main>
    </div>
  )
}
