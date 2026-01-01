import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { redactContent, isFeatureEnabled } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('anonymization')) {
      return NextResponse.json(
        { message: "Anonymization feature is not enabled" },
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
    const { text, level = 'basic' } = body

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { message: "Text is required for redaction" },
        { status: 400 }
      )
    }

    // Validate level
    if (level !== 'basic' && level !== 'paranoid') {
      return NextResponse.json(
        { message: "Level must be 'basic' or 'paranoid'" },
        { status: 400 }
      )
    }

    const result = await redactContent(text, level)

    return NextResponse.json({
      success: true,
      original: result.original,
      redacted: result.redacted,
      changes: result.changes,
      riskLevel: result.riskLevel,
      changesCount: result.changes.length,
    })
  } catch (error) {
    console.error("Redaction error:", error)
    return NextResponse.json(
      { message: "Failed to redact content" },
      { status: 500 }
    )
  }
}
