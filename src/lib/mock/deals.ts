import { rng, type Rng } from "@/lib/rng"
import { isoDate } from "@/lib/format"
import { DK_CONSULTANTS, DK_PIPELINES, FUNDS, INVESTOR_FIRST, INVESTOR_LAST } from "./names"

export type DealStage = "Closed Won" | "Closed Lost" | "Subscription Form Sent" | "Negotiations"

export type Deal = {
  id: string
  name: string
  amount: number
  dealStage: DealStage
  subscriptionStatus: string
  pipeline: string
  fund: string
  owner: string
  signedVia: string
  createdate: string
  closedate: string | null
}

export type DealsData = {
  deals: Deal[]
  ytdFrom: string
  ytdTo: string
  year: number
  pipelines: string[]
  owners: string[]
  statuses: string[]
}

const AMOUNTS = [250_000, 250_000, 500_000, 500_000, 750_000, 750_000, 1_000_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000]

export const investorName = (r: Rng) => `${r.pick(INVESTOR_FIRST)} ${r.pick(INVESTOR_LAST)}`

const STATUS: Record<DealStage, string> = {
  "Closed Won": "Signed",
  "Closed Lost": "Cancelled",
  "Subscription Form Sent": "Documents missing",
  "Negotiations": "—",
}

export function buildDkDeals(today: Date): DealsData {
  const r = rng(777001)
  const year = today.getFullYear()
  const start = new Date(year, 0, 1)
  const spanDays = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000))
  const count = Math.round(spanDays * 0.9)

  const deals: Deal[] = []
  for (let i = 0; i < count; i++) {
    const created = new Date(start.getTime() + r.int(0, spanDays) * 86400000)
    const roll = r.next()
    let stage: DealStage =
      roll < 0.58 ? "Closed Won" :
      roll < 0.72 ? "Closed Lost" :
      roll < 0.86 ? "Subscription Form Sent" : "Negotiations"

    let closed: Date | null = null
    if (stage === "Closed Won" || stage === "Closed Lost") {
      closed = new Date(created.getTime() + r.int(2, 40) * 86400000)
      // A deal can't close in the future — keep it open instead.
      if (closed > today) { closed = null; stage = r.chance(0.5) ? "Subscription Form Sent" : "Negotiations" }
    }

    const fund = r.pick(FUNDS)
    deals.push({
      id: `D-${10000 + i}`,
      name: `${investorName(r)} – ${fund}`,
      amount: r.pick(AMOUNTS),
      dealStage: stage,
      subscriptionStatus: STATUS[stage],
      pipeline: r.pick(DK_PIPELINES),
      fund,
      owner: r.pick(DK_CONSULTANTS),
      signedVia: stage === "Closed Won" ? (r.chance(0.7) ? "Scrive" : "Investor App") : "—",
      createdate: isoDate(created),
      closedate: closed ? isoDate(closed) : null,
    })
  }

  deals.sort((a, b) => (b.closedate ?? b.createdate).localeCompare(a.closedate ?? a.createdate))

  return {
    deals,
    ytdFrom: isoDate(start),
    ytdTo: isoDate(today),
    year,
    pipelines: [...DK_PIPELINES].sort(),
    owners: [...DK_CONSULTANTS].sort(),
    statuses: [...new Set(deals.map(d => d.subscriptionStatus).filter(s => s !== "—"))].sort(),
  }
}
