import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Get topic
    const topics = await query(
      "SELECT * FROM topics WHERE slug = $1 AND is_active = true",
      [slug]
    )

    if (topics.length === 0) {
      return NextResponse.json({ message: "Topic not found" }, { status: 404 })
    }

    const topic = topics[0]

    // Get posts for this topic
    const posts = await query(
      `SELECT 
        p.*,
        u.anon_username as author_anon_username,
        u.is_verified_employee as author_is_verified,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.topic_id = $1 AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [topic.id, limit, offset]
    )

    return NextResponse.json({ topic, posts, page, limit })
  } catch (error) {
    console.error("Topic posts error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

