/**
 * Stage 1 design check — screenshots the Контакти page from the Claude Design
 * export and from the built app, at 1280 and 390, into
 * docs/stages/stage1/compare/ for a side-by-side review.
 *
 *   BASE_URL=http://localhost:3000 node scripts/design-compare.mjs
 *
 * Requires the dev/stage app running at BASE_URL (built page) and Playwright
 * chromium installed. The export is served from docs/design-export by a tiny
 * static server so its <dc-import> header/footer resolve over http.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXPORT_DIR = join(ROOT, 'docs/design-export')
const OUT = join(ROOT, 'docs/stages/stage1/compare')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

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

await new Promise((r) => server.listen(0, r))
const port = server.address().port
const exportUrl = `http://127.0.0.1:${port}/DLSAuto-%D0%9A%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8.dc.html`

const browser = await chromium.launch()
const shots = []
for (const [w, name] of [
  [1280, '1280'],
  [390, '390'],
]) {
  for (const [kind, url] of [
    ['export', exportUrl],
    ['built', `${BASE_URL}/contacts`],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
    } catch {
      await page.waitForTimeout(1500)
    }
    await page.waitForTimeout(800)
    const path = join(OUT, `${kind}-${name}.png`)
    await page.screenshot({ path, fullPage: true })
    shots.push(`${kind}-${name}.png`)
    console.log('shot', kind, name)
    await page.close()
  }
}
await browser.close()
server.close()
console.log('wrote', shots.join(', '), 'to docs/stages/stage1/compare/')
