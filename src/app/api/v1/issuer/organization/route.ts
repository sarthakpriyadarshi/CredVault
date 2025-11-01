import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import { Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method === "GET") {
    try {
      await connectDB()

      const organizationIdStr = user?.organizationId as string | undefined
      if (!organizationIdStr) {
        return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
      }

      const organizationId = new mongoose.Types.ObjectId(organizationIdStr)
      const organization = await Organization.findById(organizationId).lean()

      if (!organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }

      return NextResponse.json({
        id: organization._id.toString(),
        name: organization.name,
        email: undefined, // Organization doesn't have email directly
        website: organization.website,
        verificationStatus: organization.verificationStatus,
        description: organization.description,
        logo: organization.logo,
      })
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }

  if (req.method === "PUT") {
    try {
      await connectDB()

      const organizationIdStr = user?.organizationId as string | undefined
      if (!organizationIdStr) {
        return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
      }

      const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

      const body = await parseBody<{
        name?: string
        website?: string
        description?: string
        logo?: string
      }>(req)

      const organization = await Organization.findById(organizationId)
      if (!organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }

      // Update fields if provided
      if (body.name !== undefined) {
        organization.name = body.name.trim()
      }
      if (body.website !== undefined) {
        organization.website = body.website.trim()
      }
      if (body.description !== undefined) {
        organization.description = body.description.trim()
      }
      if (body.logo !== undefined) {
        organization.logo = body.logo
      }

      await organization.save()

      return NextResponse.json({
        message: "Organization updated successfully",
        organization: {
          id: organization._id.toString(),
          name: organization.name,
          website: organization.website,
          verificationStatus: organization.verificationStatus,
          description: organization.description,
          logo: organization.logo,
        },
      })
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export const GET = withIssuer(handler)
export const PUT = withIssuer(handler)
