import { rng, type Rng } from "@/lib/rng"
import { daysInMonth } from "@/lib/format"
import { DK_CONSULTANTS, FUNDS } from "./names"
import { investorName } from "./deals"

export type RegionKey = "dk" | "se" | "at" | "shipping"
export type DealRef = { id: string; name: string; amount: number }
export type Cell = { amount: number; count: number; deals: DealRef[] }

export type ReportData = {
  region: RegionKey
  currency: string
  consultants: string[]
  years: number[]
  data: Record<string, Record<number, Record<number, Cell>>>
  targets: Record<string, number>
  startDates: Record<string, string>
  generatedAt: string
}

export type MeetingTableData = {
  consultants: string[]
  years: number[]
  data: Record<string, Record<number, Record<number, number>>>
}

export type SalesReportData = {
  years: number[]
  today: string
  reports: Record<RegionKey, ReportData>
  meetings: Record<RegionKey, { booked: MeetingTableData; attended: MeetingTableData }>
}

// [name, strength 0–1, start date, yearly target]
type Person = [string, number, string, number]

const REGIONS: Record<RegionKey, { currency: string; unit: number; people: (y: number) => Person[] }> = {
  dk: {
    currency: "DKK", unit: 1,
    people: y => [
      [DK_CONSULTANTS[0], 1.0,  `${y - 2}-04-23`, 120e6],
      [DK_CONSULTANTS[1], 0.95, `${y - 2}-12-20`, 120e6],
      [DK_CONSULTANTS[2], 0.8,  `${y - 2}-02-29`, 120e6],
      [DK_CONSULTANTS[3], 0.6,  `${y - 2}-03-14`, 60e6],
      [DK_CONSULTANTS[4], 0.45, `${y - 2}-03-28`, 60e6],
      [DK_CONSULTANTS[5], 0.5,  `${y - 1}-06-23`, 60e6],
      [DK_CONSULTANTS[6], 0.35, `${y - 1}-07-31`, 60e6],
      [DK_CONSULTANTS[7], 0.3,  `${y}-08-03`,     60e6],
    ],
  },
  se: {
    currency: "SEK", unit: 1,
    people: y => [
      ["Erik Lindqvist", 0.8, `${y - 2}-01-08`, 0],
      ["Anna Bergström", 0.6, `${y - 2}-09-02`, 0],
      ["Johan Ekström",  0.5, `${y - 1}-02-15`, 0],
      ["Maja Sandberg",  0.4, `${y - 1}-10-01`, 0],
      ["Oskar Nyberg",   0.3, `${y}-03-11`,     0],
    ],
  },
  at: {
    currency: "EUR", unit: 0.13,
    people: y => [
      ["Lukas Gruber",  0.7,  `${y - 1}-01-15`, 0],
      ["Julia Steiner", 0.55, `${y - 1}-05-04`, 0],
      ["Felix Hofer",   0.4,  `${y - 1}-11-20`, 0],
      ["Lena Wagner",   0.3,  `${y}-02-02`,     0],
    ],
  },
  shipping: {
    currency: "USD", unit: 0.15,
    people: y => [
      ["Henrik Dahl",    0.6, `${y - 2}-01-02`, 0],
      ["Ingrid Solberg", 0.5, `${y - 2}-06-17`, 0],
      ["Peter Brandt",   0.4, `${y - 1}-04-08`, 0],
    ],
  },
}

const AMOUNTS = [250_000, 500_000, 500_000, 750_000, 1_000_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000]

const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step)

function buildRegion(key: RegionKey, years: number[], today: Date, r: Rng) {
  const cfg = REGIONS[key]
  const people = cfg.people(today.getFullYear())
  const data: ReportData["data"] = {}
  const booked: MeetingTableData["data"] = {}
  const attended: MeetingTableData["data"] = {}
  const targets: Record<string, number> = {}
  const startDates: Record<string, string> = {}
  let seq = 0

  for (const [name, strength, start, target] of people) {
    const startD = new Date(start)
    startDates[name] = start
    if (target) targets[name] = target
    data[name] = {}; booked[name] = {}; attended[name] = {}

    for (const y of years) {
      data[name][y] = {}; booked[name][y] = {}; attended[name][y] = {}
      for (let m = 1; m <= 12; m++) {
        const monthStart = new Date(y, m - 1, 1)
        const monthEnd   = new Date(y, m, 0)
        if (monthEnd < startD || monthStart > today) continue
        const isCurrent = y === today.getFullYear() && m - 1 === today.getMonth()
        const frac = isCurrent ? today.getDate() / daysInMonth(y, m - 1) : 1

        // Meetings
        const b = Math.round(r.int(10, 45) * (0.5 + strength / 2) * frac)
        if (b > 0) {
          booked[name][y][m] = b
          attended[name][y][m] = Math.round(b * (0.6 + r.next() * 0.3))
        }

        // Deals
        if (!r.chance(0.85)) continue
        const n = Math.round(r.int(2, 22) * strength * frac)
        if (n <= 0) continue
        const deals: DealRef[] = []
        for (let i = 0; i < n; i++) {
          const amount = roundTo(r.pick(AMOUNTS) * cfg.unit, cfg.unit < 1 ? 5_000 : 50_000)
          deals.push({ id: `${key}-${++seq}`, name: `${investorName(r)} – ${r.pick(FUNDS)}`, amount })
        }
        data[name][y][m] = { amount: deals.reduce((s, d) => s + d.amount, 0), count: n, deals }
      }
    }
  }

  const consultants = people.map(p => p[0])
  const report: ReportData = {
    region: key, currency: cfg.currency, consultants, years, data, targets, startDates,
    generatedAt: today.toISOString(),
  }
  return { report, meetings: { booked: { consultants, years, data: booked }, attended: { consultants, years, data: attended } } }
}

export function buildSalesReport(today: Date): SalesReportData {
  const r = rng(13579)
  const y = today.getFullYear()
  const years = [y - 2, y - 1, y]
  const keys: RegionKey[] = ["dk", "se", "at", "shipping"]
  const reports = {} as SalesReportData["reports"]
  const meetings = {} as SalesReportData["meetings"]
  for (const k of keys) {
    const out = buildRegion(k, years, today, r)
    reports[k] = out.report
    meetings[k] = out.meetings
  }
  return { years, today: today.toISOString(), reports, meetings }
}
