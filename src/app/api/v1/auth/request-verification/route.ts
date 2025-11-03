import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { sendEmail } from "@/lib/email/nodemailer"
import { generateVerificationEmail } from "@/lib/email/templates"
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save token to user
    user.emailVerificationToken = verificationToken
    user.emailVerificationExpires = verificationExpires
    await user.save()

    // Generate verification URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:4300"
    const verificationLink = `${baseUrl}/verify-email/${verificationToken}`

    // Send verification email
    const emailHtml = generateVerificationEmail({
      name: user.name,
      verificationLink,
    })

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - CredVault",
      html: emailHtml,
    })

    return NextResponse.json({
      message: "Verification email sent successfully",
      success: true,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
