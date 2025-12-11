import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get user's notifications
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
    const unreadOnly = url.searchParams.get("unread") === "true"
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")

    let whereClause = "WHERE user_id = $1"
    if (unreadOnly) {
      whereClause += " AND read = false"
    }

    const notifications = await query(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    )

    // Get unread count
    const unreadCount = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false`,
      [userId]
    )

    return NextResponse.json({ 
      notifications, 
      unread_count: parseInt(unreadCount[0]?.count || "0")
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Mark all as read
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    await query(
      `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
      [userId]
    )

    return NextResponse.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Mark notifications read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
