import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { suggestTags, isFeatureEnabled } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('smartCompose')) {
      return NextResponse.json(
        { message: "Smart compose feature is not enabled" },
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
    const { title = '', content } = body

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { message: "Content is required for tag suggestions" },
        { status: 400 }
      )
    }

    // Get AI suggestions
    const aiSuggestions = await suggestTags(title, content.slice(0, 500))

    // Fetch existing topics from database to match AI suggestions
    const existingTopics = await query(
      `SELECT id, name, slug, icon FROM topics ORDER BY post_count DESC LIMIT 50`
    )

    // Match AI suggestions with existing topics
    const matchedTags = aiSuggestions.map(suggestion => {
      const matchedTopic = existingTopics.find((topic: any) =>
        topic.name.toLowerCase().includes(suggestion.name.toLowerCase()) ||
        suggestion.name.toLowerCase().includes(topic.name.toLowerCase())
      )

      if (matchedTopic) {
        return {
          id: (matchedTopic as any).id,
          name: (matchedTopic as any).name,
          slug: (matchedTopic as any).slug,
          icon: (matchedTopic as any).icon,
          confidence: suggestion.confidence,
          isExisting: true,
        }
      }

      return {
        id: null,
        name: suggestion.name,
        slug: suggestion.name.toLowerCase().replace(/\s+/g, '-'),
        icon: null,
        confidence: suggestion.confidence,
        isExisting: false,
      }
    })

    // Sort by confidence and filter duplicates
    const uniqueTags = matchedTags
      .filter((tag, index, self) =>
        index === self.findIndex(t => t.name.toLowerCase() === tag.name.toLowerCase())
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      tags: uniqueTags,
    })
  } catch (error) {
    console.error("Tag suggestion error:", error)
    return NextResponse.json(
      { message: "Failed to generate tag suggestions" },
      { status: 500 }
    )
  }
}
