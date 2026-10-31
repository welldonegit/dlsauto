/**
 * Design audit — Stage 1.
 *
 * Scans the Claude Design export (docs/design-export/*.dc.html) and inventories
 * every styling value with its frequency and the files it appears in:
 *   - numeric lengths by role (spacing, sizes, radius, border-width, position,
 *     translate), icon sizes, control heights, durations
 *   - colors (hex + rgba)
 *   - typography (font-size, line-height, font-weight, letter-spacing)
 *   - box-shadow ladder
 *
 * It parses two complementary sources:
 *   1. "Declaration" pass — CSS declarations inside style="…" / style-hover /
 *      style-focus attributes and <style> blocks. Well categorised by property.
 *   2. "Computed" pass — px/color/duration literals inside the <script> logic
 *      blocks, where device-specific values live (e.g. side/block padding,
 *      1312px container). Categorisation is best-effort (by nearest token).
 *
 * Output: docs/stages/stage1/inventory.md (+ a compact summary to stdout).
 * This script only reads the export and writes the report — it changes nothing else.
 *
 * Run: pnpm tsx scripts/design-audit.ts
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const EXPORT_DIR = join(ROOT, 'docs/design-export')
const OUT_DIR = join(ROOT, 'docs/stages/stage1')

/** value -> { count, files:Set } */
type Bucket = Map<string, { count: number; files: Set<string> }>
const bucket = (): Bucket => new Map()
function add(b: Bucket, key: string, file: string, n = 1) {
  const e = b.get(key) ?? { count: 0, files: new Set<string>() }
  e.count += n
  e.files.add(file)
  b.set(key, e)
}

// Per-color occurrence log (file + property/context) so rare colors can be
// reviewed one by one — the owner decides each distinct color's token, 1:1.
type ColorLoc = { file: string; context: string }
const colorLocs = new Map<string, ColorLoc[]>()
function logColor(color: string, file: string, context: string) {
  const k = color
  const arr = colorLocs.get(k) ?? []
  if (arr.length < 12) arr.push({ file: file.replace(/\.dc\.html$/, ''), context })
  colorLocs.set(k, arr)
}

// Categories of px-valued lengths, keyed by the CSS property they came from.
const cat = {
  spacing: bucket(),
  size: bucket(),
  radius: bucket(),
  border: bucket(),
  position: bucket(),
  translate: bucket(),
  icon: bucket(), // svg/img width/height attributes
  stroke: bucket(), // svg stroke-width
  controlH: bucket(), // height/min-height on interactive-ish elements
  fontSize: bucket(),
  lineHeight: bucket(),
  fontWeight: bucket(),
  letterSpacing: bucket(),
  duration: bucket(),
  color: bucket(),
  shadow: bucket(),
  computedPx: bucket(), // px literals found in <script> logic
}

const SPACING_PROPS = /^(padding|margin)(-(top|right|bottom|left))?$|^(row-|column-)?gap$/
const SIZE_PROPS = /^(min-|max-)?(width|height)$|^flex-basis$/
const RADIUS_PROPS = /border(-[a-z]+)*-radius$|^border-radius$/
const POSITION_PROPS = /^(top|right|bottom|left|inset)$/

const PX = /(-?\d*\.?\d+)px/g
const HEX = /#[0-9a-fA-F]{3,8}\b/g
const RGBA = /rgba?\([^)]*\)/g
const DURATION = /(\d*\.?\d+)(ms|s)(?![a-z-])/g

function pxList(v: string): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  PX.lastIndex = 0
  while ((m = PX.exec(v))) out.push(`${m[1]}px`)
  return out
}

/** Parse a block of `prop:value;prop:value` declarations. */
function parseDeclarations(css: string, file: string, scoped = false) {
  // Interactive-ish elements for control-height heuristic are handled at call site.
  const decls = css.split(';')
  for (const raw of decls) {
    const idx = raw.indexOf(':')
    if (idx < 0) continue
    const prop = raw.slice(0, idx).trim().toLowerCase()
    const value = raw.slice(idx + 1).trim()
    if (!prop || !value) continue

    // Colors (any property)
    let cm: RegExpExecArray | null
    HEX.lastIndex = 0
    while ((cm = HEX.exec(value))) {
      const c = cm[0].toUpperCase()
      add(cat.color, c, file)
      logColor(c, file, prop)
    }
    RGBA.lastIndex = 0
    while ((cm = RGBA.exec(value))) {
      const c = cm[0].replace(/\s+/g, '')
      add(cat.color, c, file)
      logColor(c, file, prop)
    }

    if (prop === 'box-shadow' && value !== 'none') {
      add(cat.shadow, value.replace(/\s+/g, ' '), file)
    }

    if (
      prop === 'transition' ||
      prop === 'animation' ||
      prop === 'transition-duration' ||
      prop === 'animation-duration'
    ) {
      let dm: RegExpExecArray | null
      DURATION.lastIndex = 0
      while ((dm = DURATION.exec(value))) {
        const ms = dm[2] === 's' ? parseFloat(dm[1]) * 1000 : parseFloat(dm[1])
        if (ms > 0) add(cat.duration, `${ms}ms`, file)
      }
    }

    if (prop === 'font-size') pxList(value).forEach((p) => add(cat.fontSize, p, file))
    if (prop === 'line-height') {
      if (/px/.test(value)) pxList(value).forEach((p) => add(cat.lineHeight, p, file))
      else if (/^[\d.]+$/.test(value)) add(cat.lineHeight, value, file)
    }
    if (prop === 'font-weight' && /^\d+$/.test(value)) add(cat.fontWeight, value, file)
    if (prop === 'font') {
      const w = value.match(/\b([1-9]00)\b/)
      if (w) add(cat.fontWeight, w[1], file)
    }
    if (prop === 'letter-spacing') add(cat.letterSpacing, value, file)

    if (SPACING_PROPS.test(prop)) pxList(value).forEach((p) => add(cat.spacing, p, file))
    else if (RADIUS_PROPS.test(prop)) pxList(value).forEach((p) => add(cat.radius, p, file))
    else if (POSITION_PROPS.test(prop)) pxList(value).forEach((p) => add(cat.position, p, file))
    else if (SIZE_PROPS.test(prop)) pxList(value).forEach((p) => add(cat.size, p, file))

    if (
      prop === 'border' ||
      /^border-(top|right|bottom|left)$/.test(prop) ||
      prop === 'border-width' ||
      prop === 'outline'
    ) {
      const first = pxList(value)[0]
      if (first) add(cat.border, first, file)
    }

    if (prop === 'transform' || prop === 'translate') {
      const t = value.match(/translate[XY3d]*\(([^)]*)\)/)
      if (t) pxList(t[1]).forEach((p) => add(cat.translate, p, file))
    }
  }
}

function auditFile(file: string, text: string) {
  // 1) Inline style / style-hover / style-focus / style-active attributes
  const attrRe = /style(?:-[a-z]+)?="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = attrRe.exec(text))) parseDeclarations(m[1], file)

  // 2) <style> blocks — pull declaration bodies inside { … }
  const styleBlockRe = /<style[^>]*>([\s\S]*?)<\/style>/g
  while ((m = styleBlockRe.exec(text))) {
    const body = m[1]
    const ruleRe = /\{([^{}]*)\}/g
    let r: RegExpExecArray | null
    while ((r = ruleRe.exec(body))) parseDeclarations(r[1], file)
  }

  // 3) Icon sizes: width/height attributes on <svg> and <img>
  const tagRe = /<(svg|img)\b([^>]*)>/g
  while ((m = tagRe.exec(text))) {
    const attrs = m[2]
    const w = attrs.match(/\bwidth="(\d+)"/)
    const h = attrs.match(/\bheight="(\d+)"/)
    if (w) add(cat.icon, `${w[1]}px`, file)
    if (h) add(cat.icon, `${h[1]}px`, file)
    // stroke-width lives either as attribute or inside the element's style
    const sw = attrs.match(/stroke-width[:=]"?\s*([\d.]+)/)
    if (sw) add(cat.stroke, sw[1], file)
  }

  // 4) Control heights: `height:NNpx` appearing on button/input/select/form/a tags.
  //    Heuristic — scan opening tags of interactive elements for an inline height.
  const ctlRe = /<(button|input|select|textarea|form|a)\b[^>]*\bstyle="([^"]*)"/g
  while ((m = ctlRe.exec(text))) {
    const hm = m[2].match(/(?:^|;)\s*height:\s*(\d+)px/)
    if (hm) add(cat.controlH, `${hm[1]}px`, file)
  }

  // 5) Computed/script pass: px literals + colors + durations inside <script> logic.
  const scriptRe = /<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/g
  while ((m = scriptRe.exec(text))) {
    const body = m[1]
    let p: RegExpExecArray | null
    PX.lastIndex = 0
    while ((p = PX.exec(body))) add(cat.computedPx, `${p[1]}px`, file)
    HEX.lastIndex = 0
    while ((p = HEX.exec(body))) {
      const c = p[0].toUpperCase()
      add(cat.color, c, file)
      logColor(c, file, 'script')
    }
    RGBA.lastIndex = 0
    while ((p = RGBA.exec(body))) {
      const c = p[0].replace(/\s+/g, '')
      add(cat.color, c, file)
      logColor(c, file, 'script')
    }
    DURATION.lastIndex = 0
    while ((p = DURATION.exec(body))) {
      const ms = p[2] === 's' ? parseFloat(p[1]) * 1000 : parseFloat(p[1])
      // Guard: skip bare seconds that are really timeouts (e.g. 2000, 30000 ms via setInterval) is impossible to tell; keep <= 2000ms range as plausible durations.
      if (ms > 0 && ms <= 2000) add(cat.duration, `${ms}ms`, file)
    }
  }
}

// ----- helpers for reporting -----
const numOf = (s: string) => parseFloat(s)
const isFractional = (s: string) => /px$/.test(s) && !Number.isInteger(numOf(s))
const isOdd = (s: string) => {
  const n = numOf(s)
  return /px$/.test(s) && Number.isInteger(n) && n % 2 !== 0 && n > 2
}

function sortByValue(b: Bucket) {
  return [...b.entries()].sort((a, c) => numOf(a[0]) - numOf(c[0]) || a[0].localeCompare(c[0]))
}
function sortByFreq(b: Bucket) {
  return [...b.entries()].sort((a, c) => c[1].count - a[1].count || numOf(a[0]) - numOf(c[0]))
}

function table(b: Bucket, byFreq = false): string {
  const rows = byFreq ? sortByFreq(b) : sortByValue(b)
  const lines = ['| значення | частота | файлів | де (приклади) |', '|---|---|---|---|']
  for (const [k, v] of rows) {
    const files = [...v.files].map((f) => f.replace(/\.dc\.html$/, '')).sort()
    const sample =
      files.slice(0, 6).join(', ') + (files.length > 6 ? ` … +${files.length - 6}` : '')
    lines.push(`| \`${k}\` | ${v.count} | ${v.files.size} | ${sample} |`)
  }
  return lines.join('\n')
}

// ----- run -----
const files = readdirSync(EXPORT_DIR)
  .filter((f) => f.endsWith('.dc.html'))
  .sort()
for (const f of files) auditFile(f, readFileSync(join(EXPORT_DIR, f), 'utf8'))

mkdirSync(OUT_DIR, { recursive: true })

const sections: string[] = []
sections.push(`# Stage 1 — інвентар значень експорту

Згенеровано \`scripts/design-audit.ts\`. Джерело: \`docs/design-export/*.dc.html\` (${files.length} файлів).

Пас 1 (декларації) — інлайн \`style\`, \`style-hover\`, \`style-focus\` та \`<style>\`; добре категоризовано за властивістю.
Пас 2 (обчислювані) — px/кольори/тривалості всередині \`<script>\`-логіки, де лежать значення під брейкпоінти (side/block padding, 1312px контейнер тощо); категоризація наближена.

Дробові (напр. 13.5px) і непарні (7, 15, 23) значення позначені в таблиці розходжень в AUDIT.md.
`)

const order: [keyof typeof cat, string, boolean][] = [
  ['spacing', 'Відступи (padding / margin / gap)', false],
  ['size', 'Розміри (width / height / min / max / flex-basis)', false],
  ['controlH', 'Висоти контролів (height на button/input/select/form/a)', true],
  ['radius', 'Радіуси (border-radius)', false],
  ['border', 'Товщина рамок / outline', false],
  ['icon', 'Іконки (width/height на <svg>/<img>)', false],
  ['stroke', 'Товщина штриха іконок (stroke-width)', true],
  ['position', 'Позиціонування (top/left/right/bottom/inset)', false],
  ['translate', 'Translate (у transform)', false],
  ['fontSize', 'Розмір шрифту (font-size)', false],
  ['lineHeight', 'Міжрядковий (line-height)', false],
  ['fontWeight', 'Вага шрифту (font-weight)', true],
  ['letterSpacing', 'Letter-spacing', true],
  ['duration', 'Тривалості анімацій', false],
  ['shadow', 'Тіні (box-shadow)', true],
  ['color', 'Кольори (hex + rgba)', true],
  ['computedPx', 'px-літерали зі <script> (обчислювані)', false],
]

for (const [key, title, byFreq] of order) {
  const b = cat[key]
  sections.push(`\n## ${title}\n\nУнікальних значень: ${b.size}.\n\n${table(b, byFreq)}`)
}

// Rare colors (total ≤ 2 occurrences) with exact locations — for per-color review.
const RARE = 2
const rareRows: string[] = [
  '\n## Рідкісні кольори (≤2 входжень) — рішення по кожному',
  '',
  '| колір | разів | де (файл · властивість) |',
  '|---|---|---|',
]
const rareList = [...cat.color.entries()]
  .filter(([, v]) => v.count <= RARE)
  .sort((a, b) => a[0].localeCompare(b[0]))
for (const [c, v] of rareList) {
  const locs = (colorLocs.get(c) ?? []).map((l) => `${l.file} · \`${l.context}\``).join('<br>')
  rareRows.push(`| \`${c}\` | ${v.count} | ${locs} |`)
}
sections.push(rareRows.join('\n'))

writeFileSync(join(OUT_DIR, 'inventory.md'), sections.join('\n') + '\n', 'utf8')

// ----- compact stdout summary -----
function summ(b: Bucket) {
  return sortByValue(b)
    .map(([k, v]) => `${k}×${v.count}`)
    .join('  ')
}
const pureBW = [...cat.color.keys()].filter((c) => /^#(000|FFF|000000|FFFFFF)$/i.test(c))
const frac = new Set<string>()
const odd = new Set<string>()
for (const key of [
  'spacing',
  'size',
  'radius',
  'border',
  'position',
  'icon',
  'controlH',
  'fontSize',
] as const) {
  for (const k of cat[key].keys()) {
    if (isFractional(k)) frac.add(`${key}:${k}`)
    if (isOdd(k)) odd.add(`${key}:${k}`)
  }
}

console.log('=== DESIGN AUDIT SUMMARY ===')
console.log(`files: ${files.length}`)
for (const [key, title] of order)
  console.log(`\n[${title}]\n  ${summ(cat[key as keyof typeof cat])}`)
console.log(`\n[pure #000/#FFF present]: ${pureBW.join(', ') || 'none'}`)
console.log(`\n[fractional px]: ${[...frac].sort().join(', ') || 'none'}`)
console.log(`\n[odd px >2 (7,15,23…)]: ${[...odd].sort().join(', ') || 'none'}`)
console.log(`\n[rare colors ≤2 occ]:`)
for (const [c, v] of rareList)
  console.log(
    `  ${c} ×${v.count}  — ${(colorLocs.get(c) ?? []).map((l) => `${l.file}/${l.context}`).join(', ')}`,
  )
console.log(`\nWrote ${join('docs/stages/stage1', 'inventory.md')}`)
