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
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    if (!user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const body = await parseBody<{
      currentPassword: string
      newPassword: string
    }>(req)

    const { currentPassword, newPassword } = body

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    // Find user with password field
    const dbUser = await User.findById(user.id).select("+password")

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    if (!dbUser.password || !(await dbUser.comparePassword(currentPassword))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Check if new password is different from current password
    if (await dbUser.comparePassword(newPassword)) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 })
    }

    // Update password (User model's setter will hash it automatically)
    dbUser.password = newPassword
    await dbUser.save()

    // Remove password from response
    dbUser.password = undefined

    return NextResponse.json({
      message: "Password changed successfully",
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withAuth(handler, { roles: ["recipient"] })

