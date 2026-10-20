import { rng } from "@/lib/rng"
import { daysInMonth, monthLabel } from "@/lib/format"

export type MonthRow = { label: string; created: number; onboarded: number; funded: number }
export type WeekRow  = { label: string; created: number; onboarded: number }
export type Device   = { device: string; count: number; pct: number }

export type UsersData = {
  activation: { appDownloads: number; created: number; onboarded: number; funded: number }
  byMonth: MonthRow[]
  cumulative: MonthRow[]
  byWeek: WeekRow[]
  devices: Device[]
}

const MONTHS_SINCE_LAUNCH = 13

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function buildUsersData(today: Date): UsersData {
  const r = rng(424242)

  // ── Monthly sign-ups since launch (current month is partial) ──
  const byMonth: MonthRow[] = []
  for (let i = 0; i < MONTHS_SINCE_LAUNCH; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - (MONTHS_SINCE_LAUNCH - 1) + i, 1)
    const isCurrent = i === MONTHS_SINCE_LAUNCH - 1
    const frac = isCurrent ? today.getDate() / daysInMonth(d.getFullYear(), d.getMonth()) : 1
    const trend = i === 0 ? 10 : 18 + i * 2.2
    const spike = r.chance(0.3) ? r.int(12, 28) : 0
    const created   = Math.max(1, Math.round((trend + r.int(-8, 10) + spike) * frac))
    const onboarded = Math.round(created * (0.48 + r.next() * 0.2))
    const funded    = Math.round(onboarded * (0.18 + r.next() * 0.17))
    byMonth.push({ label: monthLabel(d.getFullYear(), d.getMonth()), created, onboarded, funded })
  }

  let c = 0, o = 0, f = 0
  const cumulative = byMonth.map(m => {
    c += m.created; o += m.onboarded; f += m.funded
    return { label: m.label, created: c, onboarded: o, funded: f }
  })
  const total = cumulative[cumulative.length - 1]

  // ── Last 13 weeks ──
  const byWeek: WeekRow[] = []
  for (let i = 12; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 7)
    const created = r.int(4, 17)
    byWeek.push({ label: `W${isoWeek(d)}`, created, onboarded: Math.round(created * (0.45 + r.next() * 0.3)) })
  }

  // ── Registration device (sums to total registered) ──
  const shares: [string, number][] = [["iOS", 0.31], ["Android", 0.17], ["Desktop web", 0.38], ["Mobile web", 0.14]]
  let remaining = total.created
  const devices: Device[] = shares.map(([device, share], i) => {
    const count = i === shares.length - 1
      ? remaining
      : Math.round(total.created * (share + (r.next() - 0.5) * 0.04))
    remaining -= count
    return { device, count, pct: 0 }
  })
  devices.forEach(d => { d.pct = Math.round(d.count / (total.created || 1) * 100) })
  devices.sort((a, b) => b.count - a.count)

  const appDownloads = devices.filter(d => d.device === "iOS" || d.device === "Android").reduce((s, d) => s + d.count, 0)

  return {
    activation: { appDownloads, created: total.created, onboarded: total.onboarded, funded: total.funded },
    byMonth,
    cumulative,
    byWeek,
    devices,
  }
}
