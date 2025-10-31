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
  if (req.method !== "DELETE") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

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

export const DELETE = withIssuer(handler)

