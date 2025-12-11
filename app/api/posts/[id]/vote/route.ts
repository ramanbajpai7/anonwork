import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { vote } = await request.json()

    if (![1, -1, 0].includes(vote)) {
      return NextResponse.json({ message: "Invalid vote" }, { status: 400 })
    }

    // Check if vote exists
    const existingVotes = await query(
      "SELECT * FROM post_votes WHERE post_id = $1 AND user_id = $2",
      [id, userId]
    )

    let voteRecord = null

    if (existingVotes.length > 0) {
      const existingVote = existingVotes[0]
      if (vote === 0) {
        // Remove vote
        await query("DELETE FROM post_votes WHERE id = $1", [existingVote.id])
      } else {
        // Update vote
        const updated = await query(
          "UPDATE post_votes SET vote = $1, created_at = NOW() WHERE id = $2 RETURNING *",
          [vote, existingVote.id]
        )
        voteRecord = updated[0]
      }
    } else if (vote !== 0) {
      // Create new vote
      const created = await query(
        "INSERT INTO post_votes (post_id, user_id, vote) VALUES ($1, $2, $3) RETURNING *",
        [id, userId, vote]
      )
      voteRecord = created[0]
    }

    // Recalculate post score
    const votesResult = await query(
      "SELECT COALESCE(SUM(vote), 0) as score FROM post_votes WHERE post_id = $1",
      [id]
    )
    const score = parseInt(votesResult[0]?.score || "0")

    await query("UPDATE posts SET score = $1 WHERE id = $2", [score, id])

    return NextResponse.json({ vote: voteRecord, score })
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
