import { NextResponse } from 'next/server'
import { Pool } from 'pg'

import { getBuildSha } from '@/lib/env'

// Always evaluated at request time — never cached.
export const dynamic = 'force-dynamic'

async function checkDatabase(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return false

  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 2000 })
  try {
    await pool.query('SELECT 1')
    return true
  } catch {
    return false
  } finally {
    await pool.end().catch(() => {})
  }
}

export async function GET() {
  const db = await checkDatabase()
  const body = {
    status: db ? 'ok' : 'degraded',
    version: getBuildSha(),
    db,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, { status: db ? 200 : 503 })
}
