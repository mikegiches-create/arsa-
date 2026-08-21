import app from './app'
import config from './config/index'
import logger from './utils/logger'
import pool from './lib/db'

const PORT = config.port

async function startServer() {
  // Verify DB connection before accepting traffic
  try {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Database connection failed:', error)
    process.exit(1)
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT} [${config.nodeEnv}]`)
  })

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(async () => {
      try {
        await pool.end()
        logger.info('DB pool closed')
      } catch {}
      process.exit(0)
    })
    // Force exit if graceful shutdown takes too long
    setTimeout(() => process.exit(1), 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`)
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error)
    process.exit(1)
  })
}

startServer()
