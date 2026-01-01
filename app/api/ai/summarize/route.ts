import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { summarizeContent, isFeatureEnabled } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('summarization')) {
      return NextResponse.json(
        { message: "Summarization feature is not enabled" },
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
    const { postId, threadText } = body

    if (!postId && !threadText) {
      return NextResponse.json(
        { message: "Either postId or threadText is required" },
        { status: 400 }
      )
    }

    let contentToSummarize: Array<{ username: string; content: string }> = []

    if (postId) {
      // Fetch post and comments from database
      const posts = await query(
        `SELECT 
          p.body, 
          p.title,
          u.anon_username
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = $1 AND p.status = 'active'`,
        [postId]
      )

      if (posts.length === 0) {
        return NextResponse.json({ message: "Post not found" }, { status: 404 })
      }

      const post = posts[0]
      
      // Add the main post
      contentToSummarize.push({
        username: post.anon_username || 'Anonymous',
        content: post.title ? `${post.title}\n\n${post.body}` : post.body,
      })

      // Fetch comments
      const comments = await query(
        `SELECT 
          c.body,
          u.anon_username
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = $1 AND c.status = 'active'
        ORDER BY c.created_at ASC
        LIMIT 50`,
        [postId]
      )

      for (const comment of comments) {
        contentToSummarize.push({
          username: comment.anon_username || 'Anonymous',
          content: comment.body,
        })
      }
    } else if (threadText) {
      // Direct text input (for previews or external content)
      contentToSummarize.push({
        username: 'User',
        content: threadText,
      })
    }

    // Check if there's enough content to summarize
    const totalWords = contentToSummarize
      .reduce((sum, item) => sum + item.content.split(/\s+/).length, 0)

    if (totalWords < 50) {
      return NextResponse.json(
        { message: "Not enough content to summarize (minimum 50 words)" },
        { status: 400 }
      )
    }

    // Generate summary
    const result = await summarizeContent(contentToSummarize)

    return NextResponse.json({
      success: true,
      summary: result.summary,
      bulletPoints: result.bulletPoints,
      keyTopics: result.keyTopics,
      wordCount: result.wordCount,
      postId: postId || null,
    })
  } catch (error) {
    console.error("Summarization error:", error)
    return NextResponse.json(
      { message: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
