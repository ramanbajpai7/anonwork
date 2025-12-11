// Neon Database Connection Helper
import { Pool } from "@neondatabase/serverless"

let pool: Pool | null = null

// Get or create the database pool
function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    pool = new Pool({ connectionString: databaseUrl })
  }
  return pool
}

// Helper to run parameterized queries
export async function query<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
  const client = getPool()
  const result = await client.query(sqlText, params)
  return result.rows as T[]
}
