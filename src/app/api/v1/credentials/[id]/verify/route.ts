import { NextRequest, NextResponse } from "next/server"
import { withDB, handleApiError } from "@/lib/api/middleware"
import { Credential, Template, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"

/**
 * Public API to verify a credential
 * - If on blockchain: verify through blockchain (using dummy data for now)
 * - If not on blockchain: verify through database lookup
 * - No authentication required - publicly accessible
 */
async function handler(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const params = context.params instanceof Promise ? await context.params : context.params
    const credentialId = params?.id

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID is required" }, { status: 400 })
    }

    // Find credential
    const credential = await Credential.findById(credentialId)
      .populate("templateId")
      .populate("organizationId", "name verificationStatus")
      .lean()

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 })
    }

    const cred = credential as any
    const organization = cred.organizationId as any

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
    return NextResponse.json({
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

export const GET = withDB(handler)

