/**
 * Unified user profile endpoint
 * Handles getting and updating user profile including avatar/image
 */

import { NextRequest } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import { methodNotAllowed, successResponse, errorResponse } from "@/lib/api/responses"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  try {
    await connectDB()

    const userId = user?.id as string | undefined
    if (!userId) {
      return errorResponse("User not authenticated", 401)
    }

    if (req.method === "GET") {
      // GET user image/avatar
      const dbUser = await User.findById(userId).select("image").lean()
      if (!dbUser) {
        return errorResponse("User not found", 404)
      }

      return successResponse({
        image: dbUser.image || null,
      })
    }

    if (req.method === "PUT") {
      // PUT update user avatar/image
      const body = await parseBody<{
        base64: string
      }>(req)

      if (!body.base64) {
        return errorResponse("Avatar base64 data is required", 400)
      }

      const dbUser = await User.findById(userId)
      if (!dbUser) {
        return errorResponse("User not found", 404)
      }

      dbUser.image = body.base64
      await dbUser.save()

      return successResponse({
        message: "Avatar updated successfully",
        image: dbUser.image,
      })
    }

    return methodNotAllowed()
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler)
export const PUT = withAuth(handler)


