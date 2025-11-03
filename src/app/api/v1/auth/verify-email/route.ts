import { NextRequest, NextResponse } from "next/server"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { handleApiError } from "@/lib/api/middleware"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // Token must not be expired
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Mark email as verified and clear token
    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    return NextResponse.json({
      message: "Email verified successfully",
      success: true,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
