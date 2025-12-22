import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { answerQuestion, isFeatureEnabled } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('qa')) {
      return NextResponse.json(
        { message: "Q&A feature is not enabled" },
        { status: 503 }
      )
    }

    // Verify authentication
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await verifyToken(token)

    const body = await request.json()
    const { question, channelId, companyId, topicId, daysBack = 7 } = body

    if (!question || question.trim().length < 10) {
      return NextResponse.json(
        { message: "Question must be at least 10 characters" },
        { status: 400 }
      )
    }

    // Build query to fetch relevant posts
    let whereClause = "p.status = 'active' AND p.created_at > NOW() - INTERVAL '1 day' * $1"
    const params: any[] = [daysBack]
    let paramIndex = 2

    if (channelId) {
      whereClause += ` AND p.channel_id = $${paramIndex++}`
      params.push(channelId)
    }

    if (topicId) {
      whereClause += ` AND p.topic_id = $${paramIndex++}`
      params.push(topicId)
    }

    // Fetch recent posts for context
    const posts = await query(
      `SELECT 
        p.id,
        p.title,
        p.body,
        u.anon_username,
        p.score,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE ${whereClause}
      ORDER BY p.score DESC, p.created_at DESC
      LIMIT 20`,
      params
    )

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "I couldn't find any recent discussions on this topic. Try broadening your search or checking a different time period.",
        sources: [],
        confidence: 0,
      })
    }

    // Prepare context for AI
    const contextPosts = posts.map((post: any) => ({
      username: post.anon_username || 'Anonymous',
      content: post.title ? `${post.title}: ${post.body}` : post.body,
    }))

    // For popular posts, also fetch top comments
    const popularPostIds = posts
      .filter((p: any) => p.comment_count > 0)
      .slice(0, 5)
      .map((p: any) => p.id)

    if (popularPostIds.length > 0) {
      const comments = await query(
        `SELECT 
          c.body,
          c.post_id,
          u.anon_username
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ANY($1::uuid[]) AND c.status = 'active'
        ORDER BY c.created_at ASC
        LIMIT 30`,
        [popularPostIds]
      )

      for (const comment of comments) {
        contextPosts.push({
          username: comment.anon_username || 'Anonymous',
          content: comment.body,
        })
      }
    }

    // Generate answer
    const result = await answerQuestion(question, contextPosts)

    return NextResponse.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      postsAnalyzed: posts.length,
      timeframe: `Last ${daysBack} days`,
    })
  } catch (error) {
    console.error("Q&A error:", error)
    return NextResponse.json(
      { message: "Failed to answer question" },
      { status: 500 }
    )
  }
}
