import { readFileSync } from 'fs'
import path from 'path'

/**
 * Side-effect module: load `.env` into process.env before anything imports the
 * Payload config (which reads env at module-eval time). Import this FIRST. No
 * dependency; the real environment always wins (server sets env directly).
 */
try {
  for (const line of readFileSync(path.resolve('.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // no .env (server) — rely on the real environment
}
