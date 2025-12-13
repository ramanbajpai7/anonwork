import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { notifyComment, notifyReply, notifyMentions } from "@/lib/notifications"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    const comments = await query(
      `SELECT 
        c.*,
        u.anon_username as author_anon_username,
        u.is_verified_employee as author_is_verified,
        u.profile_photo_url as author_profile_photo
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = $1 AND c.status = 'active'
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    )
    
    // Try to get display_name for authors (column may not exist)
    try {
      for (const comment of comments) {
        const displayResult = await query(
          `SELECT display_name FROM users WHERE id = $1`,
          [comment.author_id]
        )
        comment.author_display_name = displayResult[0]?.display_name || null
      }
    } catch {
      // Column doesn't exist yet
      for (const comment of comments) {
        comment.author_display_name = null
      }
    }

    const countResult = await query(
      "SELECT COUNT(*) as total FROM comments WHERE post_id = $1 AND status = 'active'",
      [id]
    )
    const total = parseInt(countResult[0]?.total || "0")

    return NextResponse.json({ comments, page, limit, total })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
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

    const { body, parent_comment_id } = await request.json()

    if (!body) {
      return NextResponse.json({ message: "Comment body required" }, { status: 400 })
    }

    const comments = await query(
      `INSERT INTO comments (post_id, author_id, body, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, body, parent_comment_id || null]
    )

    if (comments.length === 0) {
      return NextResponse.json({ message: "Failed to create comment" }, { status: 500 })
    }

    // Get author info
    const users = await query(
      "SELECT anon_username, is_verified_employee, profile_photo_url FROM users WHERE id = $1",
      [userId]
    )
    
    // Try to get display_name (column may not exist)
    let displayName = null
    try {
      const displayResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [userId]
      )
      displayName = displayResult[0]?.display_name || null
    } catch {
      // Column doesn't exist yet
    }

    const comment = {
      ...comments[0],
      author_anon_username: users[0]?.anon_username,
      author_is_verified: users[0]?.is_verified_employee,
      author_profile_photo: users[0]?.profile_photo_url,
      author_display_name: displayName
    }

    // Get post info for notifications
    const posts = await query(
      "SELECT author_id, title FROM posts WHERE id = $1",
      [id]
    )
    const post = posts[0]

    if (post) {
      const commenterUsername = users[0]?.anon_username || "Someone"
      const postTitle = post.title || "your post"

      // Notify post author about the comment
      if (!parent_comment_id) {
        await notifyComment(
          post.author_id,
          userId,
          commenterUsername,
          id,
          postTitle,
          body
        )
      } else {
        // This is a reply - notify the parent comment author
        const parentComments = await query(
          "SELECT author_id FROM comments WHERE id = $1",
          [parent_comment_id]
        )
        if (parentComments.length > 0) {
          await notifyReply(
            parentComments[0].author_id,
            userId,
            commenterUsername,
            id,
            postTitle,
            body
          )
        }
      }

      // Check for @mentions in the comment
      await notifyMentions(body, userId, commenterUsername, id, postTitle, "comment")
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
