import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { Template, Credential } from "@/models"
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

    const organizationId = user?.organizationId as string | undefined
    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    // Get statistics for the issuer's organization
    const [
      totalTemplates,
      activeTemplates,
      totalCredentials,
      blockchainCredentials,
    ] = await Promise.all([
      Template.countDocuments({ organizationId }),
      Template.countDocuments({ organizationId, isActive: true }),
      Credential.countDocuments({ organizationId }),
      Credential.countDocuments({ organizationId, isOnBlockchain: true }),
    ])

    return NextResponse.json({
      templates: {
        total: totalTemplates,
        active: activeTemplates,
      },
      credentials: {
        total: totalCredentials,
        onBlockchain: blockchainCredentials,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withIssuer(handler)

