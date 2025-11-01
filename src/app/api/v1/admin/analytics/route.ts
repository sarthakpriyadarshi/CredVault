import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { Credential, Organization, Template } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    // Get last month's data for comparison
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get this month's data
    const [
      thisMonthCredentials,
      thisMonthOrganizations,
      thisMonthVerified,
      lastMonthCredentials,
      lastMonthOrganizations,
      lastMonthVerified,
      totalCredentials,
      totalOrganizations,
      totalVerified,
      credentialTypes,
      topIssuers,
    ] = await Promise.all([
      Credential.countDocuments({
        issuedAt: { $gte: thisMonth },
      }),
      Organization.countDocuments({
        createdAt: { $gte: thisMonth },
      }),
      Credential.countDocuments({
        issuedAt: { $gte: thisMonth },
        isOnBlockchain: true,
      }),
      Credential.countDocuments({
        issuedAt: { $gte: lastMonth, $lte: lastMonthEnd },
      }),
      Organization.countDocuments({
        createdAt: { $gte: lastMonth, $lte: lastMonthEnd },
      }),
      Credential.countDocuments({
        issuedAt: { $gte: lastMonth, $lte: lastMonthEnd },
        isOnBlockchain: true,
      }),
      Credential.countDocuments(),
      Organization.countDocuments({ verificationStatus: "approved" }),
      Credential.countDocuments({ isOnBlockchain: true }),
      // Get credential type distribution from templates
      Template.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),
      // Top 5 issuers by credentials issued
      Credential.aggregate([
        {
          $group: {
            _id: "$organizationId",
            count: { $sum: 1 },
            verified: {
              $sum: {
                $cond: [{ $eq: ["$isOnBlockchain", true] }, 1, 0],
              },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ])

    // Calculate growth percentages
    const credentialsGrowth = lastMonthCredentials > 0
      ? Math.round(((thisMonthCredentials - lastMonthCredentials) / lastMonthCredentials) * 100)
      : 0
    const organizationsGrowth = lastMonthOrganizations > 0
      ? Math.round(((thisMonthOrganizations - lastMonthOrganizations) / lastMonthOrganizations) * 100)
      : 0
    const verifiedGrowth = lastMonthVerified > 0
      ? Math.round(((thisMonthVerified - lastMonthVerified) / lastMonthVerified) * 100)
      : 0

    // Populate top issuers with organization names
    const orgIds = topIssuers.map((item) => item._id).filter(Boolean)
    const organizations = await Organization.find({ _id: { $in: orgIds } }).lean()

    const topIssuersWithNames = topIssuers
      .map((item) => {
        const org = organizations.find(
          (o) => o._id.toString() === item._id?.toString()
        )
        if (!org) return null
        const verifiedPercentage = item.count > 0
          ? Math.round((item.verified / item.count) * 100)
          : 0
        return {
          name: org.name,
          credentials: item.count,
          verified: `${verifiedPercentage}%`,
        }
      })
      .filter(Boolean)

    // Process credential types for pie chart
    const totalTemplates = credentialTypes.reduce((sum, item) => sum + item.count, 0)
    const credentialTypeData = credentialTypes.map((item) => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1) + "s",
      value: totalTemplates > 0 ? Math.round((item.count / totalTemplates) * 100) : 0,
    }))

    // Get chart data for last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const monthName = date.toLocaleDateString("en-US", { month: "short" })

      const [credentials, verified] = await Promise.all([
        Credential.countDocuments({
          issuedAt: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        }),
        Credential.countDocuments({
          issuedAt: {
            $gte: monthStart,
            $lte: monthEnd,
          },
          isOnBlockchain: true,
        }),
      ])

      months.push({
        month: monthName,
        credentials,
        verified,
        organizations: 0, // Can be calculated separately if needed
      })
    }

    return NextResponse.json({
      metrics: {
        totalCredentials: {
          value: totalCredentials,
          growth: credentialsGrowth,
        },
        totalOrganizations: {
          value: totalOrganizations,
          growth: organizationsGrowth,
        },
        verifiedCredentials: {
          value: totalVerified,
          growth: verifiedGrowth,
        },
        avgVerificationTime: {
          value: "2.5h", // This would need a separate calculation
          growth: -5,
        },
      },
      chartData: months,
      credentialTypes: credentialTypeData,
      topIssuers: topIssuersWithNames,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(handler)

