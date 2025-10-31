import { NextRequest, NextResponse } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { getPagination, createPaginatedResponse } from "@/lib/api/utils"
import { Credential, Template, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const userId = user?.id as string | undefined
    const userEmail = user?.email as string | undefined

    if (!userId && !userEmail) {
      return NextResponse.json({ error: "User ID or email not found" }, { status: 400 })
    }

    // Get filter type from query params
    const { getQueryParams } = await import("@/lib/api/utils")
    const searchParams = getQueryParams(req)
    const filter = searchParams.get("filter") // "all", "blockchain", "expiring"

    // Build query to find credentials for this recipient
    const query: any = {}
    if (userId) {
      query.recipientId = userId
    } else if (userEmail) {
      query.recipientEmail = userEmail.toLowerCase()
    }
    query.status = { $ne: "revoked" } // Exclude revoked credentials

    // Apply filters
    if (filter === "blockchain") {
      query.isOnBlockchain = true
    } else if (filter === "expiring") {
      // Credentials expiring in next 30 days
      const now = new Date()
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      query.expiresAt = {
        $gte: now,
        $lte: thirtyDaysFromNow,
      }
    }
    // "all" or no filter = show all

    const pagination = getPagination(req, 20)

    // Get credentials with populated template and organization
    const [credentials, total] = await Promise.all([
      Credential.find(query)
        .populate("templateId", "name")
        .populate("organizationId", "name")
        .sort({ issuedAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Credential.countDocuments(query),
    ])

    const formattedCredentials = credentials.map((cred: any) => {
      const template = cred.templateId as any
      const organization = cred.organizationId as any

      return {
        id: cred._id.toString(),
        title: template?.name || "Unknown Credential",
        issuer: organization?.name || "Unknown Organization",
        date: `Issued ${new Date(cred.issuedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
        issuedAt: cred.issuedAt,
        verified: cred.isOnBlockchain || false,
        type: cred.type,
        status: cred.status,
        expiresAt: cred.expiresAt ? cred.expiresAt.toISOString() : undefined,
        certificateUrl: cred.certificateUrl,
        badgeUrl: cred.badgeUrl,
      }
    })

    const response = createPaginatedResponse(formattedCredentials, total, pagination)
    return NextResponse.json(response)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler, { roles: ["recipient"] })

