import { NextRequest, NextResponse } from "next/server"
import { withDB, handleApiError } from "@/lib/api/middleware"
import { parseBody, isValidEmail } from "@/lib/api/utils"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const body = await parseBody<{
      email: string
      password: string
      role: "recipient" | "issuer" | "admin"
    }>(req)

    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password")

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check role match
    if (role && user.role !== role) {
      return NextResponse.json(
        { 
          error: `This account is registered as ${user.role}, not ${role}. Please use the ${user.role} login page.`,
          actualRole: user.role,
          requestedRole: role
        },
        { status: 403 }
      )
    }

    // Check issuer verification
    if (user.role === "issuer" && !user.isVerified) {
      return NextResponse.json(
        { error: "Your organization is pending verification. Please wait for admin approval." },
        { status: 403 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email address before signing in. Check your inbox for the verification link. If you don't see it, check your spam folder." },
        { status: 403 }
      )
    }

    // Role matches and credentials are valid
    return NextResponse.json({ 
      success: true,
      role: user.role,
      isVerified: user.isVerified
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withDB(handler)

