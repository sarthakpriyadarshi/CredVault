import { NextRequest, NextResponse } from "next/server"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { handleApiError } from "@/lib/api/middleware"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
    }).select("+password")

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Update password and clear reset token
    user.password = password // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return NextResponse.json({
      message: "Password reset successfully",
      success: true,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
