import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { sendEmail } from "@/lib/email/nodemailer"
import { generatePasswordResetEmail } from "@/lib/email/templates"
import { handleApiError } from "@/lib/api/middleware"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent",
        success: true,
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to user
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetExpires
    await user.save()

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:4300"
    const resetLink = `${baseUrl}/reset-password/${resetToken}`

    // Send password reset email
    const emailHtml = generatePasswordResetEmail({
      name: user.name,
      resetLink,
    })

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password - CredVault",
      html: emailHtml,
    })

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent",
      success: true,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
