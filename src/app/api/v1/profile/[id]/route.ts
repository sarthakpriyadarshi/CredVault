import { NextRequest } from "next/server"
import { withDB, handleApiError } from "@/lib/api/middleware"
import { methodNotAllowed, successResponse, errorResponse, notFound, forbidden } from "@/lib/api/responses"
import { User, Credential } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

/**
 * Public API to get user profile and their credentials
 * Only accessible if profilePublic is true
 * Supports both userId (ObjectId) and email lookup
 */
async function handler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  if (req.method !== "GET") {
    return methodNotAllowed()
  }

  try {
    await connectDB()

    const params = context?.params instanceof Promise ? await context.params : context?.params
    const idOrEmail = params?.id

    if (!idOrEmail) {
      return errorResponse("User ID or email is required", 400)
    }

    let user

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = mongoose.Types.ObjectId.isValid(idOrEmail) && idOrEmail.length === 24
    
    if (isValidObjectId) {
      // Try to find by userId first
      user = await User.findById(idOrEmail)
        .select("name email image profilePublic description linkedin github twitter website createdAt")
        .lean()
    }

    // If not found by ID, try email lookup (decode URL encoding)
    if (!user) {
      // Try decoding the parameter first (it might be URL encoded)
      let decodedParam = idOrEmail
      try {
        decodedParam = decodeURIComponent(idOrEmail)
      } catch {
        // If decoding fails, use the original parameter
        decodedParam = idOrEmail
      }
      
      user = await User.findOne({ email: decodedParam.toLowerCase().trim() })
        .select("name email image profilePublic description linkedin github twitter website createdAt")
        .lean()
    }

    if (!user) {
      return notFound("User not found")
    }

    // Check if profile is public
    if (user.profilePublic === false) {
      return forbidden("Profile is private")
    }

    // Get user's active credentials
    const credentials = await Credential.find({
      recipientEmail: user.email,
      status: "active",
    })
      .populate("templateId", "name category")
      .populate("organizationId", "name")
      .sort({ issuedAt: -1 })
      .limit(50)
      .lean()

    // Format credentials
interface CredentialPopulated {
  _id: { toString: () => string }
  templateId?: { name?: string; category?: string } | { toString: () => string }
  organizationId?: { name?: string } | { toString: () => string }
  issuedAt: Date
  expiresAt?: Date
  type: string
  certificateUrl?: string
  badgeUrl?: string
  isOnBlockchain?: boolean
}

    const formattedCredentials = credentials.map((cred: CredentialPopulated) => {
      // Check if templateId is populated (has name property) or just an ObjectId
      const templateId = cred.templateId;
      const isTemplatePopulated = templateId && typeof templateId === "object" && "name" in templateId;
      const template = isTemplatePopulated ? (templateId as { name?: string; category?: string }) : null;

      // Check if organizationId is populated (has name property) or just an ObjectId
      const orgId = cred.organizationId;
      const isOrgPopulated = orgId && typeof orgId === "object" && "name" in orgId;
      const organization = isOrgPopulated ? (orgId as { name?: string }) : null;

      return {
        id: cred._id.toString(),
        title: template?.name || "Unknown Credential",
        issuer: organization?.name || "Unknown Organization",
        category: template?.category || "general",
        issuedAt: cred.issuedAt,
        expiresAt: cred.expiresAt || null,
        type: cred.type,
        certificateUrl: cred.certificateUrl || null,
        badgeUrl: cred.badgeUrl || null,
        isOnBlockchain: cred.isOnBlockchain || false,
      };
    })

    return successResponse({
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || null,
        description: user.description || null,
        linkedin: user.linkedin || null,
        github: user.github || null,
        twitter: user.twitter || null,
        website: user.website || null,
        createdAt: user.createdAt,
      },
      credentials: formattedCredentials,
      totalCredentials: formattedCredentials.length,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withDB(handler)

