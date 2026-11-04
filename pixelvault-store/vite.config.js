import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { BUG_IDS, resolveBugSpec } from './src/lib/bug-ids.js'

// Seeded bugs are chosen with npm flags (npm exposes them as npm_config_* env vars):
//   npm run dev                  -> no bugs (same as --bugless)
//   npm run dev --bugless        -> no bugs
//   npm run dev --bugs=all       -> every bug
//   npm run dev --bugs=5         -> the first 5 bugs (BUG-01..BUG-05)
//   npm run dev --bugs=BUG-03,BUG-07   -> exactly these
// The same flags work for `npm run build`. A ?bugs=... URL param still overrides per page load.
function bugsFromFlags(env) {
  const bugs = env.npm_config_bugs
  const bugless = env.npm_config_bugless
  const wantsBugless = bugless !== undefined && bugless !== '' && bugless !== 'false'
  const usage = `Use --bugs=all, --bugs=<0-${BUG_IDS.length}>, --bugs=BUG-01,BUG-02 or --bugless.`

  if (wantsBugless && bugs !== undefined) {
    throw new Error(`[pixelvault] Pass either --bugless or --bugs, not both. ${usage}`)
  }
  if (wantsBugless || bugs === undefined) return []

  const { ids, error, clamped } = resolveBugSpec(bugs)
  if (error) throw new Error(`[pixelvault] Bad --bugs value "${bugs}". ${error}. ${usage}`)
  if (clamped) console.warn(`[pixelvault] Only ${BUG_IDS.length} bugs exist; enabling all of them.`)
  return ids
}

const defaultBugs = bugsFromFlags(process.env)
console.log(
  defaultBugs.length
    ? `[pixelvault] ${defaultBugs.length} of ${BUG_IDS.length} bugs enabled: ${defaultBugs.join(', ')}`
    : '[pixelvault] bugless: no bugs enabled',
)

// base './' keeps the build portable (GitHub Pages, any static host).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __PV_DEFAULT_BUGS__: JSON.stringify(defaultBugs) },
  server: { port: 5173 },
  preview: { port: 4173 },
})
