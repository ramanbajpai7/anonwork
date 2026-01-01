import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { checkPrivacy, isFeatureEnabled } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('anonymization')) {
      return NextResponse.json(
        { message: "Privacy check feature is not enabled" },
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
    const { text } = body

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { message: "Text is required for privacy check" },
        { status: 400 }
      )
    }

    const result = checkPrivacy(text)

    return NextResponse.json({
      success: true,
      safe: result.safe,
      riskScore: result.riskScore,
      warnings: result.warnings.map(w => ({
        type: w.type,
        message: w.message,
        severity: w.severity,
        suggestion: w.suggestion,
      })),
      warningCount: result.warnings.length,
      criticalCount: result.warnings.filter(w => w.severity === 'critical').length,
    })
  } catch (error) {
    console.error("Privacy check error:", error)
    return NextResponse.json(
      { message: "Failed to check privacy" },
      { status: 500 }
    )
  }
}
