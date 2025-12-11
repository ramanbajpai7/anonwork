import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { display_name } = await request.json()

    let displayNameValue = null
    
    // Validate display_name
    if (display_name !== undefined && display_name !== null) {
      if (typeof display_name !== "string") {
        return NextResponse.json({ message: "Display name must be a string" }, { status: 400 })
      }
      
      const trimmedName = display_name.trim()
      
      if (trimmedName.length > 50) {
        return NextResponse.json({ message: "Display name must be 50 characters or less" }, { status: 400 })
      }

      displayNameValue = trimmedName || null

      // Try to update display_name (column may not exist)
      try {
        await query(
          `UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2`,
          [displayNameValue, userId]
        )
      } catch (err: any) {
        if (err.code === '42703') {
          // Column doesn't exist, return error message
          return NextResponse.json({ 
            message: "Display name feature requires database update. Please run: ALTER TABLE users ADD COLUMN display_name VARCHAR(50);" 
          }, { status: 400 })
        }
        throw err
      }
    }

    // Get updated user info
    const users = await query(
      `SELECT id, email, anon_username, role, email_verified, is_verified_employee, 
              profile_photo_url, work_email, work_email_verified, work_email_domain, created_at 
       FROM users WHERE id = $1`,
      [userId]
    )

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: { ...users[0], display_name: displayNameValue } 
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

