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
    // Credentials can be matched by either recipientId OR recipientEmail
    // This handles cases where recipient was registered before/after credential issuance
    const query: any = {
      $or: [] as any[],
      status: { $ne: "revoked" }, // Exclude revoked credentials
    }
    
    if (userId) {
      query.$or.push({ recipientId: userId })
    }
    if (userEmail) {
      query.$or.push({ recipientEmail: userEmail.toLowerCase() })
    }
    
    // If no OR conditions, this shouldn't happen but handle gracefully
    if (query.$or.length === 0) {
      return NextResponse.json({ error: "User ID or email not found" }, { status: 400 })
    }

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

    const pagination = getPagination(req, 10) // Limit to 10 per page for better performance

    // Get credentials with populated template and organization
    // Use indexed sorting to avoid disk usage - the compound indexes are already set up in the model
    const [credentials, total] = await Promise.all([
      Credential.find(query)
        .populate("templateId", "name")
        .populate("organizationId", "name")
        .sort({ issuedAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .hint(userId ? { recipientId: 1, issuedAt: -1 } : { recipientEmail: 1, issuedAt: -1 }), // Use appropriate compound index
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
        type: cred.type || "certificate",
        status: cred.status,
        expiresAt: cred.expiresAt ? cred.expiresAt.toISOString() : undefined,
        certificateUrl: cred.certificateUrl || null,
        badgeUrl: cred.badgeUrl || null,
      }
    })

    const response = createPaginatedResponse(formattedCredentials, total, pagination)
    return NextResponse.json(response)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler, { roles: ["recipient"] })

