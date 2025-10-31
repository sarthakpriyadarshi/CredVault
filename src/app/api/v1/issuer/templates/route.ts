import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { getPagination, createPaginatedResponse, parseBody } from "@/lib/api/utils"
import { Template } from "@/models"
import mongoose from "mongoose"

// GET templates
async function getHandler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  try {
    const organizationIdStr = user?.organizationId as string | undefined
    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

    const pagination = getPagination(req, 10)

    // Get templates for the organization
    const [templates, total] = await Promise.all([
      Template.find({ organizationId })
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("createdBy", "name email")
        .lean(),
      Template.countDocuments({ organizationId }),
    ])

    // Get credential counts for each template
    const { Credential } = await import("@/models")
    const templateIds = templates.map((t: any) => t._id)
    const credentialCounts = await Credential.aggregate([
      {
        $match: {
          templateId: { $in: templateIds },
        },
      },
      {
        $group: {
          _id: "$templateId",
          count: { $sum: 1 },
        },
      },
    ])

    const countMap = new Map(credentialCounts.map((item: any) => [item._id.toString(), item.count]))

    const templatesWithCounts = templates.map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
      category: t.category || "general",
      credentialsIssued: countMap.get(t._id.toString()) || 0,
      createdAt: t.createdAt,
      archived: !t.isActive,
      fields: t.placeholders?.map((p: any) => ({
        name: p.fieldName,
        type: p.type,
      })) || [],
    }))

    const response = createPaginatedResponse(templatesWithCounts, total, pagination)
    return NextResponse.json(response)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

// POST - Create template
async function postHandler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  try {
    const organizationIdStr = user?.organizationId as string | undefined
    const userId = user?.id as string | undefined

    if (!organizationIdStr || !userId) {
      return NextResponse.json({ error: "Organization ID or User ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)
    const createdBy = new mongoose.Types.ObjectId(userId)

    const body = await parseBody<{
      name: string
      category?: string
      type: "certificate" | "badge" | "both"
      useBlockchain?: boolean
      fields: Array<{
        name: string
        type: "text" | "email" | "number" | "date" | "id"
        coordinates?: { x: number; y: number; width: number; height: number } // Optional for email fields
        fontFamily?: string
        fontSize?: number
        fontColor?: string
      }>
      certificateImage?: string
      badgeImage?: string
    }>(req)

    const { name, category, type, fields, certificateImage, badgeImage } = body

    if (!name || !type || !fields || fields.length === 0) {
      return NextResponse.json({ error: "Name, type, and fields are required" }, { status: 400 })
    }

    // Validate image requirements based on type
    if ((type === "certificate" || type === "both") && !certificateImage) {
      return NextResponse.json({ error: "Certificate image is required for certificate type" }, { status: 400 })
    }
    if ((type === "badge" || type === "both") && !badgeImage) {
      return NextResponse.json({ error: "Badge image is required for badge type" }, { status: 400 })
    }

    // Check if email field exists in the fields array
    const hasEmailField = fields.some((f) => f && f.type === "email")
    if (!hasEmailField) {
      console.error("No email field found in fields array:", JSON.stringify(fields, null, 2))
      return NextResponse.json({ error: "At least one email field is required" }, { status: 400 })
    }

        // Convert fields to placeholders format
        // Email fields may not have coordinates if not displayed on certificate
        const placeholders: Array<{
          fieldName: string
          type: string
          fontSize: number
          fontFamily: string
          color: string
          align: "left" | "center" | "right"
          x?: number
          y?: number
        }> = []

        for (const field of fields) {
          // Non-email fields must have coordinates
          if (field.type !== "email") {
            if (!field.coordinates || field.coordinates.x === undefined || field.coordinates.y === undefined) {
              return NextResponse.json({ 
                error: `Field "${field.name}" (${field.type}) must have coordinates` 
              }, { status: 400 })
            }
          }

          // Build placeholder object - for email fields without coordinates, omit x/y entirely
          if (field.type === "email") {
            // Email field - coordinates are optional
            if (field.coordinates && field.coordinates.x !== undefined && field.coordinates.y !== undefined) {
              // Email field with coordinates (displayed on certificate)
              placeholders.push({
                fieldName: field.name,
                type: field.type,
                fontSize: field.fontSize || 16,
                fontFamily: field.fontFamily || "Arial",
                color: field.fontColor || "#000000",
                align: "center" as const,
                x: field.coordinates.x,
                y: field.coordinates.y,
              })
            } else {
              // Email field without coordinates (not displayed on certificate) - omit x/y entirely
              placeholders.push({
                fieldName: field.name,
                type: field.type,
                fontSize: field.fontSize || 16,
                fontFamily: field.fontFamily || "Arial",
                color: field.fontColor || "#000000",
                align: "center" as const,
              })
            }
          } else {
            // Non-email field - coordinates are required (already validated)
            placeholders.push({
              fieldName: field.name,
              type: field.type,
              fontSize: field.fontSize || 16,
              fontFamily: field.fontFamily || "Arial",
              color: field.fontColor || "#000000",
              align: "center" as const,
              x: field.coordinates!.x,
              y: field.coordinates!.y,
            })
          }
        }

        // Double-check that we have at least one email field after conversion
        const hasEmailAfterConversion = placeholders.some((p) => p && p.type === "email")
        if (!hasEmailAfterConversion) {
          console.error("Placeholders conversion failed - no email field found. Fields sent:", JSON.stringify(fields, null, 2))
          console.error("Placeholders created:", JSON.stringify(placeholders, null, 2))
          return NextResponse.json({ 
            error: "At least one email field is required in placeholders" 
          }, { status: 400 })
        }

        // Verify all placeholders have required fields
        if (placeholders.length === 0) {
          return NextResponse.json({ 
            error: "At least one field is required" 
          }, { status: 400 })
        }

        // Log placeholders before creating template for debugging
        console.log("Creating template with placeholders:", JSON.stringify(placeholders.map(p => ({ fieldName: p.fieldName, type: p.type, hasX: p.x !== undefined, hasY: p.y !== undefined })), null, 2))

    const template = await Template.create({
      name: name.trim(),
      category: (category || "general").trim().toLowerCase(),
      type,
      organizationId,
      createdBy,
      placeholders,
      certificateImage: certificateImage || undefined,
      badgeImage: badgeImage || undefined,
      isActive: true,
    })

    return NextResponse.json(
      {
        message: "Template created successfully",
        template: {
          id: template._id.toString(),
          name: template.name,
          category: template.category,
          type: template.type,
          fields: template.placeholders.map((p) => ({
            name: p.fieldName,
            type: p.type,
            coordinates: { x: p.x, y: p.y, width: 150, height: 30 },
          })),
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

// Ensure handlers match Next.js App Router route handler signature
export async function GET(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  try {
    const handler = withIssuer(getHandler)
    return await handler(req, context)
  } catch (error) {
    console.error("GET handler error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  try {
    const handler = withIssuer(postHandler)
    return await handler(req, context)
  } catch (error) {
    console.error("POST handler error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
