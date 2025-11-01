/**
 * Unified credential verification endpoint
 * - Public access: Verifies credential without authentication
 * - Authenticated access: Also verifies credential belongs to user
 */

import { NextRequest } from "next/server"
import { withDB, withAuth, handleApiError } from "@/lib/api/middleware"
import { methodNotAllowed, successResponse, errorResponse, notFound, forbidden } from "@/lib/api/responses"
import { Credential, Template, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"

async function verifyCredential(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return methodNotAllowed()
  }

  try {
    await connectDB()

    const params = context.params instanceof Promise ? await context.params : context.params
    const credentialId = params?.id

    if (!credentialId) {
      return errorResponse("Credential ID is required", 400)
    }

    // Find credential
    const credential = await Credential.findById(credentialId)
      .populate("templateId")
      .populate("organizationId", "name verificationStatus")
      .lean()

    if (!credential) {
      return notFound("Credential not found")
    }

    const cred = credential as any
    const organization = cred.organizationId as any

    // If authenticated, verify ownership (for recipient access)
    if (user) {
      const userId = user.id as string | undefined
      const userEmail = user.email as string | undefined

      // Only check ownership if user is recipient (not issuer/admin viewing their own issued credentials)
      // For now, we'll check if user is recipient
      const userRole = user.role as string | undefined
      if (userRole === "recipient") {
        const belongsToUser =
          (userId && cred.recipientId && cred.recipientId.toString() === userId) ||
          (userEmail && cred.recipientEmail?.toLowerCase() === userEmail.toLowerCase())

        if (!belongsToUser) {
          return forbidden("Credential does not belong to you")
        }
      }
    }

    // Verify credential based on blockchain status
    let verificationResult: {
      verified: boolean
      method: "blockchain" | "database"
      message: string
      details?: any
    }

    if (cred.isOnBlockchain) {
      // Blockchain verification (dummy implementation)
      // TODO: Replace with actual blockchain verification API call
      const blockchainVerified = cred.blockchainHash && cred.blockchainTxId

      verificationResult = {
        verified: blockchainVerified ? true : false,
        method: "blockchain",
        message: blockchainVerified
          ? "Credential verified on blockchain"
          : "Credential registered on blockchain but verification pending",
        details: {
          hash: cred.blockchainHash || null,
          transactionId: cred.blockchainTxId || null,
          network: cred.blockchainNetwork || null,
        },
      }
    } else {
      // Database verification
      const isActive = cred.status === "active"
      const isNotExpired = !cred.expiresAt || new Date(cred.expiresAt) > new Date()
      const orgVerified = organization?.verificationStatus === "approved"

      verificationResult = {
        verified: isActive && isNotExpired && orgVerified,
        method: "database",
        message: isActive && isNotExpired && orgVerified
          ? "Credential verified - Valid and active"
          : !isActive
            ? "Credential is not active"
            : !isNotExpired
              ? "Credential has expired"
              : !orgVerified
                ? "Issuing organization not verified"
                : "Credential verification failed",
        details: {
          status: cred.status,
          expiresAt: cred.expiresAt || null,
          organizationVerified: orgVerified,
          issuedAt: cred.issuedAt,
        },
      }
    }

    // Return credential details with verification result
    return successResponse({
      credential: {
        id: cred._id.toString(),
        title: (cred.templateId as any)?.name || "Unknown Credential",
        issuer: organization?.name || "Unknown Organization",
        recipientEmail: cred.recipientEmail,
        credentialData: cred.credentialData,
        type: cred.type,
        issuedAt: cred.issuedAt,
        expiresAt: cred.expiresAt || null,
        certificateUrl: cred.certificateUrl || null,
        badgeUrl: cred.badgeUrl || null,
      },
      verification: verificationResult,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

// Support both authenticated and unauthenticated access
// Check if Authorization header or cookies are present to determine auth
async function handler(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  // Check if user is authenticated by looking for session
  // This is a simplified approach - in production you might want to check cookies/headers
  // For now, we'll use withDB for all requests and check auth inside
  return withDB(async (req, ctx) => {
    // Try to get session, but don't fail if not present
    let user: Record<string, unknown> | undefined
    try {
      const { getServerSessionForApi } = await import("@/lib/auth-server")
      const session = await getServerSessionForApi()
      if (session?.user) {
        user = session.user as Record<string, unknown>
      }
    } catch {
      // No session, proceed as public
    }
    return verifyCredential(req, ctx, user)
  })(req, context)
}

export const GET = handler
