/**
 * CI guard: no literal px or hex colours in src/components.
 *
 * Components must style only through design tokens — var(--token) or
 * token-bound Tailwind utilities. Raw `16px` / `#1E232B` means a value escaped
 * the token layer. SVG geometry (viewBox, path `d`, stroke-width numbers,
 * width/height attrs) is exempt — that is icon shape, not styling.
 *
 *   node scripts/check-no-literals.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'src/components')

/** Walk .ts/.tsx files. */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(tsx?|css)$/.test(entry)) out.push(p)
  }
  return out
}

const PX = /(?<![\w.#-])\d*\.?\d+px\b/
const HEX = /#[0-9a-fA-F]{3,8}\b/

const violations = []
let files = []
try {
  files = walk(DIR)
} catch {
  // No components yet — nothing to check.
}

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  // Drop block comments (/* … */) and JSX comments so doc text can mention px/hex.
  const noBlocks = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  const lines = noBlocks.split('\n')
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '') // strip line comments
    if (/^\s*\*/.test(line)) return // jsdoc continuation line
    // Strip obvious SVG geometry so icon shapes don't trip the check.
    const isSvgGeom =
      /\b(viewBox|d|cx|cy|r|x|y|x1|x2|y1|y2|points|width|height|strokeWidth|stroke-width)\s*[=:]/.test(
        code,
      )
    const stripped = code.replace(/\bvar\(--[a-z0-9-]+\)/gi, '')
    if (HEX.test(stripped)) violations.push(`${file}:${i + 1}  hex  ${line.trim()}`)
    if (!isSvgGeom && PX.test(stripped)) violations.push(`${file}:${i + 1}  px   ${line.trim()}`)
  })
}

if (violations.length) {
  console.error('✖ literal px/hex found in src/components (use design tokens):\n')
  for (const v of violations) console.error('  ' + v)
  process.exit(1)
}
console.log(`✓ no literal px/hex in src/components (${files.length} files checked)`)
