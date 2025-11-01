import { NextRequest, NextResponse } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const userId = user?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const dbUser = await User.findById(userId).select("image")
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      image: dbUser.image || null,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler)

