/**
 * CI / pre-commit guard: page width comes only from <Container>.
 *
 * The single source of page width is the <Container> primitive in
 * src/components/ui/layout.tsx (owner decision, 22.11). It is the only place
 * a component may read `--container-max`. Rails that must bleed full-width use
 * the `.dls-rail` / `.dls-bleed` utilities in globals.css, which read the token
 * there — not in a component. So any `--container-max` in a .ts/.tsx file
 * outside layout.tsx means a section set its own width/side padding instead of
 * using <Container> — exactly what this guard forbids.
 *
 *   node scripts/check-container.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'src')
const ALLOW = join(ROOT, 'src/components/ui/layout.tsx')
const TOKEN = '--container-max'

/** Walk .ts/.tsx files (styling lives in .css, which is exempt). */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.tsx?$/.test(entry)) out.push(p)
  }
  return out
}

let files = []
try {
  files = walk(DIR)
} catch {
  // No sources yet — nothing to check.
}

const violations = []
for (const file of files) {
  if (file === ALLOW) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (line.includes(TOKEN)) {
      violations.push(`${relative(ROOT, file)}:${i + 1}  ${line.trim()}`)
    }
  })
}

if (violations.length) {
  console.error(
    '✖ page width must come from <Container> (src/components/ui/layout.tsx).\n' +
      `  Found ${TOKEN} outside it — use <Container>, or .dls-rail / .dls-bleed for rails:\n`,
  )
  for (const v of violations) console.error('  ' + v)
  process.exit(1)
}
console.log(`✓ page width only via <Container> (${files.length} files checked)`)
