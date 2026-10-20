import { daysInMonth, fmtCell } from "@/lib/format"
import type { DealStage } from "@/lib/mock/deals"
import type { MeetingTableData, RegionKey, ReportData } from "@/lib/mock/salesReport"

export const REGION_LABELS: Record<RegionKey, string> = {
  dk: "Denmark", se: "Sweden", at: "Austria", shipping: "Shipping",
}

/** Probability used to weight open deals in the forecast. */
export const STAGE_PROB: Partial<Record<DealStage, number>> = {
  "Negotiations": 0.3,
  "Subscription Form Sent": 0.7,
}

export const money = (n: number, currency: string) => `${fmtCell(n) || "0"} ${currency}`

export const growth = (now: number, before: number) => (before > 0 ? (now / before - 1) * 100 : null)

/** Per-month totals (index 0 = January) for one consultant, or the whole team. */
export function monthly(report: ReportData, year: number, field: "amount" | "count" = "amount", consultant?: string) {
  const people = consultant ? [consultant] : report.consultants
  return Array.from({ length: 12 }, (_, m) =>
    people.reduce((s, c) => s + (report.data[c]?.[year]?.[m + 1]?.[field] ?? 0), 0))
}

/** Sum of monthly values up to the same point in the year as `today` (current month pro-rated). */
export function samePeriod(values: number[], today: Date) {
  const m = today.getMonth()
  const frac = today.getDate() / daysInMonth(today.getFullYear(), m)
  return values.slice(0, m).reduce((s, v) => s + v, 0) + values[m] * frac
}

const meetingsYtd = (t: MeetingTableData, c: string, year: number) =>
  Object.values(t.data[c]?.[year] ?? {}).reduce((s, n) => s + n, 0)

export type ConsultantRow = {
  name: string
  start: string
  ytd: number
  lySame: number
  yoy: number | null
  target: number
  pctTarget: number | null
  projected: number
  deals: number
  avgTicket: number
  booked: number
  attended: number
  showRate: number | null
  perMeeting: number | null
}

export function consultantRows(
  report: ReportData,
  meetings: { booked: MeetingTableData; attended: MeetingTableData },
  today: Date,
): ConsultantRow[] {
  const year = today.getFullYear()
  const yearStart = new Date(year, 0, 1).getTime()
  const yearEnd = new Date(year + 1, 0, 1).getTime()

  return report.consultants.map(name => {
    const ytd = monthly(report, year, "amount", name).reduce((s, v) => s + v, 0)
    const deals = monthly(report, year, "count", name).reduce((s, v) => s + v, 0)
    const lySame = samePeriod(monthly(report, year - 1, "amount", name), today)
    const target = report.targets[name] ?? 0
    // Run-rate from the later of 1 January and the consultant's start date.
    const from = Math.max(yearStart, new Date(report.startDates[name]).getTime())
    const elapsed = Math.max(1, today.getTime() - from)
    const projected = ytd * (yearEnd - from) / elapsed
    const booked = meetingsYtd(meetings.booked, name, year)
    const attended = meetingsYtd(meetings.attended, name, year)
    return {
      name, start: report.startDates[name], ytd, lySame, yoy: growth(ytd, lySame),
      target, pctTarget: target > 0 ? ytd / target * 100 : null, projected,
      deals, avgTicket: deals > 0 ? ytd / deals : 0,
      booked, attended,
      showRate: booked > 0 ? attended / booked * 100 : null,
      perMeeting: attended > 0 ? ytd / attended : null,
    }
  })
}
