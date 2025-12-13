import { NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Get post count
    const postsResult = await query(
      "SELECT COUNT(*) as count FROM posts WHERE author_id = $1 AND status = 'active'",
      [userId]
    )
    const posts = parseInt(postsResult[0]?.count || "0")

    // Get comment count
    const commentsResult = await query(
      "SELECT COUNT(*) as count FROM comments WHERE author_id = $1 AND status = 'active'",
      [userId]
    )
    const comments = parseInt(commentsResult[0]?.count || "0")

    return NextResponse.json({ posts, comments })
  } catch (error) {
    console.error("Get user stats error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}



