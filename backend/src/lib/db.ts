import mysql from 'mysql2/promise'
import config from '../config/index'
import logger from '../utils/logger'

/**
 * Parse a mysql:// URI into mysql2 connection options.
 * Supports ?socket= for LAMPP and auto-detects TiDB Cloud for SSL.
 */
function parseDbUrl(url: string): mysql.PoolOptions {
  const parsed    = new URL(url)
  const socketArg = parsed.searchParams.get('socket')
  const sslArg    = parsed.searchParams.get('ssl')

  const base: mysql.PoolOptions = {
    user:     parsed.username || 'root',
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database: parsed.pathname.replace(/^\//, ''),
    timezone: '+00:00',
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }

  const isTiDB = parsed.hostname.includes('tidbcloud.com')
  if (sslArg || isTiDB) {
    let sslOpts: any = { rejectUnauthorized: true }
    if (sslArg) {
      try { sslOpts = { ...sslOpts, ...JSON.parse(sslArg) } } catch {}
    }
    ;(base as any).ssl = sslOpts
  }

  if (socketArg) {
    return { ...base, socketPath: socketArg }
  }

  return {
    ...base,
    host: parsed.hostname || 'localhost',
    port: parsed.port ? parseInt(parsed.port) : 3306,
  }
}

const pool = mysql.createPool(parseDbUrl(config.database.url))

pool.on('connection', () => {
  logger.debug('New MySQL connection established')
})

/**
 * TiDB Cloud rejects LIMIT/OFFSET as bound parameters in prepared statements.
 * This function inlines any trailing integer pair (limit, offset) directly
 * into the SQL string, keeping all other params as safe bound values.
 *
 * Pattern: SQL ending with "LIMIT ? OFFSET ?" → last two params inlined.
 * Pattern: SQL ending with "LIMIT ?"           → last one param inlined.
 */
function inlineLimitOffset(
  sql: string,
  params?: any[]
): { sql: string; params: any[] } {
  if (!params || params.length === 0) return { sql, params: params ?? [] }

  const trimmed = sql.trimEnd()

  // LIMIT ? OFFSET ?  — inline both
  if (/LIMIT\s+\?\s+OFFSET\s+\?$/i.test(trimmed)) {
    const rest   = params.slice(0, -2)
    const limit  = Math.max(1, parseInt(String(params[params.length - 2])) || 10)
    const offset = Math.max(0, parseInt(String(params[params.length - 1])) || 0)
    const newSql = trimmed.replace(
      /LIMIT\s+\?\s+OFFSET\s+\?$/i,
      `LIMIT ${limit} OFFSET ${offset}`
    )
    return { sql: newSql, params: rest }
  }

  // LIMIT ? only — inline it
  if (/LIMIT\s+\?$/i.test(trimmed)) {
    const rest  = params.slice(0, -1)
    const limit = Math.max(1, parseInt(String(params[params.length - 1])) || 10)
    const newSql = trimmed.replace(/LIMIT\s+\?$/i, `LIMIT ${limit}`)
    return { sql: newSql, params: rest }
  }

  return { sql, params }
}

/**
 * Execute a SELECT and return all rows.
 * Uses pool.query (non-prepared) to avoid TiDB Cloud LIMIT param restrictions.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const inlined = inlineLimitOffset(sql, params)
  const [rows] = await pool.query(inlined.sql, inlined.params)
  return rows as T[]
}

/**
 * Execute a SELECT and return the first row or null.
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

/**
 * Execute INSERT / UPDATE / DELETE — returns the result header.
 */
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const inlined = inlineLimitOffset(sql, params)
  const [result] = await pool.query(inlined.sql, inlined.params)
  return result as mysql.ResultSetHeader
}

/**
 * Run multiple statements inside a single transaction.
 */
export async function transaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection()
  await conn.beginTransaction()
  try {
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export default pool
