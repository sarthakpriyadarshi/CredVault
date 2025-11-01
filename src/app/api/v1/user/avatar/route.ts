import { NextRequest, NextResponse } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "PUT") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const userId = user?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const body = await parseBody<{
      base64: string
    }>(req)

    if (!body.base64) {
      return NextResponse.json({ error: "Avatar base64 data is required" }, { status: 400 })
    }

    const dbUser = await User.findById(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    dbUser.image = body.base64
    await dbUser.save()

    return NextResponse.json({
      message: "Avatar updated successfully",
      image: dbUser.image,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const PUT = withAuth(handler)

