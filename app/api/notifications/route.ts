import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Create notifications table if it doesn't exist
async function ensureNotificationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      data JSONB DEFAULT '{}',
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  
  // Create index for faster lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
  `)
  await query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
  `)
}

// GET - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Ensure table exists
    await ensureNotificationsTable()

    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const unreadOnly = url.searchParams.get("unread") === "true"
    const offset = (page - 1) * limit

    let whereClause = "WHERE user_id = $1"
    if (unreadOnly) {
      whereClause += " AND read = false"
    }

    const notifications = await query(
      `SELECT * FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )

    // Get unread count
    const unreadResult = await query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false",
      [userId]
    )
    const unreadCount = parseInt(unreadResult[0]?.count || "0")

    // Get total count
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM notifications ${whereClause}`,
      [userId]
    )
    const total = parseInt(totalResult[0]?.count || "0")

    return NextResponse.json({ 
      notifications, 
      unreadCount,
      page, 
      limit, 
      total 
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { notification_ids, mark_all } = await request.json()

    if (mark_all) {
      // Mark all as read
      await query(
        "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false",
        [userId]
      )
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      await query(
        `UPDATE notifications SET read = true 
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, notification_ids]
      )
    } else {
      return NextResponse.json({ message: "notification_ids or mark_all required" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notifications read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { notification_id } = await request.json()

    if (!notification_id) {
      return NextResponse.json({ message: "notification_id required" }, { status: 400 })
    }

    await query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
      [notification_id, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
