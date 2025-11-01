import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { getPagination, createPaginatedResponse, getQueryParams } from "@/lib/api/utils"
import { User, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const pagination = getPagination(req, 20)
    const searchParams = getQueryParams(req)
    const role = searchParams.get("role") // recipient, issuer, admin, or all
    const search = searchParams.get("search") // search by name or email

    // Build filter
    const filter: any = {}
    if (role && role !== "all") {
      filter.role = role
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("organizationId", "name verificationStatus")
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(filter),
    ])

    const usersWithOrg = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      organization: user.organizationId
        ? {
            id: (user.organizationId as any)._id.toString(),
            name: (user.organizationId as any).name,
            verificationStatus: (user.organizationId as any).verificationStatus,
          }
        : null,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    return NextResponse.json(createPaginatedResponse(usersWithOrg, total, pagination))
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(handler)

