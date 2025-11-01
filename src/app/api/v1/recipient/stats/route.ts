import { NextRequest, NextResponse } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { Credential } from "@/models"
import connectDB from "@/lib/db/mongodb"

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

    const userId = user?.id as string | undefined
    const userEmail = user?.email as string | undefined

    if (!userId && !userEmail) {
      return NextResponse.json({ error: "User ID or email not found" }, { status: 400 })
    }

    // Build query to find credentials for this recipient
    const query: any = {
      $or: [] as any[],
      status: { $ne: "revoked" }, // Exclude revoked credentials
    }
    
    if (userId) {
      query.$or.push({ recipientId: userId })
    }
    if (userEmail) {
      query.$or.push({ recipientEmail: userEmail.toLowerCase() })
    }
    
    // If no OR conditions, this shouldn't happen but handle gracefully
    if (query.$or.length === 0) {
      return NextResponse.json({ error: "User ID or email not found" }, { status: 400 })
    }

    // Get statistics
    const [
      totalCredentials,
      blockchainCredentials,
      expiringCredentials,
    ] = await Promise.all([
      Credential.countDocuments(query),
      Credential.countDocuments({
        ...query,
        isOnBlockchain: true,
      }),
      Credential.countDocuments({
        ...query,
        expiresAt: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      }),
    ])

    const response = {
      total: totalCredentials,
      blockchainVerified: blockchainCredentials,
      aboutToExpire: expiringCredentials,
    }

    console.log("Stats response:", response) // Debug log

    return NextResponse.json(response)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAuth(handler, { roles: ["recipient"] })

