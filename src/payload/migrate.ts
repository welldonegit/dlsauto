import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Standard migration runner — `pnpm db:migrate` and the Docker one-shot
 * `migrate` service both call this instead of the raw `payload migrate` CLI.
 *
 * Why it exists: after `next dev` dynamically pushes schema, Payload writes a
 * `batch: -1` "dev" marker row into `payload_migrations`. The stock
 * `payload migrate` command then shows an interactive prompt — "you've run in
 * dev mode… data loss will occur. Would you like to proceed? (y/N)" (see
 * `@payloadcms/drizzle/dist/migrate.js`). That prompt blocks forever whenever
 * stdin is not a TTY: CI, Docker, devcontainers, any piped shell. The plain
 * `migrate` command never forwards `--force-accept-warning` to the adapter, so
 * there is no flag to silence it.
 *
 * This runner removes the stale dev marker first — equivalent to answering
 * "yes": the committed migration files are the source of truth — then runs the
 * chain non-interactively. On a fresh database (CI / Docker / prod) there is no
 * marker, so this is a plain, full migrate. Lives under `src/` (not `scripts/`)
 * so it ships in the worker image, which copies `src` but not `scripts`.
 */

// Minimal, dependency-free `.env` loader (mirrors scripts/load-env). The raw
// `payload migrate` CLI gets env via Next's loadEnv(); a plain tsx entry does
// not, so we load it here. The real environment always wins — in Docker there
// is no `.env` and env is injected by compose.
try {
  for (const line of readFileSync(path.resolve('.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // no `.env` (server/CI) — rely on the real environment
}

// Suppress dev schema-push while this process initialises the adapter: the
// postgres adapter only pushes when NODE_ENV !== 'production' AND
// PAYLOAD_MIGRATING !== 'true' (see @payloadcms/db-postgres/dist/connect.js).
process.env.PAYLOAD_MIGRATING = 'true'

const { default: payload } = await import('payload')
const { default: config } = await import('../payload.config')

await payload.init({ config, disableOnInit: true })

// Drop the `next dev` push marker (batch -1) so migrate runs without the
// interactive confirmation. Guarded: on a fresh DB the table does not exist yet.
try {
  const { docs } = await payload.delete({
    collection: 'payload-migrations',
    where: { batch: { equals: -1 } },
  })
  if (docs.length > 0) {
    payload.logger.info(`Cleared ${docs.length} dev-push marker row(s) before migrating.`)
  }
} catch {
  // `payload_migrations` not created yet on an empty DB — nothing to clear.
}

await payload.db.migrate()

payload.logger.info('Done.')
process.exit(0)
