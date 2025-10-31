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
      role?: "recipient" | "issuer" | "admin"
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
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check role match if specified
    if (role && user.role !== role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check issuer verification
    if (user.role === "issuer" && !user.isVerified) {
      return NextResponse.json(
        { error: "Organization pending verification. Please wait for admin approval." },
        { status: 403 }
      )
    }

    // Note: This endpoint is primarily for compatibility
    // Actual authentication should use NextAuth signIn() which handles sessions automatically
    return NextResponse.json({
      message: "Login successful - use NextAuth signIn() for session management",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId?.toString(),
        isVerified: user.isVerified,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withDB(handler)
