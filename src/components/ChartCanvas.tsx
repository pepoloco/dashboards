"use client"
import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"
import type { ChartConfiguration } from "chart.js"

Chart.defaults.font.family = "'Space Grotesk', sans-serif"

/** Pass a memoised config — the chart is rebuilt whenever the object changes. */
export default function ChartCanvas({ config, height = 220 }: { config: object; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = new Chart(ref.current, config as ChartConfiguration)
    return () => chart.destroy()
  }, [config])

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <canvas ref={ref} />
    </div>
  )
}
