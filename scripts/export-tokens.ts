/**
 * Generate docs/DESIGN_TOKENS.md from the @theme block in src/app/globals.css.
 *
 * globals.css is the single source of truth; this file is a generated mirror.
 *   pnpm tsx scripts/export-tokens.ts           — (re)write the doc
 *   pnpm tsx scripts/export-tokens.ts --check   — fail if the doc is stale (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CSS = join(ROOT, 'src/app/globals.css')
const OUT = join(ROOT, 'docs/DESIGN_TOKENS.md')

const css = readFileSync(CSS, 'utf8')
const theme = css.match(/@theme\s*\{([\s\S]*?)\n\}/)
if (!theme) throw new Error('No @theme block found in globals.css')

// Collect `--name: value;` declarations (strip inline /* comments */).
type Tok = { name: string; value: string; note: string }
const toks: Tok[] = []
for (const raw of theme[1].split('\n')) {
  const m = raw.match(/^\s*(--[a-z0-9-]+):\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/i)
  if (m) toks.push({ name: m[1], value: m[2].trim(), note: m[3] ?? '' })
}

const pick = (re: RegExp) => toks.filter((t) => re.test(t.name))
const table = (rows: Tok[], valueHead = 'значення') => {
  const out = [`| токен | ${valueHead} | нотатка |`, '|---|---|---|']
  for (const t of rows) out.push(`| \`${t.name}\` | \`${t.value}\` | ${t.note} |`)
  return out.join('\n')
}

// Type scale: fold `--text-x--line-height|font-weight|letter-spacing` into the base row.
const textBase = toks.filter((t) => /^--text-[a-z0-9]+$/.test(t.name))
const textMod = (base: string, mod: string) =>
  toks.find((t) => t.name === `${base}--${mod}`)?.value ?? '—'
const textRows = [
  '| токен | size | line-height | weight | letter-spacing | роль |',
  '|---|---|---|---|---|---|',
  ...textBase.map(
    (t) =>
      `| \`${t.name}\` | \`${t.value}\` | ${textMod(t.name, 'line-height')} | ${textMod(t.name, 'font-weight')} | ${textMod(t.name, 'letter-spacing')} | ${t.note} |`,
  ),
].join('\n')

const doc = `# DLSAuto — design tokens

> **Згенеровано** з \`src/app/globals.css\` (\`@theme\`) скриптом \`scripts/export-tokens.ts\`.
> Не редагувати вручну — правити токени в \`globals.css\` і перегенерувати. CI падає при розбіжності.

Канон і підстави — \`docs/stages/stage1/AUDIT.md\`. Кольори 1:1 з експортом (близькі відтінки — різні токени). Компоненти використовують лише \`var(--token)\` / утиліти Tailwind, прив'язані до токенів.

## Шрифт
${table(pick(/^--font-/))}

## Кольори
${table(pick(/^--color-/), 'значення')}

## Радіуси
${table(pick(/^--radius-/))}

## Типографіка (шкала)
${textRows}

## Тіні
${table(pick(/^--shadow-/))}

## Відступи
${table(pick(/^--space-/))}

## Висоти контролів
${table(pick(/^--control-h-/))}

## Іконки
${table(pick(/^--icon-/))}

## Тривалості та easing
${table(pick(/^--(duration|ease)-/))}

## Лейаут
${table(pick(/^--(container|border|breakpoint)-/))}
`

if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8')
  if (current.trim() !== doc.trim()) {
    console.error('✖ docs/DESIGN_TOKENS.md is out of date. Run: pnpm tsx scripts/export-tokens.ts')
    process.exit(1)
  }
  console.log('✓ DESIGN_TOKENS.md is in sync with globals.css')
} else {
  writeFileSync(OUT, doc, 'utf8')
  console.log(`Wrote ${OUT} (${toks.length} tokens)`)
}
