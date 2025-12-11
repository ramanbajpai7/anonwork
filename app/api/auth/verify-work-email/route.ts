import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/email"
import { cookies } from "next/headers"

// Send verification code to work email
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { work_email } = await request.json()

    if (!work_email || !work_email.includes("@")) {
      return NextResponse.json({ message: "Valid work email required" }, { status: 400 })
    }

    // Extract domain from email
    const domain = work_email.split("@")[1].toLowerCase()

    // Check if it's a personal email domain (not allowed)
    const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "protonmail.com"]
    if (personalDomains.includes(domain)) {
      return NextResponse.json({ message: "Please use your work email, not a personal email" }, { status: 400 })
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Delete any existing pending verifications for this user
    await query(
      "DELETE FROM email_verifications WHERE user_id = $1 AND is_verified = false",
      [userId]
    )

    // Create new verification record
    await query(
      `INSERT INTO email_verifications (user_id, work_email, work_email_domain, verification_code, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, work_email.toLowerCase(), domain, verificationCode, expiresAt.toISOString()]
    )

    // Send verification email using Nodemailer
    const emailSent = await sendVerificationEmail(work_email, verificationCode)
    
    if (!emailSent) {
      console.warn("Email could not be sent, but verification record was created")
    }

    // Check/create company record
    const existingCompany = await query(
      "SELECT id FROM companies WHERE domain = $1",
      [domain]
    )

    if (existingCompany.length === 0) {
      // Create company from domain
      const companyName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1)
      await query(
        "INSERT INTO companies (name, domain) VALUES ($1, $2) ON CONFLICT (domain) DO NOTHING",
        [companyName, domain]
      )
    }

    // Check if email credentials are configured
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)

    return NextResponse.json({ 
      message: emailConfigured 
        ? "Verification code sent to your work email" 
        : "Verification code generated (email service not configured)",
      // In development or if email not configured, include the code for testing
      ...(!emailConfigured && { dev_code: verificationCode })
    })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Verify the code
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ message: "Valid 6-digit code required" }, { status: 400 })
    }

    // Find pending verification
    const verifications = await query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 AND verification_code = $2 AND is_verified = false AND expires_at > NOW()`,
      [userId, code]
    )

    if (verifications.length === 0) {
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 })
    }

    const verification = verifications[0]

    // Mark as verified
    await query(
      "UPDATE email_verifications SET is_verified = true, verified_at = NOW() WHERE id = $1",
      [verification.id]
    )

    // Get company ID
    const companies = await query(
      "SELECT id FROM companies WHERE domain = $1",
      [verification.work_email_domain]
    )

    const companyId = companies.length > 0 ? companies[0].id : null

    // Update user record
    await query(
      `UPDATE users SET 
        work_email = $1, 
        work_email_verified = true, 
        is_verified_employee = true,
        verified_company_id = $2,
        work_email_domain = $3
       WHERE id = $4`,
      [verification.work_email, companyId, verification.work_email_domain, userId]
    )

    return NextResponse.json({ 
      message: "Work email verified successfully! You now have access to your company channel.",
      company_domain: verification.work_email_domain
    })
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
