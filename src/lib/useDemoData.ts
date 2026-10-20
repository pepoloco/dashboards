"use client"
import { useEffect, useState } from "react"

/**
 * Builds mock data in the browser, relative to today's date, so the demo never
 * looks stale. Runs after mount to avoid a server/client hydration mismatch.
 * `build` must be a stable (module-level) function.
 */
export function useDemoData<T>(build: (today: Date) => T): T | null {
  const [value, setValue] = useState<T | null>(null)
  useEffect(() => { setValue(build(new Date())) }, [build])
  return value
}
