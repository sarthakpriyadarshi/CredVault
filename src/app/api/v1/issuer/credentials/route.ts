import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { parseBody, isValidEmail } from "@/lib/api/utils"
import { Credential, Template, User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"
import { generateCertificate, generateBadge } from "@/lib/certificate-generator"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const organizationIdStr = user?.organizationId as string | undefined
    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

    const body = await parseBody<{
      templateId: string
      data: Record<string, string>
      useBlockchain?: boolean
    }>(req)

    const { templateId, data, useBlockchain } = body

    if (!templateId || !data) {
      return NextResponse.json({ error: "Template ID and data are required" }, { status: 400 })
    }

    // Find template
    const template = await Template.findOne({
      _id: templateId,
      organizationId,
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Find email field
    const emailField = template.placeholders.find((p) => p.type === "email")
    if (!emailField) {
      return NextResponse.json({ error: "Template must have an email field" }, { status: 400 })
    }

    const recipientEmail = data[emailField.fieldName]?.toLowerCase().trim()
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Check if recipient user exists
    let recipientId = undefined
    const recipientUser = await User.findOne({ email: recipientEmail })
    if (recipientUser) {
      recipientId = recipientUser._id
    }

    // Generate certificate/badge images if template has them
    let certificateUrl: string | undefined = undefined
    let badgeUrl: string | undefined = undefined

    try {
      // Generate certificate if template type is "certificate" or "both"
      if ((template.type === "certificate" || template.type === "both") && template.certificateImage) {
        // Only generate for placeholders that have coordinates (displayed on certificate)
        const displayedPlaceholders = template.placeholders.filter(
          (p) => p.x !== undefined && p.y !== undefined
        )

        if (displayedPlaceholders.length > 0) {
          certificateUrl = await generateCertificate({
            templateImagePath: template.certificateImage,
            placeholders: displayedPlaceholders,
            data,
          })
        }
      }

      // Generate badge if template type is "badge" or "both"
      if ((template.type === "badge" || template.type === "both") && template.badgeImage) {
        // Only generate for placeholders that have coordinates (displayed on badge)
        const displayedPlaceholders = template.placeholders.filter(
          (p) => p.x !== undefined && p.y !== undefined
        )

        if (displayedPlaceholders.length > 0) {
          badgeUrl = await generateBadge({
            templateImagePath: template.badgeImage,
            placeholders: displayedPlaceholders,
            data,
          })
        }
      }
    } catch (error) {
      console.error("Error generating certificate/badge images:", error)
      // Continue with credential creation even if image generation fails
      // The credential will still be created but without certificateUrl/badgeUrl
    }

    // Create credential
    const credential = await Credential.create({
      templateId: template._id,
      organizationId,
      recipientEmail,
      recipientId,
      credentialData: data,
      type: template.type,
      certificateUrl,
      badgeUrl,
      isOnBlockchain: useBlockchain || false,
      status: "active",
      issuedAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Credential issued successfully",
        credential: {
          id: credential._id.toString(),
          recipientEmail: credential.recipientEmail,
          issuedAt: credential.issuedAt,
          certificateUrl: credential.certificateUrl,
          badgeUrl: credential.badgeUrl,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withIssuer(handler)

