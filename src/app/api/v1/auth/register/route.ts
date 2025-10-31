import { NextRequest, NextResponse } from "next/server"
import { withDB, handleApiError } from "@/lib/api/middleware"
import { parseBody, isValidEmail } from "@/lib/api/utils"
import { User, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const body = await parseBody<{
      name: string
      email: string
      password: string
      role: "recipient" | "issuer"
      organizationName?: string
      website?: string
      verificationProof?: string
    }>(req)

    const { name, email, password, role, organizationName, website, verificationProof } = body

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

    if (role === "issuer" && !organizationName) {
      return NextResponse.json({ error: "Organization name is required for issuers" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    let organizationId = null

    // Create organization for issuers
    if (role === "issuer" && organizationName) {
      const existingOrg = await Organization.findOne({
        name: { $regex: new RegExp(`^${organizationName}$`, "i") },
      })

      if (existingOrg) {
        return NextResponse.json({ error: "Organization already exists" }, { status: 409 })
      }

      const organization = await Organization.create({
        name: organizationName,
        website: website || undefined,
        verificationStatus: "pending",
        verificationProof: verificationProof || null,
      })

      organizationId = organization._id
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      organizationId,
      isVerified: role === "recipient", // Recipients auto-verified, admins should be created via separate endpoint
      emailVerified: false,
    })

    // Note: After registration, use NextAuth signIn() for session management
    return NextResponse.json(
      {
        message: "User created successfully - use NextAuth signIn() for session management",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Registration error:", error)
    
    // Handle specific MongoDB/Mongoose errors
    if (error && typeof error === "object") {
      // Duplicate key error (email or organization name)
      if ("code" in error && error.code === 11000) {
        if ("keyPattern" in error && error.keyPattern && typeof error.keyPattern === "object") {
          if ("email" in error.keyPattern) {
            return NextResponse.json(
              { error: "An account with this email already exists" },
              { status: 409 }
            )
          }
          if ("name" in error.keyPattern) {
            return NextResponse.json(
              { error: "An organization with this name already exists" },
              { status: 409 }
            )
          }
        }
        return NextResponse.json(
          { error: "Duplicate entry. This record already exists." },
          { status: 409 }
        )
      }
      
      // Validation errors
      if ("name" in error && error.name === "ValidationError" && "errors" in error) {
        const errors = error.errors as Record<string, { message: string }>
        const firstError = Object.values(errors)[0]
        if (firstError?.message) {
          return NextResponse.json(
            { error: firstError.message },
            { status: 400 }
          )
        }
      }
      
      // Error with message
      if ("message" in error && typeof error.message === "string") {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    }
    
    // Fallback to generic error handler
    return handleApiError(error)
  }
}

export const POST = withDB(handler)
