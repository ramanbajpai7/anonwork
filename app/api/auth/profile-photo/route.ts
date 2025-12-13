import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Upload profile photo - stores as Base64 data URL in database
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const formData = await request.formData()
    const file = formData.get("photo") as File | null

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        message: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." 
      }, { status: 400 })
    }

    // Validate file size (max 2MB for Base64 storage)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        message: "File too large. Maximum size is 2MB." 
      }, { status: 400 })
    }

    // Convert file to Base64 data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update user's profile photo in database
    await query(
      `UPDATE users SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2`,
      [dataUrl, userId]
    )

    return NextResponse.json({ 
      message: "Profile photo updated successfully",
      photo_url: dataUrl
    })
  } catch (error) {
    console.error("Upload profile photo error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Delete profile photo
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Clear profile photo in database
    await query(
      `UPDATE users SET profile_photo_url = NULL, updated_at = NOW() WHERE id = $1`,
      [userId]
    )

    return NextResponse.json({ message: "Profile photo removed" })
  } catch (error) {
    console.error("Delete profile photo error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
