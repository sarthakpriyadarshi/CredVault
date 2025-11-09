import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { Credential } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const organizationIdStr = user?.organizationId as string | undefined
    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

    // Get analytics data
    const [totalIssued, activeRecipients, revoked, topTemplates] = await Promise.all([
      Credential.countDocuments({ organizationId }),
      Credential.distinct("recipientEmail", { organizationId, status: "active" }).then((emails) => emails.length),
      Credential.countDocuments({ organizationId, status: "revoked" }),
      Credential.aggregate([
        { $match: { organizationId } },
        { $group: { _id: "$templateId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "templates",
            localField: "_id",
            foreignField: "_id",
            as: "template",
          },
        },
        { $unwind: "$template" },
        {
          $project: {
            name: "$template.name",
            issued: "$count",
            active: "$template.isActive",
          },
        },
      ]),
    ])

    // Get trend data (last 6 months)
    const now = new Date()
    const trend = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      const [issued, recipients, revokedCount] = await Promise.all([
        Credential.countDocuments({
          organizationId,
          issuedAt: { $gte: monthStart, $lte: monthEnd },
        }),
        Credential.distinct("recipientEmail", {
          organizationId,
          issuedAt: { $gte: monthStart, $lte: monthEnd },
        }).then((emails) => emails.length),
        Credential.countDocuments({
          organizationId,
          revokedAt: { $gte: monthStart, $lte: monthEnd },
        }),
      ])

      trend.push({
        month: monthName,
        issued,
        recipients,
        revoked: revokedCount,
      })
    }

    return NextResponse.json({
      totalIssued,
      activeRecipients,
      revoked,
      avgTime: "45s", // Placeholder
      topTemplates,
      trend,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withIssuer(handler)

