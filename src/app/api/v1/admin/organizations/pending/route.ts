import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { getPagination, createPaginatedResponse } from "@/lib/api/utils"
import { Organization, User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(req: NextRequest) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const pagination = getPagination(req, 10)

    // Get pending organizations with pagination
    const [organizations, total] = await Promise.all([
      Organization.find({ verificationStatus: "pending" })
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Organization.countDocuments({ verificationStatus: "pending" }),
    ])

    // Get issuer users for each organization
    const orgIds = organizations.map((org) => org._id)
    const issuerUsers = await User.find({
      organizationId: { $in: orgIds },
      role: "issuer",
    })
      .select("name email createdAt")
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
        createdAt: org.createdAt,
        issuerCount: users.length,
        issuers: users.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
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

