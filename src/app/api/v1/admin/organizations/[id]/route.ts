import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import { Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
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

    const body = await parseBody<{
      name?: string
      description?: string
      website?: string
      verificationStatus?: "pending" | "approved" | "rejected"
      blockchainEnabled?: boolean
    }>(req)

    const organization = await Organization.findById(organizationId)

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    // Update fields if provided
    if (body.name !== undefined) {
      // Check if name already exists (excluding current organization)
      const existingOrg = await Organization.findOne({
        name: { $regex: new RegExp(`^${body.name}$`, "i") },
        _id: { $ne: organizationId },
      })

      if (existingOrg) {
        return NextResponse.json(
          { error: "An organization with this name already exists" },
          { status: 409 }
        )
      }
      organization.name = body.name
    }

    if (body.description !== undefined) {
      organization.description = body.description
    }

    if (body.website !== undefined) {
      organization.website = body.website
    }

    if (body.verificationStatus !== undefined) {
      organization.verificationStatus = body.verificationStatus
    }

    if (body.blockchainEnabled !== undefined) {
      organization.blockchainEnabled = body.blockchainEnabled
    }

    await organization.save()

    return NextResponse.json({
      message: "Organization updated successfully",
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        description: organization.description,
        website: organization.website,
        verificationStatus: organization.verificationStatus,
        logo: organization.logo,
        verificationProof: organization.verificationProof,
        verifiedAt: organization.verifiedAt,
        blockchainEnabled: organization.blockchainEnabled || false,
        createdAt: organization.createdAt,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const PUT = withAdmin(handler)
export const PATCH = withAdmin(handler)

