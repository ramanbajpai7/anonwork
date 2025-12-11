import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get company reviews
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const company = url.searchParams.get("company")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    if (company) {
      whereClause += ` AND LOWER(company_name) LIKE LOWER($${paramIndex})`
      params.push(`%${company}%`)
      paramIndex++
    }

    params.push(limit, offset)

    const reviews = await query(
      `SELECT 
        r.*,
        u.anon_username as author_anon_username
      FROM company_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    // Get company stats
    let stats = null
    if (company) {
      const statsResult = await query(
        `SELECT 
          COUNT(*) as review_count,
          ROUND(AVG(overall_rating), 1) as avg_overall,
          ROUND(AVG(culture_rating), 1) as avg_culture,
          ROUND(AVG(leadership_rating), 1) as avg_leadership,
          ROUND(AVG(compensation_rating), 1) as avg_compensation,
          ROUND(AVG(worklife_rating), 1) as avg_worklife,
          ROUND(AVG(growth_rating), 1) as avg_growth
        FROM company_reviews
        WHERE LOWER(company_name) LIKE LOWER($1)`,
        [`%${company}%`]
      )
      stats = statsResult[0]
    }

    return NextResponse.json({ reviews, stats, page, limit })
  } catch (error) {
    console.error("Reviews error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Submit company review
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { 
      company_name, 
      job_title,
      employment_status,
      overall_rating,
      culture_rating,
      leadership_rating,
      compensation_rating,
      worklife_rating,
      growth_rating,
      pros,
      cons
    } = await request.json()

    if (!company_name || !overall_rating) {
      return NextResponse.json(
        { message: "Company name and overall rating are required" }, 
        { status: 400 }
      )
    }

    const reviews = await query(
      `INSERT INTO company_reviews 
        (user_id, company_name, job_title, employment_status, overall_rating, culture_rating, leadership_rating, compensation_rating, worklife_rating, growth_rating, pros, cons)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [userId, company_name, job_title || null, employment_status || 'current', overall_rating, culture_rating || null, leadership_rating || null, compensation_rating || null, worklife_rating || null, growth_rating || null, pros || null, cons || null]
    )

    return NextResponse.json({ review: reviews[0], message: "Review submitted successfully!" }, { status: 201 })
  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
