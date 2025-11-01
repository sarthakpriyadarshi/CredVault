import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { Template } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

async function handler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method === "GET") {
    try {
      await connectDB()

      const params = context?.params instanceof Promise ? await context.params : context.params
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
          badgeImage: templateData.badgeImage,
          isActive: templateData.isActive,
          createdAt: templateData.createdAt,
          createdBy: templateData.createdBy,
        },
      })
    } catch (error: unknown) {
      return handleApiError(error)
    }
  }

  if (req.method === "DELETE") {
    try {
      await connectDB()

      const params = context?.params instanceof Promise ? await context.params : context.params
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

export const DELETE = withIssuer(handler)
