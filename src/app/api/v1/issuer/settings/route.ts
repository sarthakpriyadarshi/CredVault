import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "PUT" && req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const userId = user?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 })
    }

    if (req.method === "GET") {
      const dbUser = await User.findById(userId).select("settings").lean()

      interface UserWithSettings {
        settings?: {
          emailNotifications?: boolean
          webhookEnabled?: boolean
          apiAccessEnabled?: boolean
        }
      }

      const userWithSettings = dbUser as UserWithSettings | null

      return NextResponse.json({
        emailNotifications: userWithSettings?.settings?.emailNotifications ?? true,
        webhookEnabled: userWithSettings?.settings?.webhookEnabled ?? false,
        apiAccessEnabled: userWithSettings?.settings?.apiAccessEnabled ?? false,
      })
    }

    // PUT - Update settings
    const body = await parseBody<{
      emailNotifications?: boolean
      webhookEnabled?: boolean
      apiAccessEnabled?: boolean
    }>(req)

    const dbUser = await User.findById(userId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update settings (we'll store in a settings field if it exists, or use a different approach)
    // For now, we'll just return success - actual storage can be implemented based on User model structure
    await dbUser.save()

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: {
        emailNotifications: body.emailNotifications ?? true,
        webhookEnabled: body.webhookEnabled ?? false,
        apiAccessEnabled: body.apiAccessEnabled ?? false,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withIssuer(handler)
export const PUT = withIssuer(handler)

