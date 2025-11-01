import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { Credential } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"
import { vaultProtocol } from "@/lib/services/vault-protocol.service"
import { checkVaultHealth, getHealthErrorMessage } from "@/lib/services/vault-health.service"

// PUT - Verify blockchain credential
async function putHandler(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  try {
    await connectDB()

    // Get credential ID from URL params
    const params = await Promise.resolve(context?.params || {})
    const credentialId = params.id

    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID is required" }, { status: 400 })
    }

    // Verify it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(credentialId)) {
      return NextResponse.json({ error: "Invalid credential ID" }, { status: 400 })
    }

    const organizationIdStr = user?.organizationId as string | undefined
    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

    // Find credential
    const credential = await Credential.findOne({
      _id: credentialId,
      organizationId,
    })

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
        data: {
          id: credential._id.toString(),
          blockchainVerified: true,
          blockchainVerifiedAt: credential.blockchainVerifiedAt,
          vaultFid: credential.vaultFid,
          vaultCid: credential.vaultCid,
        },
      })
    }

    // Check VAULT Protocol health
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

    // Verify certificate with VAULT Protocol
    try {
      const verifyResponse = await vaultProtocol.verifyCertificate(
        credential.vaultFid,
        credential.recipientEmail
      )

      if (!verifyResponse.success || !verifyResponse.data.isValid) {
        return NextResponse.json(
          {
            error: "Blockchain verification failed",
            details: verifyResponse.message || "Certificate is not valid on blockchain",
          },
          { status: 400 }
        )
      }

      // Update credential with verification status
      credential.blockchainVerified = true
      credential.blockchainVerifiedAt = new Date()
      
      // Store issuer address from blockchain certificate
      if (verifyResponse.data.certificate.issuer) {
        credential.vaultIssuer = verifyResponse.data.certificate.issuer
      }
      
      await credential.save()

      return NextResponse.json({
        message: "Credential verified successfully on blockchain",
        data: {
          id: credential._id.toString(),
          blockchainVerified: true,
          blockchainVerifiedAt: credential.blockchainVerifiedAt,
          vaultFid: credential.vaultFid,
          vaultCid: credential.vaultCid,
          blockchainData: verifyResponse.data.certificate,
        },
      })
    } catch (vaultError) {
      console.error("VAULT Protocol verification error:", vaultError)
      return NextResponse.json(
        {
          error: "Failed to verify certificate with VAULT Protocol",
          details: vaultError instanceof Error ? vaultError.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export const PUT = withIssuer(putHandler)
