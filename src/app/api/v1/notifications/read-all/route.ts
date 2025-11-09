import { NextResponse } from "next/server"
import { getServerSessionForApi } from "@/lib/auth-server"
import { Notification } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { handleApiError } from "@/lib/api/middleware"

export async function PUT() {
  try {
    await connectDB()

    const session = await getServerSessionForApi()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await Notification.updateMany(
      {
        userId: session.user.id,
        read: false,
      },
      { read: true }
    )

    return NextResponse.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

