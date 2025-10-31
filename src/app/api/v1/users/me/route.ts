import { NextRequest, NextResponse } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { User, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context: { params?: Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const dbUser = await User.findById(user.id).populate("organizationId")

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        organizationId: dbUser.organizationId?._id?.toString(),
        organization: dbUser.organizationId
          ? {
              id: dbUser.organizationId._id.toString(),
              name: dbUser.organizationId.name,
              verificationStatus: dbUser.organizationId.verificationStatus,
            }
          : null,
        isVerified: dbUser.isVerified,
        emailVerified: dbUser.emailVerified,
        image: dbUser.image,
        createdAt: dbUser.createdAt,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler)

