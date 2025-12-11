// Authentication utilities

import bcrypt from "bcryptjs"
import { jwtVerify, SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY || "your-secret-key-change-in-production")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: Record<string, any>): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<Record<string, any>> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as Record<string, any>
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export function generateAnonUsername(): string {
  // Generate username like "user_8a3f"
  const chars = "0123456789abcdef"
  let username = "user_"
  for (let i = 0; i < 4; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return username
}
