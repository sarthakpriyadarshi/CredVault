import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { Credential } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

async function handler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "PUT") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const params = context?.params instanceof Promise ? await context.params : context?.params
    const credentialId = params?.id
    const organizationIdStr = user?.organizationId as string | undefined
    const userId = user?.id as string | undefined

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID is required" }, { status: 400 })
    }

    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)
    const revokedBy = userId ? new mongoose.Types.ObjectId(userId) : undefined

    // Find credential and verify it belongs to the organization
    const credential = await Credential.findOne({
      _id: credentialId,
      organizationId,
    })

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 })
    }

    if (credential.status === "revoked") {
      return NextResponse.json({ error: "Credential is already revoked" }, { status: 400 })
    }

    // Revoke the credential
    credential.status = "revoked"
    credential.revokedAt = new Date()
    if (revokedBy) {
      credential.revokedBy = revokedBy
    }
    await credential.save()

    return NextResponse.json({
      message: "Credential revoked successfully",
      credential: {
        id: credential._id.toString(),
        status: credential.status,
        revokedAt: credential.revokedAt,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const PUT = withIssuer(handler)

