// Database Connection Helper using pg with IPv4 fix
import { Pool } from "pg"
import dns from "dns"

// Force IPv4 preference for DNS resolution
dns.setDefaultResultOrder("ipv4first")

let pool: Pool | null = null
let resolvedHost: string | null = null

// Resolve hostname to IPv4 address
async function resolveHostToIPv4(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) {
        reject(err)
      } else {
        resolve(address)
      }
    })
  })
}

// Get or create the database pool
async function getPool(): Promise<Pool> {
  if (!pool) {
    // Try unpooled URL first, fall back to pooled URL
    const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Parse the URL
    const url = new URL(databaseUrl)
    const originalHost = url.hostname

    // Resolve the hostname to IPv4 to avoid Happy Eyeballs issues
    try {
      resolvedHost = await resolveHostToIPv4(originalHost)
      console.log(`Resolved ${originalHost} to ${resolvedHost}`)
    } catch (err) {
      console.warn("Failed to resolve hostname, using original:", err)
      resolvedHost = originalHost
    }

    pool = new Pool({
      host: resolvedHost,
      port: url.port ? parseInt(url.port) : 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: decodeURIComponent(url.password),
      ssl: {
        rejectUnauthorized: false,
        servername: originalHost, // Required for SNI
      },
      connectionTimeoutMillis: 30000, // 30 second timeout
      idleTimeoutMillis: 30000, // 30 seconds before idle connection is closed
      max: 10, // Maximum number of clients in the pool
    })
  }
  return pool
}

// Helper to run parameterized queries with retry logic
export async function query<T = any>(
  sqlText: string,
  params: any[] = [],
  retries = 2
): Promise<T[]> {
  const client = await getPool()

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await client.query(sqlText, params)
      return result.rows as T[]
    } catch (error: any) {
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error
      }

      // Log and retry on connection errors
      console.warn(
        `Database query attempt ${attempt + 1} failed, retrying...`,
        error.message || error
      )

      // Wait a bit before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 200 * Math.pow(2, attempt))
      )
    }
  }

  throw new Error("Query failed after all retries")
}
