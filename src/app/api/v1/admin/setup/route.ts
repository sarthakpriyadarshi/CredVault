import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db/mongodb"
import { User } from "@/models"

// Check if setup is needed (no admin users exist)
export async function GET() {
  try {
    await connectDB()

    const adminCount = await User.countDocuments({ role: "admin" })

    return NextResponse.json({
      setupNeeded: adminCount === 0,
      hasAdmin: adminCount > 0,
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
