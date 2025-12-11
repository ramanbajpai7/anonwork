import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const posts = await query(
      `SELECT 
        p.*,
        u.anon_username as author_anon_username,
        u.is_verified_employee as author_is_verified,
        u.profile_photo_url as author_profile_photo,
        c.name as channel_name,
        c.type as channel_type
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN channels c ON p.channel_id = c.id
      WHERE p.id = $1 AND p.status = 'active'`,
      [id]
    )

    if (posts.length === 0) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 })
    }

    // Increment view count
    try {
      await query(
        `UPDATE posts SET views = views + 1 WHERE id = $1`,
        [id]
      )
      posts[0].views = (posts[0].views || 0) + 1
    } catch (err) {
      console.error("Failed to update view count:", err)
    }

    // Get comments for this post
    const comments = await query(
      `SELECT 
        c.*,
        u.anon_username as author_anon_username,
        u.is_verified_employee as author_is_verified,
        u.profile_photo_url as author_profile_photo
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1 AND c.status = 'active'
      ORDER BY c.created_at ASC`,
      [id]
    )
    
    // Try to get display_name (column may not exist)
    let authorDisplayName = null
    try {
      const displayResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [posts[0].author_id]
      )
      authorDisplayName = displayResult[0]?.display_name || null
      
      // Also get display_name for comment authors
      for (const comment of comments) {
        const commentDisplayResult = await query(
          `SELECT display_name FROM users WHERE id = $1`,
          [comment.author_id]
        )
        comment.author_display_name = commentDisplayResult[0]?.display_name || null
      }
    } catch {
      // Column doesn't exist yet
      for (const comment of comments) {
        comment.author_display_name = null
      }
    }

    const post = { ...posts[0], author_display_name: authorDisplayName, comments }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Get post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Check authorization
    const posts = await query(
      "SELECT author_id FROM posts WHERE id = $1",
      [id]
    )

    if (posts.length === 0 || posts[0].author_id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { title, body } = await request.json()

    const updated = await query(
      `UPDATE posts SET title = $1, body = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title, body, id]
    )

    if (updated.length === 0) {
      return NextResponse.json({ message: "Failed to update post" }, { status: 500 })
    }

    return NextResponse.json({ post: updated[0] })
  } catch (error) {
    console.error("Update post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Check authorization
    const posts = await query(
      "SELECT author_id FROM posts WHERE id = $1",
      [id]
    )

    if (posts.length === 0 || posts[0].author_id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    await query(
      "UPDATE posts SET status = 'removed', updated_at = NOW() WHERE id = $1",
      [id]
    )

    return NextResponse.json({ message: "Post deleted" })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
