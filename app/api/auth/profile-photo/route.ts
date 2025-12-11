import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// Upload profile photo
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

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        message: "File too large. Maximum size is 5MB." 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars")
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${userId}-${Date.now()}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // URL for the uploaded image
    const photoUrl = `/uploads/avatars/${filename}`

    // Update user's profile photo in database
    await query(
      `UPDATE users SET profile_photo_url = $1, updated_at = NOW() WHERE id = $2`,
      [photoUrl, userId]
    )

    return NextResponse.json({ 
      message: "Profile photo updated successfully",
      photo_url: photoUrl
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

