import path from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export: the demo is hosted on GitHub Pages next to the portfolio.
  output: "export",
  // Served from a sub-path on Pages (e.g. /dashboards/demo); empty for local dev.
  basePath: process.env.NEXT_BASE_PATH || "",
  // /overview/index.html instead of /overview.html, which Pages serves without rewrites.
  trailingSlash: true,
  poweredByHeader: false,
  // Pin the workspace root; a stray lockfile higher up the tree otherwise confuses Next.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
}

export default nextConfig
