import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { Organization, Credential } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(req: NextRequest) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    // Get data for last 6 months
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
      
      const monthName = date.toLocaleDateString("en-US", { month: "short" })
      
      const [organizations, credentials] = await Promise.all([
        Organization.countDocuments({
          createdAt: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        }),
        Credential.countDocuments({
          issuedAt: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        }),
      ])
      
      months.push({
        month: monthName,
        organizations,
        credentials,
      })
    }

    return NextResponse.json(months)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(handler)

