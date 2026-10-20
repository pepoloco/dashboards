/** Change vs last year as a green/red pill; renders nothing without a baseline. */
export default function Delta({ pct, suffix = "vs LY" }: { pct: number | null; suffix?: string }) {
  if (pct === null) return null
  return (
    <span className={pct >= 0 ? "delta up" : "delta down"}>
      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% {suffix}
    </span>
  )
}
