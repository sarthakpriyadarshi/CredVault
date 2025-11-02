import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import { User } from "@/models"
import { invalidateAdminExists } from "@/lib/cache/invalidation"
import { hasAdminUser } from "@/lib/cache/user-cache"

// Check if setup is needed (no admin users exist)
// This endpoint is called on EVERY page load by SetupChecker component
// Using cached hasAdminUser() to avoid repeated DB queries
// Use ?direct=true query parameter to bypass cache (for setup page itself)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isDirect = searchParams.get("direct") === "true"

    let adminExists: boolean

    if (isDirect) {
      // Direct DB query for setup page - always fresh data
      if (process.env.NODE_ENV === "development") {
        console.log("[CACHE] Direct DB query requested (bypassing cache)")
      }
      await connectDB()
      const adminCount = await User.countDocuments({ role: "admin" })
      adminExists = adminCount > 0
    } else {
      // Use cached function for all other requests (SetupChecker)
      // Cache is configured with 2hr stale time in next.config.ts
      adminExists = await hasAdminUser()
    }

    return NextResponse.json({
      setupNeeded: !adminExists,
      hasAdmin: adminExists,
    })
  } catch (error) {
    console.error("Error checking setup status:", error)
    return NextResponse.json(
      { error: "Failed to check setup status" },
      { status: 500 }
    )
  }
}

// Create first admin user - Protected: Only works if no admin exists
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    // PROTECTION: Check if admin already exists - prevent unauthorized admin creation
    const adminCount = await User.countDocuments({ role: "admin" })
    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Admin user already exists." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create admin user - password will be hashed by pre-save hook
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password, // Pass raw password, pre-save hook will hash it
      role: "admin",
      isVerified: true, // Auto-verify first admin
    })

    // Invalidate admin existence cache since we just created the first admin
    // Use background revalidation (false) since we're in a Route Handler, not Server Action
    await invalidateAdminExists(false)

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    )
  }
}
