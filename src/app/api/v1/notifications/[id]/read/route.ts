import { NextRequest, NextResponse } from "next/server"
import { getServerSessionForApi } from "@/lib/auth-server"
import { Notification } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { handleApiError } from "@/lib/api/middleware"

export async function PUT(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  try {
    await connectDB()

    const session = await getServerSessionForApi()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = context?.params instanceof Promise ? await context.params : context?.params
    const notificationId = params?.id

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: session.user.id, // Ensure user owns this notification
      },
      { read: true },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Notification marked as read",
      notification,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

