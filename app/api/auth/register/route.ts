import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { hashPassword, generateAnonUsername, createToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, signup_source } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 })
    }

    // Check if user exists
    const existingUsers = await query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    )

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Hash password and create user
    const password_hash = await hashPassword(password)
    const anon_username = generateAnonUsername()

    const newUsers = await query(
      `INSERT INTO users (email, password_hash, anon_username, email_verified, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, anon_username, role`,
      [email, password_hash, anon_username, false, "user"]
    )

    if (newUsers.length === 0) {
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
    }

    const newUser = newUsers[0]

    // Create token
    const token = await createToken({ userId: newUser.id, email: newUser.email })

    const response = NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          anon_username: newUser.anon_username,
        },
        token,
      },
      { status: 201 },
    )

    // Set token as secure cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
