import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get salary data
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const company = url.searchParams.get("company")
    const title = url.searchParams.get("title")
    const location = url.searchParams.get("location")

    let whereClause = "WHERE 1=1"
    const params: any[] = []
    let paramIndex = 1

    if (company) {
      whereClause += ` AND LOWER(company_name) LIKE LOWER($${paramIndex})`
      params.push(`%${company}%`)
      paramIndex++
    }
    if (title) {
      whereClause += ` AND LOWER(job_title) LIKE LOWER($${paramIndex})`
      params.push(`%${title}%`)
      paramIndex++
    }
    if (location) {
      whereClause += ` AND LOWER(location) LIKE LOWER($${paramIndex})`
      params.push(`%${location}%`)
      paramIndex++
    }

    // Get aggregated salary data - show entries with at least 1 report
    const salaries = await query(
      `SELECT 
        company_name,
        job_title,
        level,
        location,
        COUNT(*) as entry_count,
        ROUND(AVG(base_salary)) as avg_base,
        ROUND(AVG(base_salary + COALESCE(bonus, 0) + COALESCE(stock_annual, 0))) as avg_total,
        MIN(base_salary + COALESCE(bonus, 0) + COALESCE(stock_annual, 0)) as min_total,
        MAX(base_salary + COALESCE(bonus, 0) + COALESCE(stock_annual, 0)) as max_total
      FROM salary_entries
      ${whereClause}
      GROUP BY company_name, job_title, level, location
      ORDER BY avg_base DESC
      LIMIT 50`,
      params
    )

    return NextResponse.json({ salaries })
  } catch (error) {
    console.error("Salaries error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Submit salary entry
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
      level, 
      years_experience, 
      location, 
      base_salary, 
      bonus, 
      stock_annual,
      currency 
    } = await request.json()

    if (!company_name || !job_title || !base_salary) {
      return NextResponse.json(
        { message: "Company, job title, and base salary are required" }, 
        { status: 400 }
      )
    }

    const entries = await query(
      `INSERT INTO salary_entries 
        (user_id, company_name, job_title, level, years_experience, location, base_salary, bonus, stock_annual, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, company_name, job_title, level || null, years_experience || null, location || null, base_salary, bonus || 0, stock_annual || 0, currency || 'USD']
    )

    return NextResponse.json({ entry: entries[0], message: "Salary submitted successfully!" }, { status: 201 })
  } catch (error) {
    console.error("Salary submission error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
