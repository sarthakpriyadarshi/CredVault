import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { getPagination, createPaginatedResponse, getQueryParams } from "@/lib/api/utils"
import { Organization, User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context: { params?: Record<string, string> },
  _user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const pagination = getPagination(req, 20)
    const searchParams = getQueryParams(req)
    const status = searchParams.get("status") // pending, approved, rejected, or all

    // Build filter
    const filter: any = {}
    if (status && status !== "all") {
      filter.verificationStatus = status
    }

    // Get organizations with pagination
    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Organization.countDocuments(filter),
    ])

    // Get issuer users for each organization
    const orgIds = organizations.map((org) => org._id)
    const issuerUsers = await User.find({
      organizationId: { $in: orgIds },
      role: "issuer",
    })
      .select("name email createdAt isVerified")
      .lean()

    // Map users to organizations
    const organizationsWithUsers = organizations.map((org) => {
      const users = issuerUsers.filter(
        (user) => user.organizationId?.toString() === org._id.toString()
      )
      return {
        id: org._id.toString(),
        name: org.name,
        description: org.description,
        website: org.website,
        logo: org.logo,
        verificationProof: org.verificationProof || null,
        verificationStatus: org.verificationStatus,
        verifiedBy: org.verifiedBy
          ? {
              id: org.verifiedBy._id.toString(),
              name: org.verifiedBy.name,
              email: org.verifiedBy.email,
            }
          : null,
        verifiedAt: org.verifiedAt,
        rejectionReason: org.rejectionReason,
        createdAt: org.createdAt,
        issuerCount: users.length,
        issuers: users.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          isVerified: u.isVerified,
          createdAt: u.createdAt,
        })),
      }
    })

    return NextResponse.json(
      createPaginatedResponse(organizationsWithUsers, total, pagination)
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(handler)

