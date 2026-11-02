/**
 * Stage 3a design check — screenshots each new page from the Claude Design
 * export and from the built app, at 1280 and 390, into
 * docs/stages/stage3a/compare/ for a side-by-side review.
 *
 *   BASE_URL=http://localhost:3000 node scripts/design-compare-3a.mjs [page]
 *
 * `page` optionally limits to one of: 404, policy, about (default: all).
 * Requires the app running at BASE_URL and Playwright chromium. The export is
 * served from docs/design-export by a tiny static server so its <dc-import>
 * header/footer resolve over http.
 */
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT_DIR = join(ROOT, 'docs/design-export')
const OUT = join(ROOT, 'docs/stages/stage3a/compare')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// name → [export .dc.html file, built path]. oferta reuses the Політика export
// (one structure, two pages; no separate Оферта export exists).
const PAGES = {
  404: ['DLSAuto-404.dc.html', '/this-page-does-not-exist'],
  policy: ['DLSAuto-Політика-конфіденційності.dc.html', '/policy'],
  oferta: ['DLSAuto-Політика-конфіденційності.dc.html', '/oferta'],
  about: ['DLSAuto-Про-компанію.dc.html', '/about'],
}

const only = process.argv[2]
const names = only ? [only] : Object.keys(PAGES)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
}

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    const file = join(EXPORT_DIR, url === '/' ? 'index.html' : url)
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})

await mkdir(OUT, { recursive: true })
await new Promise((r) => server.listen(0, r))
const port = server.address().port
const browser = await chromium.launch()
const shots = []

for (const name of names) {
  const entry = PAGES[name]
  if (!entry) {
    console.warn('unknown page', name)
    continue
  }
  const [file, builtPath] = entry
  const exportUrl = `http://127.0.0.1:${port}/${encodeURIComponent(file)}`
  for (const [w, label] of [
    [1280, '1280'],
    [390, '390'],
  ]) {
    for (const [kind, url] of [
      ['export', exportUrl],
      ['built', `${BASE_URL}${builtPath}`],
    ]) {
      const page = await browser.newPage({
        viewport: { width: w, height: 900 },
        deviceScaleFactor: 1,
      })
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 })
      } catch {
        await page.waitForTimeout(1500)
      }
      await page.waitForTimeout(1000)
      const path = join(OUT, `${name}-${kind}-${label}.png`)
      await page.screenshot({ path, fullPage: true })
      shots.push(`${name}-${kind}-${label}.png`)
      console.log('shot', name, kind, label)
      await page.close()
    }
  }
}

await browser.close()
server.close()
console.log('wrote', shots.length, 'shots to docs/stages/stage3a/compare/')
