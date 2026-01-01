import { NextResponse } from "next/server"
import { query } from "@/lib/neon"

export async function GET() {
  const status: Record<string, any> = {
    server: "ok",
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDbUrlUnpooled: !!process.env.DATABASE_URL_UNPOOLED,
      hasJwtSecret: !!process.env.JWT_SECRET_KEY,
    },
  }

  try {
    // Test database connection
    const result = await query("SELECT 1 as test")
    status.database = "connected"
    status.dbTest = result
  } catch (error: any) {
    status.database = "error"
    status.dbError = {
      message: error.message,
      code: error.code,
      name: error.name,
    }
  }

  const httpStatus = status.database === "connected" ? 200 : 500
  return NextResponse.json(status, { status: httpStatus })
}
