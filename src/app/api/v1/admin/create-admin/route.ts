import { NextRequest, NextResponse } from "next/server"
import { withDB, handleApiError } from "@/lib/api/middleware"
import { parseBody, isValidEmail } from "@/lib/api/utils"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { invalidateAdminExists } from "@/lib/cache/invalidation"

/**
 * Admin Creation Endpoint
 * SECURITY: This endpoint should be protected or only used during initial setup
 * Consider adding additional security (e.g., secret token in env) for production
 */
async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    // Optional: Check for admin creation secret (add ADMIN_CREATE_SECRET to .env.local)
    const adminSecret = process.env.ADMIN_CREATE_SECRET
    const providedSecret = req.headers.get("x-admin-secret")

    if (adminSecret && providedSecret !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid secret" }, { status: 403 })
    }

    const body = await parseBody<{
      name: string
      email: string
      password: string
    }>(req)

    const { name, email, password } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Create admin user (auto-verified)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "admin",
      isVerified: true, // Admins are auto-verified
      emailVerified: false,
    })

    // Invalidate admin existence cache immediately
    await invalidateAdminExists(false)

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withDB(handler)

