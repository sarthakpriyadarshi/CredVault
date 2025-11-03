import { NextRequest, NextResponse } from "next/server"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { handleApiError } from "@/lib/api/middleware"
import { sendEmail } from "@/lib/email/nodemailer"
import { generatePasswordResetConfirmationEmail } from "@/lib/email/templates"
import { createNotification } from "@/lib/notifications"

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

    // Send password reset confirmation email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4300"
      const loginLink = `${baseUrl}/auth/login`
      const timestamp = new Date().toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })

      const emailHtml = generatePasswordResetConfirmationEmail({
        name: user.name,
        loginLink,
        timestamp,
      })

      await sendEmail({
        to: user.email,
        subject: "Password Reset Successful - CredVault",
        html: emailHtml,
      })

      // Create in-app notification
      await createNotification({
        userId: user._id,
        type: "password_reset",
        title: "Password Reset Successful",
        message: "Your password has been successfully reset. If you didn't make this change, please contact support immediately.",
        link: loginLink,
      })
    } catch (error) {
      console.error("Error sending password reset confirmation email:", error)
      // Don't fail the request if email/notification fails
    }

    return NextResponse.json({
      message: "Password reset successfully",
      success: true,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
