import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get company details and posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    // Get company details
    const companies = await query(
      `SELECT * FROM companies WHERE id = $1`,
      [companyId]
    )

    if (companies.length === 0) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 })
    }

    const company = companies[0]

    // Check if user has access (verified employee of this company)
    let hasAccess = false
    let userId = null

    if (token) {
      try {
        const decoded = await verifyToken(token)
        userId = decoded.userId

        // Check if user is verified for this company
        const userCheck = await query(
          `SELECT work_email_domain, is_verified_employee, verified_company_id 
           FROM users WHERE id = $1`,
          [userId]
        )

        if (userCheck.length > 0) {
          const user = userCheck[0]
          // User has access if they're verified and their domain matches or they're verified for this company
          if (user.is_verified_employee) {
            if (user.verified_company_id === companyId || 
                (company.domain && user.work_email_domain === company.domain)) {
              hasAccess = true
            }
          }
        }
      } catch (e) {
        // Token invalid, continue without access
      }
    }

    // Only fetch posts if user has access
    let posts: any[] = []
    if (hasAccess) {
      posts = await query(
        `SELECT 
          p.*,
          u.anon_username as author_anon_username,
          u.is_verified_employee as author_is_verified
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.channel_id = $1 AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 50`,
        [companyId]
      )

      // Transform posts
      posts = posts.map((post: any) => ({
        ...post,
        author: {
          anon_username: post.author_anon_username,
          is_verified_employee: post.author_is_verified,
        },
      }))
    }

    return NextResponse.json({ company, posts, hasAccess })
  } catch (error) {
    console.error("Get company channel error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

