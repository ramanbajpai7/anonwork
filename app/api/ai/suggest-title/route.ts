import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { suggestTitles, isFeatureEnabled } from "@/lib/ai"

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
    const { content } = body

    if (!content || content.trim().length < 20) {
      return NextResponse.json(
        { message: "Content must be at least 20 characters for title suggestions" },
        { status: 400 }
      )
    }

    // Limit content to first 500 characters for title generation
    const truncatedContent = content.slice(0, 500)

    const suggestions = await suggestTitles(truncatedContent)

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map(s => ({
        title: s.title,
        style: s.style,
      })),
    })
  } catch (error) {
    console.error("Title suggestion error:", error)
    return NextResponse.json(
      { message: "Failed to generate title suggestions" },
      { status: 500 }
    )
  }
}
