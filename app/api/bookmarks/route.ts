import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get user's bookmarks
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const bookmarks = await query(
      `SELECT 
        b.id as bookmark_id,
        b.created_at as bookmarked_at,
        p.*,
        u.anon_username as author_anon_username,
        u.is_verified_employee as author_is_verified,
        t.name as topic_name, t.slug as topic_slug
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN topics t ON p.topic_id = t.id
      WHERE b.user_id = $1 AND p.status = 'active'
      ORDER BY b.created_at DESC`,
      [userId]
    )

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error("Get bookmarks error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Add bookmark
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { post_id } = await request.json()

    if (!post_id) {
      return NextResponse.json({ message: "Post ID required" }, { status: 400 })
    }

    // Check if already bookmarked
    const existing = await query(
      `SELECT id FROM bookmarks WHERE user_id = $1 AND post_id = $2`,
      [userId, post_id]
    )

    if (existing.length > 0) {
      return NextResponse.json({ message: "Already bookmarked" }, { status: 400 })
    }

    const bookmarks = await query(
      `INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) RETURNING *`,
      [userId, post_id]
    )

    return NextResponse.json({ bookmark: bookmarks[0] }, { status: 201 })
  } catch (error) {
    console.error("Add bookmark error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Remove bookmark
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { post_id } = await request.json()

    await query(
      `DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2`,
      [userId, post_id]
    )

    return NextResponse.json({ message: "Bookmark removed" })
  } catch (error) {
    console.error("Remove bookmark error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

