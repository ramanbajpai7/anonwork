import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { moderateContent, checkPrivacy, isFeatureEnabled } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('moderation')) {
      return NextResponse.json(
        { message: "Moderation feature is not enabled" },
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
    const { text, checkType = 'full' } = body

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { message: "Text is required for moderation" },
        { status: 400 }
      )
    }

    // Quick check - just pattern matching (fast)
    if (checkType === 'quick') {
      const privacyResult = checkPrivacy(text)
      
      return NextResponse.json({
        success: true,
        safe: privacyResult.safe,
        label: privacyResult.safe ? 'safe' : 'potential_issue',
        warnings: privacyResult.warnings.map(w => w.message),
        riskScore: privacyResult.riskScore,
        checkType: 'quick',
      })
    }

    // Full check - includes LLM analysis
    const result = await moderateContent(text)

    return NextResponse.json({
      success: true,
      safe: !result.flagged,
      label: result.label,
      confidence: result.confidence,
      flagged: result.flagged,
      reasons: result.reasons,
      detectedIdentifiers: result.detectedIdentifiers || [],
      checkType: 'full',
    })
  } catch (error) {
    console.error("Moderation error:", error)
    return NextResponse.json(
      { message: "Failed to moderate content" },
      { status: 500 }
    )
  }
}
