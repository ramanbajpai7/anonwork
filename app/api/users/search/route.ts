import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Search users by username
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const url = new URL(request.url)
    const searchQuery = url.searchParams.get("q")

    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search for users by anon_username, excluding the current user
    const users = await query(
      `SELECT id, anon_username, is_verified_employee 
       FROM users 
       WHERE LOWER(anon_username) LIKE LOWER($1) 
       AND id != $2
       LIMIT 10`,
      [`%${searchQuery}%`, userId]
    )

    return NextResponse.json({ users })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

