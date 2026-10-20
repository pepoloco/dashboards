"use client"
import { useEffect, useMemo, useState } from "react"
import DemoNav from "@/components/DemoNav"
import { useDemoData } from "@/lib/useDemoData"
import { buildDkDeals, type Deal } from "@/lib/mock/deals"
import { fmt, fmtDate, fmtShort } from "@/lib/format"

const sum = (arr: Deal[]) => arr.reduce((s, d) => s + d.amount, 0)

const C_NEG  = "var(--blu)", BG_NEG  = "rgba(45,104,176,.08)"
const C_SUB  = "var(--pur)", BG_SUB  = "rgba(90,73,152,.08)"
const C_WON  = "var(--grn)", BG_WON  = "rgba(21,97,76,.08)"
const C_LOST = "var(--gld)", BG_LOST = "rgba(150,128,58,.08)"

function DealTable({ rows, color, dateMode, showSignedVia = false }: {
  rows: Deal[]; color: string; dateMode: "created" | "closed"; showSignedVia?: boolean
}) {
  return (
    <div style={{ overflow: "auto", maxHeight: 480 }}>
      <table className="dt">
        <thead style={{ position: "sticky", top: 0, background: "var(--bei)", zIndex: 1 }}>
          <tr>
            <th>#</th><th>Deal</th><th>Subscription Status</th><th>Pipeline Stage</th>
            <th className="r">Amount</th>
            {showSignedVia && <th>Signed Via</th>}
            <th>Pipeline</th>
            <th>{dateMode === "closed" ? "Closed" : "Created"}</th>
            <th>Deal Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((d, i) => (
            <tr key={d.id}>
              <td><span className="rank">{i + 1}</span></td>
              <td style={{ color, fontWeight: 500, whiteSpace: "nowrap" }}>{d.name}</td>
              <td>{d.subscriptionStatus !== "—" ? <span className="status-pill">{d.subscriptionStatus}</span> : <span style={{ color: "var(--ink3)" }}>—</span>}</td>
              <td style={{ fontSize: 11, color: "var(--ink3)", whiteSpace: "nowrap" }}>{d.dealStage}</td>
              <td className="r" style={{ fontWeight: 600, color, whiteSpace: "nowrap" }}>{fmt(d.amount)}</td>
              {showSignedVia && <td style={{ fontSize: 11, color: "var(--ink3)" }}>{d.signedVia}</td>}
              <td style={{ fontSize: 11, color: "var(--ink3)", whiteSpace: "nowrap" }}>{d.pipeline}</td>
              <td style={{ fontSize: 11, color: "var(--ink3)" }}>{fmtDate(dateMode === "closed" ? d.closedate : d.createdate)}</td>
              <td style={{ fontSize: 11, color: "var(--ink3)", whiteSpace: "nowrap" }}>{d.owner}</td>
            </tr>
          )) : (
            <tr><td colSpan={showSignedVia ? 9 : 8} style={{ textAlign: "center", color: "var(--ink3)", padding: 24 }}>No deals in this filter</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function DealsPage() {
  const data = useDemoData(buildDkDeals)

  const [from, setFrom]         = useState("")
  const [to, setTo]             = useState("")
  const [stage, setStage]       = useState("")
  const [status, setStatus]     = useState("")
  const [pipeline, setPipeline] = useState("")
  const [owner, setOwner]       = useState("")
  const [modal, setModal]       = useState<{ title: string; deals: Deal[] } | null>(null)

  // Default the close-date filter to year-to-date once the data exists.
  useEffect(() => {
    if (data) { setFrom(data.ytdFrom); setTo(data.ytdTo) }
  }, [data])

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [modal])

  const isOpenStage = stage === "Subscription Form Sent" || stage === "Negotiations"

  const { won, lost } = useMemo(() => {
    if (!data) return { won: [] as Deal[], lost: [] as Deal[] }
    const inRange = (iso: string | null) => !!iso && (!from || iso >= from) && (!to || iso <= to)
    const match = (d: Deal) =>
      (!status || d.subscriptionStatus === status) && (!pipeline || d.pipeline === pipeline) && (!owner || d.owner === owner)
    const byStage = (s: string, dateOf: (d: Deal) => string | null) =>
      data.deals.filter(d => d.dealStage === s && inRange(dateOf(d)) && match(d))

    if (isOpenStage) return { won: byStage(stage, d => d.createdate), lost: [] }
    return {
      won:  stage === "Closed Lost" ? [] : byStage("Closed Won",  d => d.closedate),
      lost: stage === "Closed Won"  ? [] : byStage("Closed Lost", d => d.closedate),
    }
  }, [data, from, to, stage, status, pipeline, owner, isOpenStage])

  const hasFilter = !!data && (from !== data.ytdFrom || to !== data.ytdTo || !!stage || !!status || !!pipeline || !!owner)
  const periodLabel = data && (from !== data.ytdFrom || to !== data.ytdTo) ? `${from || "…"} — ${to || "…"}` : `${data?.year ?? ""} YTD`

  return (
    <div className="page-bg" style={{ background: "var(--bei)" }}>
      <DemoNav active="/deals" />
      <main className="wrap wide">
        {!data ? <div className="loading">Loading…</div> : (<>

          {/* ─── DEALS CLOSED ─── */}
          <div className="bar-head" style={{ borderTop: "3px solid var(--grn)" }}>
            <span className="bar-title" style={{ color: "var(--grn)" }}>Deals Closed · Brand Denmark</span>
            <span className="bar-note">Filtered by close date · e-signing integration + Sales · all closed deals</span>
          </div>

          <div className="filters">
            <div className="field">
              <span className="field-lbl">Close Date</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} />
                <span style={{ color: "var(--ink3)" }}>—</span>
                <input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <span className="field-lbl">Pipeline Deal Stage</span>
              <select className="select" value={stage} onChange={e => setStage(e.target.value)}>
                <option value="">All stages</option>
                <option>Closed Won</option>
                <option>Closed Lost</option>
                <option>Subscription Form Sent</option>
                <option>Negotiations</option>
              </select>
            </div>
            <div className="field">
              <span className="field-lbl">Subscription Status</span>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {data.statuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-lbl">Pipeline</span>
              <select className="select" value={pipeline} onChange={e => setPipeline(e.target.value)}>
                <option value="">All pipelines</option>
                {data.pipelines.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-lbl">Deal Owner</span>
              <select className="select" value={owner} onChange={e => setOwner(e.target.value)}>
                <option value="">All owners</option>
                {data.owners.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            {hasFilter && (
              <button className="btn-ghost" onClick={() => { setFrom(data.ytdFrom); setTo(data.ytdTo); setStage(""); setStatus(""); setPipeline(""); setOwner("") }}>
                Clear filter
              </button>
            )}
          </div>

          {stage !== "Closed Lost" && (
            <div className="tcard" style={{ marginTop: 8 }}>
              <div className="tcard-head">
                <span className="tcard-title">{isOpenStage ? stage : "All Deals Closed Won"} · {periodLabel}</span>
                <span className="tcard-sub">{won.length} deals · {fmt(sum(won))}</span>
              </div>
              <DealTable rows={won} color={C_WON} dateMode={isOpenStage ? "created" : "closed"} showSignedVia={!isOpenStage} />
            </div>
          )}

          {!isOpenStage && stage !== "Closed Won" && (
            <div className="tcard" style={{ marginTop: 8 }}>
              <div className="tcard-head">
                <span className="tcard-title">All Deals Closed Lost · {periodLabel}</span>
                <span className="tcard-sub">{lost.length} deals · {fmt(sum(lost))}</span>
              </div>
              <DealTable rows={lost} color={C_LOST} dateMode="closed" />
            </div>
          )}

          {/* ─── PIPELINE REPORT ─── */}
          <div className="bar-head" style={{ marginTop: 32, borderTop: "2px solid var(--blu)" }}>
            <span className="bar-title" style={{ color: "var(--blu)" }}>Pipeline Report · Sales</span>
            <span className="bar-note">All deals · all stages · all Denmark pipelines · {data.year} YTD</span>
          </div>
          <PipelineReport deals={data.deals} pipelines={data.pipelines} onOpen={setModal} />
        </>)}
      </main>

      {modal && (
        <div className="modal-back" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="tcard-title">{modal.title}</div>
                <div className="tcard-sub">{modal.deals.length} deals · {fmt(sum(modal.deals))}</div>
              </div>
              <button className="btn-ghost" onClick={() => setModal(null)}>Close ✕</button>
            </div>
            <div className="modal-body">
              <table className="dt">
                <thead style={{ position: "sticky", top: 0, background: "var(--bei)" }}>
                  <tr><th>#</th><th>Deal</th><th className="r">Amount</th><th>Owner</th><th>Created</th><th>Closed</th></tr>
                </thead>
                <tbody>
                  {modal.deals.map((d, i) => (
                    <tr key={d.id}>
                      <td><span className="rank">{i + 1}</span></td>
                      <td style={{ fontWeight: 500, color: "var(--ink1)", whiteSpace: "nowrap" }}>{d.name}</td>
                      <td className="r" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(d.amount)}</td>
                      <td style={{ fontSize: 11, color: "var(--ink3)", whiteSpace: "nowrap" }}>{d.owner}</td>
                      <td style={{ fontSize: 11, color: "var(--ink3)" }}>{fmtDate(d.createdate)}</td>
                      <td style={{ fontSize: 11, color: "var(--ink3)" }}>{fmtDate(d.closedate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PipelineReport({ deals, pipelines, onOpen }: {
  deals: Deal[]; pipelines: string[]; onOpen: (m: { title: string; deals: Deal[] }) => void
}) {
  const by = (stage: string) => deals.filter(d => d.dealStage === stage)
  const neg = by("Negotiations"), sub = by("Subscription Form Sent"), won = by("Closed Won"), lost = by("Closed Lost")
  const pad = { padding: "8px 14px" }

  const cell = (arr: Deal[], color: string, bg: string, title: string, bold = false) => (
    <td style={{ ...pad, fontSize: 11, textAlign: "center", background: arr.length > 0 ? bg : "transparent", fontWeight: bold ? 700 : undefined }}>
      {arr.length > 0 ? (<>
        <span className="link-count" style={{ fontWeight: 600, color }} onClick={() => onOpen({ title, deals: arr })}>{arr.length}</span><br />
        <span style={{ fontSize: 10, color: "var(--ink3)" }}>{fmtShort(sum(arr))}</span>
      </>) : <span style={{ color: "var(--ink3)" }}>—</span>}
    </td>
  )

  return (
    <div className="tcard" style={{ marginTop: 8 }}>
      <div className="scroll-x">
        <table className="dt">
          <thead style={{ background: "var(--bei)" }}>
            <tr>
              <th style={pad}>Pipeline</th>
              <th style={{ ...pad, textAlign: "center" }}>Negotiations</th>
              <th style={{ ...pad, textAlign: "center" }}>Subscription Form Sent</th>
              <th style={{ ...pad, textAlign: "center" }}>Closed Won</th>
              <th style={{ ...pad, textAlign: "center" }}>Closed Lost</th>
              <th style={{ ...pad, textAlign: "right", color: C_WON }}>Total Won</th>
              <th style={{ ...pad, textAlign: "right", color: C_LOST }}>Total Lost</th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map(pl => {
              const f = (arr: Deal[]) => arr.filter(d => d.pipeline === pl)
              const w = f(won), l = f(lost)
              return (
                <tr key={pl}>
                  <td style={{ ...pad, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{pl}</td>
                  {cell(f(neg), C_NEG,  BG_NEG,  `Negotiations · ${pl}`)}
                  {cell(f(sub), C_SUB,  BG_SUB,  `Subscription Form Sent · ${pl}`)}
                  {cell(w,      C_WON,  BG_WON,  `Closed Won · ${pl}`)}
                  {cell(l,      C_LOST, BG_LOST, `Closed Lost · ${pl}`)}
                  <td className="r" style={{ ...pad, fontSize: 11, fontWeight: 600, color: C_WON, whiteSpace: "nowrap" }}>{w.length ? fmt(sum(w)) : "—"}</td>
                  <td className="r" style={{ ...pad, fontSize: 11, fontWeight: 600, color: C_LOST, whiteSpace: "nowrap" }}>{l.length ? fmt(sum(l)) : "—"}</td>
                </tr>
              )
            })}
            <tr style={{ borderTop: "2px solid var(--bdr)", background: "rgba(18,20,40,.02)" }}>
              <td style={{ ...pad, fontSize: 11, fontWeight: 700, color: "var(--ink1)" }}>Total</td>
              {cell(neg,  C_NEG,  BG_NEG,  "Negotiations · All Pipelines", true)}
              {cell(sub,  C_SUB,  BG_SUB,  "Subscription Form Sent · All Pipelines", true)}
              {cell(won,  C_WON,  BG_WON,  "Closed Won · All Pipelines", true)}
              {cell(lost, C_LOST, BG_LOST, "Closed Lost · All Pipelines", true)}
              <td className="r" style={{ ...pad, fontSize: 11, fontWeight: 700, color: C_WON, whiteSpace: "nowrap" }}>{fmt(sum(won))}</td>
              <td className="r" style={{ ...pad, fontSize: 11, fontWeight: 700, color: C_LOST, whiteSpace: "nowrap" }}>{fmt(sum(lost))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
