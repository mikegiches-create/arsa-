/**
 * Database initialisation script.
 * Creates the database (if missing) then runs schema.sql.
 *
 * Usage:  cd backend && npm run db:init
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

function parseDbUrl(raw: string) {
  const url       = new URL(raw)
  const socketArg = url.searchParams.get('socket')
  const sslArg    = url.searchParams.get('ssl')
  const dbName    = url.pathname.replace(/^\//, '')
  const isTiDB    = url.hostname.includes('tidbcloud.com')

  const base: any = {
    user:     url.username || 'root',
    password: url.password ? decodeURIComponent(url.password) : undefined,
    multipleStatements: true,
  }

  if (sslArg || isTiDB) {
    let sslOpts: any = { rejectUnauthorized: true }
    if (sslArg) {
      try { sslOpts = { ...sslOpts, ...JSON.parse(sslArg) } } catch {}
    }
    base.ssl = sslOpts
  }

  if (socketArg) {
    return { opts: { ...base, socketPath: socketArg }, dbName }
  }

  return {
    opts: {
      ...base,
      host: url.hostname || 'localhost',
      port: url.port ? parseInt(url.port) : 3306,
    },
    dbName,
  }
}

async function init() {
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) {
    console.error('❌  DATABASE_URL is not set in .env')
    process.exit(1)
  }

  const { opts, dbName } = parseDbUrl(rawUrl)

  console.log(`🔌 Connecting to MySQL (db: ${dbName})…`)

  // Step 1: connect WITHOUT selecting the database
  const conn = await mysql.createConnection(opts)

  // Step 2: create the database if it doesn't exist
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  console.log(`✅ Database "${dbName}" ready`)

  // Step 3: switch to it
  await conn.query(`USE \`${dbName}\``)

  // Step 4: read schema (strip the CREATE DATABASE / USE lines since we
  //         already ran them — safe because they use IF NOT EXISTS anyway)
  const schemaPath = join(__dirname, 'schema.sql')
  const sql = readFileSync(schemaPath, 'utf8')

  console.log('📦 Running schema…')
  await conn.query(sql)

  console.log('✅ Schema applied successfully')
  await conn.end()
}

init().catch(err => {
  console.error('❌ Init failed:', err.message)
  process.exit(1)
})
