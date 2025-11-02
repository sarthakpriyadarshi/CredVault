import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { Organization, User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { invalidateAllUsers } from "@/lib/cache"

async function handler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    // Await params if it's a Promise (Next.js 16)
    const params = context?.params instanceof Promise ? await context.params : context?.params
    const organizationId = params?.id

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const organization = await Organization.findById(organizationId)

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    if (organization.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: `Organization is already ${organization.verificationStatus}` },
        { status: 400 }
      )
    }

    // Update organization status
    organization.verificationStatus = "approved"
    organization.verifiedBy = user?.id as any
    organization.verifiedAt = new Date()
    await organization.save()

    // Update all issuer users associated with this organization to be verified
    await User.updateMany(
      { organizationId: organization._id, role: "issuer" },
      { $set: { isVerified: true } }
    )

    // Invalidate cache for all affected users (use false for Route Handler)
    await invalidateAllUsers(false)

    return NextResponse.json({
      message: "Organization approved successfully",
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        verificationStatus: organization.verificationStatus,
        verifiedAt: organization.verifiedAt,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withAdmin(handler)

