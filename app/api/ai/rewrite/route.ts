import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { rewriteContent, isFeatureEnabled } from "@/lib/ai"

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
    const { text, style = 'professional' } = body

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { message: "Text must be at least 20 characters" },
        { status: 400 }
      )
    }

    // Limit text length
    if (text.length > 2000) {
      return NextResponse.json(
        { message: "Text must be less than 2000 characters" },
        { status: 400 }
      )
    }

    // Validate style
    const validStyles = ['professional', 'clear', 'concise']
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { message: `Style must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      )
    }

    const result = await rewriteContent(text, style)

    return NextResponse.json({
      success: true,
      original: result.original,
      rewritten: result.rewritten,
      changes: result.changes,
      style: result.style,
    })
  } catch (error) {
    console.error("Rewrite error:", error)
    return NextResponse.json(
      { message: "Failed to rewrite content" },
      { status: 500 }
    )
  }
}
