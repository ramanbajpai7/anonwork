import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const users = await query(
      `SELECT 
        id, 
        email, 
        anon_username,
        role, 
        email_verified, 
        is_verified_employee,
        work_email,
        work_email_verified,
        work_email_domain,
        verified_company_id,
        profile_photo_url,
        created_at,
        updated_at,
        last_active_at
      FROM users 
      WHERE id = $1`,
      [userId]
    )
    
    // Try to get display_name if the column exists
    let displayName = null
    try {
      const displayNameResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [userId]
      )
      if (displayNameResult.length > 0) {
        displayName = displayNameResult[0].display_name
      }
    } catch {
      // Column doesn't exist yet, ignore
    }

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: { ...users[0], display_name: displayName } })
  } catch (error) {
    console.error("Me endpoint error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}
