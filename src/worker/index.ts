import http from 'node:http'

const PORT = Number(process.env.WORKER_PORT ?? 3001)

// Minimal healthcheck endpoint for the container orchestrator.
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', role: 'worker', timestamp: new Date().toISOString() }))
    return
  }
  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log(`[worker] healthcheck listening on :${PORT}`)
})

// Empty scheduler. Background jobs — KeyCRM/Prom polling, nightly stock
// reconciliation, Nova Poshta / Delivery dictionary refresh — are registered
// here starting in stage 6.
function startScheduler(): void {
  console.log('[worker] scheduler started (no jobs registered yet)')
}

startScheduler()

// Graceful shutdown.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[worker] received ${signal}, shutting down`)
    server.close(() => process.exit(0))
  })
}
