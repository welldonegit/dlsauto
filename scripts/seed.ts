import config from '../src/payload.config'
import { getPayload } from 'payload'

/**
 * Database seed. Empty in stage 0 — real seed data arrives with the data model
 * in stage 2. Run with `pnpm db:seed` (requires DATABASE_URL and PAYLOAD_SECRET).
 */
async function seed(): Promise<void> {
  const payload = await getPayload({ config })
  payload.logger.info('Seed: nothing to seed yet (stage 0).')
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
