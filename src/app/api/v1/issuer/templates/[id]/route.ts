import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { Template } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"
import { parseBody } from "@/lib/api/utils"

async function handler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method === "GET") {
    try {
      await connectDB()

      const params = context?.params instanceof Promise ? await context?.params : context?.params
      const templateId = params?.id
      const organizationIdStr = user?.organizationId as string | undefined

      if (!templateId) {
        return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
      }

      if (!organizationIdStr) {
        return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
      }

      const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

      const template = await Template.findOne({
        _id: templateId,
        organizationId,
      })
        .populate("createdBy", "name email")
        .lean()

      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }

      const templateData = template as any

      return NextResponse.json({
        template: {
          id: templateData._id.toString(),
          name: templateData.name,
          category: templateData.category || "general",
          type: templateData.type,
          placeholders: templateData.placeholders || [],
          certificateImage: templateData.certificateImage,
          certificateImageUrl: templateData.certificateImage,
          badgeImage: templateData.badgeImage,
          badgeImageUrl: templateData.badgeImage,
          isActive: templateData.isActive,
          createdAt: templateData.createdAt,
          createdBy: templateData.createdBy,
        },
      })
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      await connectDB()

      const params = context?.params instanceof Promise ? await context?.params : context?.params
      const templateId = params?.id
      const organizationIdStr = user?.organizationId as string | undefined

      if (!templateId) {
        return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
      }

      if (!organizationIdStr) {
        return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
      }

      const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

      const body = await parseBody<{
        name: string
        category?: string
        type: "certificate" | "badge" | "both"
        fields: Array<{
          name: string
          type: "text" | "email" | "number" | "date" | "id"
          coordinates?: { x: number; y: number; width: number; height: number }
          fontFamily?: string
          fontSize?: number
          fontColor?: string
          bold?: boolean
          italic?: boolean
        }>
        certificateImage?: string
        badgeImage?: string
      }>(req)

      const { name, category, type, fields, certificateImage, badgeImage } = body

      if (!name || !type || !fields || fields.length === 0) {
        return NextResponse.json({ error: "Name, type, and fields are required" }, { status: 400 })
      }

      // Check if email field exists
      const hasEmailField = fields.some((f) => f && f.type === "email")
      if (!hasEmailField) {
        return NextResponse.json({ error: "At least one email field is required" }, { status: 400 })
      }

      // Convert fields to placeholders format
      const placeholders: Array<{
        fieldName: string
        type: string
        fontSize?: number
        fontFamily?: string
        color?: string
        align?: "left" | "center" | "right"
        x?: number
        y?: number
        width?: number // For QR code fields
        height?: number // For QR code fields
        bold?: boolean
        italic?: boolean
      }> = []

      for (const field of fields) {
        // Email fields and optional date fields (Issue Date, Expiry Date) may not have coordinates
        const isEmailField = field.type === "email"
        const isIssueDateField = field.type === "date" && field.name.toLowerCase().trim() === "issue date"
        const isExpiryDateField = field.type === "date" && field.name.toLowerCase().trim() === "expiry date"
        
        // Only require coordinates for fields that are not email or optional date fields
        if (!isEmailField && !isIssueDateField && !isExpiryDateField) {
          if (!field.coordinates || field.coordinates.x === undefined || field.coordinates.y === undefined) {
            return NextResponse.json(
              { error: `Field "${field.name}" (${field.type}) must have coordinates` },
              { status: 400 }
            )
          }
        }

        // Build placeholder object - for email fields and optional date fields without coordinates, omit x/y entirely
        if (isEmailField || isIssueDateField || isExpiryDateField) {
          // Email or optional date field - coordinates are optional
          if (field.coordinates && field.coordinates.x !== undefined && field.coordinates.y !== undefined) {
            // Field with coordinates (displayed on certificate)
            placeholders.push({
              fieldName: field.name,
              type: field.type,
              fontSize: field.fontSize || 16,
              fontFamily: field.fontFamily || "Arial",
              color: field.fontColor || "#000000",
              align: "center" as const,
              x: field.coordinates.x,
              y: field.coordinates.y,
              bold: field.bold || false,
              italic: field.italic || false,
            })
          } else {
            // Field without coordinates (not displayed on certificate) - omit x/y entirely
            placeholders.push({
              fieldName: field.name,
              type: field.type,
              fontSize: field.fontSize || 16,
              fontFamily: field.fontFamily || "Arial",
              color: field.fontColor || "#000000",
              align: "center" as const,
              bold: field.bold || false,
              italic: field.italic || false,
            })
          }
        } else {
          // Other fields - coordinates are required (already validated)
          placeholders.push({
            fieldName: field.name,
            type: field.type,
            fontSize: field.fontSize || 16,
            fontFamily: field.fontFamily || "Arial",
            color: field.fontColor || "#000000",
            align: "center" as const,
            x: field.coordinates!.x,
            y: field.coordinates!.y,
            bold: field.bold || false,
            italic: field.italic || false,
          })
        }
      }

      const updateData: Record<string, unknown> = {
        name,
        category: category || "general",
        type,
        placeholders,
        updatedAt: new Date(),
      }

      if (certificateImage) {
        updateData.certificateImage = certificateImage
      }
      if (badgeImage) {
        updateData.badgeImage = badgeImage
      }

      const template = await Template.findOneAndUpdate(
        {
          _id: templateId,
          organizationId,
        },
        { $set: updateData },
        { new: true }
      )

      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Template updated successfully",
        template: {
          id: template._id.toString(),
          name: template.name,
        },
      })
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }

  if (req.method === "DELETE") {
    try {
      await connectDB()

      const params = context?.params instanceof Promise ? await context?.params : context?.params
      const templateId = params?.id
      const organizationIdStr = user?.organizationId as string | undefined

      if (!templateId) {
        return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
      }

      if (!organizationIdStr) {
        return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
      }

      const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

      const template = await Template.findOneAndDelete({
        _id: templateId,
        organizationId,
      })

      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }

      return NextResponse.json({
        message: "Template deleted successfully",
      })
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function GET(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  try {
    const handlerFunc = withIssuer(handler)
    return await handlerFunc(req, context)
  } catch (error) {
    console.error("GET handler error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PUT = withIssuer(handler)
export const DELETE = withIssuer(handler)
