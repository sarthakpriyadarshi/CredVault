import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { getPagination, createPaginatedResponse, getQueryParams, parseBody } from "@/lib/api/utils"
import { Organization, User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import crypto from "crypto"
import { sendEmail } from "@/lib/email/nodemailer"
import { generateVerificationEmail } from "@/lib/email/templates"

async function getHandler(req: NextRequest) {
  try {
    await connectDB()

    const pagination = getPagination(req, 20)
    const searchParams = getQueryParams(req)
    const status = searchParams.get("status") // pending, approved, rejected, or all

    // Build filter
    const filter: Record<string, unknown> = {}
    if (status && status !== "all") {
      filter.verificationStatus = status
    }

    // Get organizations with pagination
    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Organization.countDocuments(filter),
    ])

    // Get issuer users for each organization
    const orgIds = organizations.map((org) => org._id)
    const issuerUsers = await User.find({
      organizationId: { $in: orgIds },
      role: "issuer",
    })
      .select("name email createdAt isVerified")
      .lean()

    // Map users to organizations
    const organizationsWithUsers = organizations.map((org) => {
      const users = issuerUsers.filter(
        (user) => user.organizationId?.toString() === org._id.toString()
      )
      return {
        id: org._id.toString(),
        name: org.name,
        description: org.description,
        website: org.website,
        logo: org.logo,
        verificationProof: org.verificationProof || null,
        verificationStatus: org.verificationStatus,
        verifiedBy: org.verifiedBy
          ? {
              id: (org.verifiedBy as unknown as { _id: { toString: () => string }; name: string; email: string })._id.toString(),
              name: (org.verifiedBy as unknown as { _id: { toString: () => string }; name: string; email: string }).name,
              email: (org.verifiedBy as unknown as { _id: { toString: () => string }; name: string; email: string }).email,
            }
          : null,
        verifiedAt: org.verifiedAt,
        rejectionReason: org.rejectionReason,
        createdAt: org.createdAt,
        issuerCount: users.length,
        issuers: users.map((u) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          isVerified: u.isVerified,
          createdAt: u.createdAt,
        })),
      }
    })

    return NextResponse.json(
      createPaginatedResponse(organizationsWithUsers, total, pagination)
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

async function postHandler(req: NextRequest) {
  try {
    await connectDB()

    const body = await parseBody<{
      name: string
      website?: string
      email: string
      password: string
    }>(req)

    const { name, website, email, password } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Issuer email is required" }, { status: 400 })
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if organization with this name already exists
    const existingOrg = await Organization.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with this name already exists" },
        { status: 409 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    // Create organization with approved status
    const organization = await Organization.create({
      name: name.trim(),
      website: website?.trim() || undefined,
      verificationStatus: "approved",
      verifiedAt: new Date(),
    })

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create issuer user with the organization ID
    const user = await User.create({
      name: name.trim(), // Use organization name as user name
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      role: "issuer",
      organizationId: organization._id,
      isVerified: true, // Auto-approve issuer (organization is approved)
      emailVerified: false, // Require email verification
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    })

    // Send verification email
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4300"
      const verificationLink = `${baseUrl}/verify-email/${verificationToken}`
      
      const emailHtml = generateVerificationEmail({
        name: user.name,
        verificationLink,
      })

      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - CredVault",
        html: emailHtml,
      })
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      // Don't fail organization creation if email fails - user can request new verification email
    }

    return NextResponse.json({
      message: "Organization and issuer account created successfully. A verification email has been sent to the issuer.",
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        website: organization.website,
        verificationStatus: organization.verificationStatus,
      },
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(getHandler)
export const POST = withAdmin(postHandler)


