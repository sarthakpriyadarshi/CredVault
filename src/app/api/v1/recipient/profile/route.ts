import { NextRequest } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import { methodNotAllowed, successResponse, errorResponse, notFound } from "@/lib/api/responses"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

/**
 * API to get and update recipient profile
 */
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
      const dbUser = await User.findById(userId)
        .select("name email image profilePublic description linkedin github twitter website")
        .lean()

      if (!dbUser) {
        return notFound("User not found")
      }

      return successResponse({
        profile: {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || null,
          profilePublic: dbUser.profilePublic ?? true,
          description: dbUser.description || null,
          linkedin: dbUser.linkedin || null,
          github: dbUser.github || null,
          twitter: dbUser.twitter || null,
          website: dbUser.website || null,
        },
      })
    }

    if (req.method === "PUT") {
      const body = await parseBody<{
        name?: string
        description?: string
        linkedin?: string
        github?: string
        twitter?: string
        website?: string
        profilePublic?: boolean
        image?: string
      }>(req)

      const dbUser = await User.findById(userId)
      if (!dbUser) {
        return notFound("User not found")
      }

      // Update fields if provided
      if (body.name !== undefined) {
        dbUser.name = body.name.trim()
      }
      if (body.description !== undefined) {
        dbUser.description = body.description && typeof body.description === "string" ? body.description.trim() || null : null
      }
      if (body.linkedin !== undefined) {
        dbUser.linkedin = body.linkedin && typeof body.linkedin === "string" ? body.linkedin.trim() || null : null
      }
      if (body.github !== undefined) {
        dbUser.github = body.github && typeof body.github === "string" ? body.github.trim() || null : null
      }
      if (body.twitter !== undefined) {
        dbUser.twitter = body.twitter && typeof body.twitter === "string" ? body.twitter.trim() || null : null
      }
      if (body.website !== undefined) {
        dbUser.website = body.website && typeof body.website === "string" ? body.website.trim() || null : null
      }
      if (body.profilePublic !== undefined) {
        dbUser.profilePublic = body.profilePublic
      }
      if (body.image !== undefined) {
        dbUser.image = body.image
      }

      await dbUser.save()

      return successResponse({
        message: "Profile updated successfully",
        profile: {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image || null,
          profilePublic: dbUser.profilePublic ?? true,
          description: dbUser.description || null,
          linkedin: dbUser.linkedin || null,
          github: dbUser.github || null,
          twitter: dbUser.twitter || null,
          website: dbUser.website || null,
        },
      })
    }

    return methodNotAllowed()
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler, { roles: ["recipient"] })
export const PUT = withAuth(handler, { roles: ["recipient"] })

