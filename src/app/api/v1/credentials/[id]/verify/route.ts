/**
 * Unified credential verification endpoint
 * - Public access: Verifies credential without authentication
 * - Authenticated access: Also verifies credential belongs to user
 */

import { NextRequest, NextResponse } from "next/server"
import { withDB, handleApiError } from "@/lib/api/middleware"
import { methodNotAllowed, successResponse, errorResponse, notFound, forbidden } from "@/lib/api/responses"
import { Credential, Template, User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import { createNotification } from "@/lib/notifications"

interface OrganizationPopulated {
  _id: { toString: () => string }
  name: string
  verificationStatus: string
}

interface TemplatePopulated {
  _id: { toString: () => string }
  name: string
}

interface CredentialPopulated {
  _id: { toString: () => string }
  templateId: TemplatePopulated | { toString: () => string }
  organizationId: OrganizationPopulated | { toString: () => string }
  recipientId?: { toString: () => string }
  recipientEmail?: string
  isOnBlockchain: boolean
  vaultFid?: string
  vaultCid?: string
  vaultUrl?: string
  blockchainTxId?: string
  blockchainNetwork?: string
  blockchainVerified?: boolean
  blockchainVerifiedAt?: Date
  vaultIssuer?: string
  status: string
  expiresAt?: Date
  issuedAt: Date
  credentialData: Record<string, unknown>
  type: string
  certificateUrl?: string
  badgeUrl?: string
}

interface VerificationDetails {
  vaultFid?: string | null
  vaultCid?: string | null
  vaultUrl?: string | null
  transactionId?: string | null
  network?: string
  blockchainVerified?: boolean
  blockchainVerifiedAt?: Date | null
  vaultIssuer?: string | null
  status?: string
  expiresAt?: Date | null
  organizationVerified?: boolean
  issuedAt?: Date
}

async function verifyCredential(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return methodNotAllowed()
  }

  try {
    await connectDB()

    const params = context?.params instanceof Promise ? await context.params : context?.params
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

    const cred = credential as CredentialPopulated
    const organization = cred.organizationId as OrganizationPopulated

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
      details?: VerificationDetails
    }

    if (cred.isOnBlockchain) {
      // Blockchain verification with VAULT Protocol fields
      const blockchainVerified = cred.vaultFid && cred.vaultCid && cred.blockchainVerified

      verificationResult = {
        verified: blockchainVerified ? true : false,
        method: "blockchain",
        message: blockchainVerified
          ? "Credential verified on blockchain"
          : cred.vaultFid
          ? "Credential registered on blockchain but not yet verified"
          : "Credential registered on blockchain but verification pending",
        details: {
          vaultFid: cred.vaultFid || null,
          vaultCid: cred.vaultCid || null,
          vaultUrl: cred.vaultUrl || null,
          transactionId: cred.blockchainTxId || null,
          network: cred.blockchainNetwork || "VAULT Protocol / Quorum",
          blockchainVerified: cred.blockchainVerified || false,
          blockchainVerifiedAt: cred.blockchainVerifiedAt || null,
          vaultIssuer: cred.vaultIssuer || null,
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

    // Notify issuer if credential was verified (only for successful verifications)
    if (verificationResult.verified && cred.organizationId) {
      try {
        // Find issuer users for this organization
        const issuers = await User.find({
          organizationId: cred.organizationId,
          role: "issuer",
        }).select("_id")

        const template = cred.templateId as TemplatePopulated
        const credentialName = template?.name || "Credential"

        // Create notification for each issuer
        for (const issuer of issuers) {
          await createNotification({
            userId: issuer._id,
            type: "credential_verified",
            title: "Credential Verified",
            message: `Your ${credentialName} credential has been verified by ${cred.recipientEmail || "a recipient"}.`,
            link: `/dashboard/issuer/credentials`,
          })
        }
      } catch (error) {
        console.error("Error creating verification notification:", error)
        // Don't fail verification if notification fails
      }
    }

    // Return credential details with verification result
    return successResponse({
      credential: {
        id: cred._id.toString(),
        title: (cred.templateId as TemplatePopulated)?.name || "Unknown Credential",
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
  context?: { params?: Promise<Record<string, string>> | Record<string, string> }
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
    // Pass the context from withDB which is guaranteed to exist
    return verifyCredential(req, ctx, user)
  })(req, context)
}

export const GET = handler

// POST - Trigger blockchain verification (public endpoint)
async function postHandler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  return withDB(async () => {
    try {
      const params = await Promise.resolve(context?.params || {})
      const credentialId = params.id

      if (!credentialId) {
        return NextResponse.json({ error: "Credential ID is required" }, { status: 400 })
      }

      // Verify it's a valid MongoDB ObjectId
      const mongoose = await import("mongoose")
      if (!mongoose.Types.ObjectId.isValid(credentialId)) {
        return NextResponse.json({ error: "Invalid credential ID" }, { status: 400 })
      }

      // Find credential
      const credential = await Credential.findById(credentialId)
        .populate("organizationId", "name")
        .populate("templateId", "name")

      if (!credential) {
        return NextResponse.json({ error: "Credential not found" }, { status: 404 })
      }

      // Check if credential is on blockchain
      if (!credential.isOnBlockchain || !credential.vaultFid) {
        return NextResponse.json(
          { error: "Credential is not registered on blockchain" },
          { status: 400 }
        )
      }

      // Check if already verified
      if (credential.blockchainVerified) {
        return NextResponse.json({
          message: "Credential is already verified",
          verified: true,
          blockchainVerified: true,
          blockchainVerifiedAt: credential.blockchainVerifiedAt,
          vaultFid: credential.vaultFid,
          vaultCid: credential.vaultCid,
        })
      }

      // Check VAULT Protocol health
      const { checkVaultHealth, getHealthErrorMessage } = await import("@/lib/services/vault-health.service")
      const healthStatus = await checkVaultHealth()
      if (!healthStatus.isHealthy) {
        const errorMessage = getHealthErrorMessage(healthStatus)
        return NextResponse.json(
          {
            error: "VAULT Protocol services are not available",
            details: errorMessage,
            vaultHealthStatus: healthStatus,
          },
          { status: 503 }
        )
      }

      // Verify on blockchain using VAULT Protocol
      const { vaultProtocol } = await import("@/lib/services/vault-protocol.service")
      const verifyResult = await vaultProtocol.verifyCertificate(credential.vaultFid, credential.recipientEmail)

      if (!verifyResult.success) {
        interface VerifyResultError {
          error?: string
        }
        const errorResult = verifyResult as VerifyResultError
        return NextResponse.json(
          { error: errorResult.error || "Failed to verify on blockchain" },
          { status: 500 }
        )
      }

      // Update credential with verification info
      credential.blockchainVerified = true
      credential.blockchainVerifiedAt = new Date()
      
      // Store issuer address from blockchain certificate
      if (verifyResult.data?.certificate?.issuer) {
        credential.vaultIssuer = verifyResult.data.certificate.issuer
      }
      
      await credential.save()

      // Notify issuer about verification
      if (credential.organizationId) {
        try {
          const issuers = await User.find({
            organizationId: credential.organizationId,
            role: "issuer",
          }).select("_id")

          const template = await Template.findById(credential.templateId).select("name")
          const credentialName = template?.name || "Credential"

          for (const issuer of issuers) {
            await createNotification({
              userId: issuer._id,
              type: "credential_verified",
              title: "Credential Verified",
              message: `Your ${credentialName} credential has been verified by ${credential.recipientEmail || "a recipient"}.`,
              link: `/dashboard/issuer/credentials`,
            })
          }
        } catch (error) {
          console.error("Error creating verification notification:", error)
        }
      }

      return NextResponse.json({
        message: "Credential verified on blockchain successfully",
        verified: true,
        blockchainVerified: true,
        blockchainVerifiedAt: credential.blockchainVerifiedAt,
        vaultFid: credential.vaultFid,
        vaultCid: credential.vaultCid,
        vaultIssuer: credential.vaultIssuer,
        data: verifyResult.data,
      })
    } catch (error) {
      return handleApiError(error)
    }
  })(req, context)
}

export const POST = postHandler
