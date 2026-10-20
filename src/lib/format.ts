export const fmt = (n: number) =>
  new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n)

export const fmtShort = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + "M kr." : (n / 1e3).toFixed(0) + "K kr."

export function fmtCell(n: number): string {
  if (n <= 0) return ""
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return Math.round(n / 1_000) + "K"
  return Math.round(n).toLocaleString("en-DK")
}

export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("da-DK")
}

/** Local-time yyyy-mm-dd (toISOString would shift the day across timezones). */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const DA_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]

/** "Okt 25", "Maj 26" — same labels as the original dashboard. */
export const monthLabel = (year: number, month0: number) =>
  `${DA_MONTHS[month0]} ${String(year).slice(2)}`

export const daysInMonth = (year: number, month0: number) => new Date(year, month0 + 1, 0).getDate()
