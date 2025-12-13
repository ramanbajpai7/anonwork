import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { createNotification, notifyMentions } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const feedType = url.searchParams.get("feed_type") || "recent"
    const topicId = url.searchParams.get("topic_id")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let orderByClause = feedType === "popular" ? "p.score DESC" : "p.created_at DESC"
    let whereClause = "p.status = 'active'"
    const params: any[] = [limit, offset]

    if (topicId) {
      whereClause += " AND p.topic_id = $3"
      params.push(topicId)
    }

    const posts = await query(
      `SELECT 
        p.*,
        u.anon_username as author_anon_username,
        u.is_verified_employee as author_is_verified,
        u.profile_photo_url as author_profile_photo,
        c.name as channel_name,
        c.type as channel_type,
        t.name as topic_name,
        t.slug as topic_slug,
        t.icon as topic_icon,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND status = 'active') as comment_count,
        (SELECT COALESCE(SUM(vote), 0) FROM post_votes WHERE post_id = p.id) as vote_sum
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN channels c ON p.channel_id = c.id
      LEFT JOIN topics t ON p.topic_id = t.id
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $1 OFFSET $2`,
      params
    )

    // Try to get display_names for authors (column may not exist)
    const displayNames: Record<string, string | null> = {}
    try {
      const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))]
      if (authorIds.length > 0) {
        const displayResults = await query(
          `SELECT id, display_name FROM users WHERE id = ANY($1::uuid[])`,
          [authorIds]
        )
        for (const row of displayResults) {
          displayNames[row.id] = row.display_name
        }
      }
    } catch {
      // Column doesn't exist yet, ignore
    }

    // Transform the flat result into nested objects for easier frontend use
    const transformedPosts = posts.map((post: any) => ({
      ...post,
      author: {
        anon_username: post.author_anon_username,
        is_verified_employee: post.author_is_verified,
        profile_photo_url: post.author_profile_photo,
        display_name: displayNames[post.author_id] || null,
      },
      channel: post.channel_name ? {
        name: post.channel_name,
        type: post.channel_type,
      } : null,
      topic: post.topic_name ? {
        name: post.topic_name,
        slug: post.topic_slug,
        icon: post.topic_icon,
      } : null,
    }))

    return NextResponse.json({ posts: transformedPosts, page, limit })
  } catch (error) {
    console.error("Feed error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { title, body, channel_id, topic_id, is_anonymous, poll } = await request.json()

    if (!body) {
      return NextResponse.json({ message: "Post body required" }, { status: 400 })
    }

    // Create the post
    const posts = await query(
      `INSERT INTO posts (author_id, title, body, channel_id, topic_id, is_anonymous, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title || null, body, channel_id || null, topic_id || null, is_anonymous !== false, '{}']
    )

    if (posts.length === 0) {
      return NextResponse.json({ message: "Failed to create post" }, { status: 500 })
    }

    const newPost = posts[0]

    // Create poll if provided
    if (poll && poll.question && poll.options && poll.options.length >= 2) {
      try {
        await query(
          `INSERT INTO polls (post_id, question, options, allow_multiple)
           VALUES ($1, $2, $3, $4)`,
          [newPost.id, poll.question, JSON.stringify(poll.options), poll.allow_multiple || false]
        )
      } catch (pollError) {
        console.error("Failed to create poll:", pollError)
        // Continue without poll - don't fail the whole request
      }
    }

    // Update topic post count if topic_id is provided
    if (topic_id) {
      try {
        await query(
          `UPDATE topics SET post_count = post_count + 1 WHERE id = $1`,
          [topic_id]
        )
      } catch (updateError) {
        console.error("Failed to update topic post count:", updateError)
      }
    }

    // Get author info to return with post
    const userInfo = await query(
      `SELECT anon_username, is_verified_employee, profile_photo_url FROM users WHERE id = $1`,
      [userId]
    )

    // Get topic info if present
    let topicInfo = null
    if (topic_id) {
      const topics = await query(
        `SELECT name, slug, icon FROM topics WHERE id = $1`,
        [topic_id]
      )
      if (topics.length > 0) {
        topicInfo = topics[0]
      }
    }

    // Try to get display_name (column may not exist)
    let authorDisplayName = null
    try {
      const displayResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [userId]
      )
      authorDisplayName = displayResult[0]?.display_name || null
    } catch {
      // Column doesn't exist yet
    }

    // Send confirmation notification to the post author
    const authorUsername = userInfo[0]?.anon_username || "You"
    const postTitle = title || body.slice(0, 50) + (body.length > 50 ? "..." : "")
    
    await createNotification(
      userId,
      "milestone",
      "Your post has been published! 🎉",
      postTitle,
      { postId: newPost.id, postTitle }
    )

    // Check for @mentions in the post body
    await notifyMentions(body, userId, authorUsername, newPost.id, postTitle, "post")

    const responsePost = {
      ...newPost,
      author: userInfo.length > 0 ? {
        anon_username: userInfo[0].anon_username,
        is_verified_employee: userInfo[0].is_verified_employee,
        profile_photo_url: userInfo[0].profile_photo_url,
        display_name: authorDisplayName,
      } : null,
      topic: topicInfo,
      comment_count: 0,
      vote_sum: 0,
    }

    return NextResponse.json({ post: responsePost }, { status: 201 })
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
