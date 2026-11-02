/**
 * Mobile Lighthouse for one or more URLs (STAGE_3A §4). Runs the default mobile
 * preset and reports Performance + Accessibility; exits non-zero if either is
 * below the threshold (default 90). Drive it against a PRODUCTION server
 * (`pnpm build && pnpm start`) — dev-mode scores are not meaningful.
 *
 *   pnpm lighthouse http://localhost:3000/about [more urls...]
 *   THRESHOLD=90 pnpm lighthouse <url>
 *
 * Uses Playwright's bundled Chromium over the DevTools protocol, so no separate
 * Chrome install is needed.
 */
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'

const urls = process.argv.slice(2)
if (!urls.length) {
  console.error('usage: pnpm lighthouse <url> [url...]')
  process.exit(2)
}
const THRESHOLD = Number(process.env.THRESHOLD || 90)
const PORT = 9222

const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] })
let failed = false
try {
  for (const url of urls) {
    const { lhr } = await lighthouse(
      url,
      { port: PORT, output: 'json', logLevel: 'error' },
      {
        extends: 'lighthouse:default',
        settings: { onlyCategories: ['performance', 'accessibility'] },
      },
    )
    const perf = Math.round((lhr.categories.performance.score ?? 0) * 100)
    const a11y = Math.round((lhr.categories.accessibility.score ?? 0) * 100)
    const ok = perf >= THRESHOLD && a11y >= THRESHOLD
    if (!ok) failed = true
    console.log(`${ok ? '✓' : '✖'} ${url}  perf ${perf}  a11y ${a11y}`)
  }
} finally {
  await browser.close()
}
process.exit(failed ? 1 : 0)
