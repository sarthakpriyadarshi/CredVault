import { NextRequest, NextResponse } from "next/server"
import { getServerSessionForApi } from "@/lib/auth-server"
import { Notification } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { handleApiError } from "@/lib/api/middleware"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const session = await getServerSessionForApi()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = parseInt(searchParams.get("skip") || "0")

    const query: any = { userId: session.user.id }
    if (unreadOnly) {
      query.read = false
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      read: false,
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

