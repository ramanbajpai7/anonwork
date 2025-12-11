import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    const topics = await query(
      `SELECT * FROM topics WHERE is_active = true ORDER BY post_count DESC`
    )
    return NextResponse.json({ topics })
  } catch (error) {
    console.error("Topics error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

