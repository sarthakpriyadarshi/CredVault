import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { parseBody, isValidEmail, getPagination, createPaginatedResponse } from "@/lib/api/utils"
import { Credential, Template, User, Organization } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"
import { generateCertificate, generateBadge } from "@/lib/certificate"
import { vaultProtocol, VaultProtocolService } from "@/lib/services/vault-protocol.service"
import { checkVaultHealth, getHealthErrorMessage } from "@/lib/services/vault-health.service"
import { sendEmail } from "@/lib/email/nodemailer"
import { generateCredentialIssuedEmail } from "@/lib/email/templates"
import { createNotification } from "@/lib/notifications"

// GET - List credentials for issuer's organization
async function getHandler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  try {
    await connectDB()

    const organizationIdStr = user?.organizationId as string | undefined
    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

    // Get filter from query params
    const { getQueryParams } = await import("@/lib/api/utils")
    const searchParams = getQueryParams(req)
    const filter = searchParams.get("filter") // "all", "active", "revoked", "expired"
    const search = searchParams.get("search") || ""

    // Build query
    const query: {
      organizationId: mongoose.Types.ObjectId
      status?: "active" | "revoked" | "expired"
      $or?: Array<{ recipientEmail?: RegExp; "templateId.name"?: RegExp }>
    } = { organizationId }
    
    if (filter === "active") {
      query.status = "active"
    } else if (filter === "revoked") {
      query.status = "revoked"
    } else if (filter === "expired") {
      query.status = "expired"
    }

    // Search by recipient email or template name
    if (search) {
      const searchRegex = new RegExp(search, "i")
      query.$or = [
        { recipientEmail: searchRegex },
        { "templateId.name": searchRegex },
      ]
    }

    const pagination = getPagination(req, 10) // Limit to 10 per page for better performance

    // Get credentials with populated template
    // Use indexed sorting to avoid disk usage - ensure issuedAt field is indexed
    const [credentials, total] = await Promise.all([
      Credential.find(query)
        .populate("templateId", "name category")
        .sort({ issuedAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Credential.countDocuments(query),
    ])

    interface CredentialDoc {
      _id: { toString: () => string }
      templateId?: { name?: string; category?: string } | null
      recipientEmail: string
      credentialData?: { Name?: string; name?: string }
      type: "certificate" | "badge" | "both"
      status: "active" | "expired" | "revoked"
      isOnBlockchain: boolean
      blockchainVerified?: boolean
      blockchainVerifiedAt?: Date
      vaultFid?: string
      vaultCid?: string
      issuedAt: Date
      expiresAt?: Date
      revokedAt?: Date
      certificateUrl?: string
      badgeUrl?: string
    }

    const formattedCredentials = (credentials as CredentialDoc[]).map((cred) => {
      const template = cred.templateId
      return {
        id: cred._id.toString(),
        templateName: template?.name || "Unknown Template",
        templateCategory: template?.category || "general",
        recipientEmail: cred.recipientEmail,
        recipientName: cred.credentialData?.Name || cred.credentialData?.name || "Unknown",
        type: cred.type,
        status: cred.status,
        isOnBlockchain: cred.isOnBlockchain || false,
        blockchainVerified: cred.blockchainVerified || false,
        blockchainVerifiedAt: cred.blockchainVerifiedAt,
        vaultFid: cred.vaultFid,
        vaultCid: cred.vaultCid,
        issuedAt: cred.issuedAt,
        expiresAt: cred.expiresAt,
        revokedAt: cred.revokedAt,
        certificateUrl: cred.certificateUrl,
        badgeUrl: cred.badgeUrl,
        credentialData: cred.credentialData,
      }
    })

    const response = createPaginatedResponse(formattedCredentials, total, pagination)
    return NextResponse.json(response)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

// POST - Issue single credential
async function postHandler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    await connectDB()

    const organizationIdStr = user?.organizationId as string | undefined
    if (!organizationIdStr) {
      return NextResponse.json({ error: "Organization ID not found" }, { status: 400 })
    }

    const organizationId = new mongoose.Types.ObjectId(organizationIdStr)

    const body = await parseBody<{
      templateId: string
      data: Record<string, string>
      useBlockchain?: boolean
    }>(req)

    const { templateId, data, useBlockchain } = body

    if (!templateId || !data) {
      return NextResponse.json({ error: "Template ID and data are required" }, { status: 400 })
    }

    // Check VAULT Protocol health if blockchain is requested
    if (useBlockchain) {
      const healthStatus = await checkVaultHealth()
      if (!healthStatus.isHealthy) {
        const errorMessage = getHealthErrorMessage(healthStatus)
        return NextResponse.json(
          { 
            error: "VAULT Protocol services are not available",
            details: errorMessage,
            vaultHealthStatus: healthStatus
          },
          { status: 503 } // Service Unavailable
        )
      }
    }

    // Find template
    const template = await Template.findOne({
      _id: templateId,
      organizationId,
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Find email field
    const emailField = template.placeholders.find((p) => p.type === "email")
    if (!emailField) {
      return NextResponse.json({ error: "Template must have an email field" }, { status: 400 })
    }

    const recipientEmail = data[emailField.fieldName]?.toLowerCase().trim()
    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Check if recipient user exists
    let recipientId = undefined
    const recipientUser = await User.findOne({ email: recipientEmail })
    if (recipientUser) {
      recipientId = recipientUser._id
    }

    // Check if template has QR code placeholder
    const hasQRCodePlaceholder = template.placeholders.some((p) => p.type === "qr" && p.x !== undefined && p.y !== undefined)
    
    // Generate certificate/badge images if template has them
    let certificateUrl: string | undefined = undefined
    let badgeUrl: string | undefined = undefined
    let vaultFid: string | undefined = undefined
    let vaultCid: string | undefined = undefined
    let vaultUrl: string | undefined = undefined
    let vaultGatewayUrl: string | undefined = undefined
    let blockchainTxId: string | undefined = undefined
    let credentialIdForQR: mongoose.Types.ObjectId | undefined = undefined

    // If QR code is present, we need to create credential first, then generate QR code, then update credential
    if (hasQRCodePlaceholder) {
      try {
        // Step 1: Create credential document first (without certificate image)
        const tempCredential = await Credential.create({
          templateId: template._id,
          organizationId,
          recipientEmail,
          recipientId,
          credentialData: data,
          type: template.type,
          isOnBlockchain: useBlockchain || false,
          status: "active",
          issuedAt: new Date(),
        })
        
        credentialIdForQR = new mongoose.Types.ObjectId(tempCredential._id.toString())
        
        // Step 2: Generate verification URL
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:4300"
        const verificationUrl = `${baseUrl}/verify/${credentialIdForQR.toString()}`
        
        // Step 3: Prepare QR code data for certificate generation
        const qrCodeData: Record<string, string> = {}
        const qrPlaceholders = template.placeholders.filter((p) => p.type === "qr")
        for (const qrPlaceholder of qrPlaceholders) {
          qrCodeData[qrPlaceholder.fieldName] = verificationUrl
        }
        
        // Step 4: Generate certificate with QR code
        if ((template.type === "certificate" || template.type === "both") && template.certificateImage) {
          const displayedPlaceholders = template.placeholders.filter(
            (p) => p.x !== undefined && p.y !== undefined
          )

          if (displayedPlaceholders.length > 0) {
            certificateUrl = await generateCertificate({
              templateImageBase64: template.certificateImage,
              placeholders: displayedPlaceholders,
              data,
              qrCodeData,
            })
          }
        }
        
        // Step 5: Generate badge with QR code if needed
        if ((template.type === "badge" || template.type === "both") && template.badgeImage) {
          const displayedPlaceholders = template.placeholders.filter(
            (p) => p.x !== undefined && p.y !== undefined
          )

          if (displayedPlaceholders.length > 0) {
            badgeUrl = await generateBadge({
              templateImageBase64: template.badgeImage,
              placeholders: displayedPlaceholders,
              data,
              qrCodeData,
            })
          }
        }
        
        // Step 6: Handle blockchain if enabled
        if (useBlockchain && certificateUrl) {
          try {
            const buffer = VaultProtocolService.base64ToBuffer(certificateUrl)
            const extension = VaultProtocolService.getFileExtension(certificateUrl)
            const fileName = `certificate_${recipientEmail}_${Date.now()}${extension}`

            const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, recipientEmail)
            
            if (vaultResponse.success) {
              vaultFid = vaultResponse.data.fid
              vaultCid = vaultResponse.data.cid
              vaultUrl = vaultResponse.data.vaultUrl
              vaultGatewayUrl = vaultResponse.data.gatewayUrl
              blockchainTxId = vaultResponse.data.transactionHash
            }
          } catch (vaultError) {
            console.error("VAULT Protocol error:", vaultError)
            // Continue without VAULT Protocol if it fails
          }
        } else if (useBlockchain && badgeUrl && !vaultFid) {
          try {
            const buffer = VaultProtocolService.base64ToBuffer(badgeUrl)
            const extension = VaultProtocolService.getFileExtension(badgeUrl)
            const fileName = `badge_${recipientEmail}_${Date.now()}${extension}`

            const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, recipientEmail)
            
            if (vaultResponse.success) {
              vaultFid = vaultResponse.data.fid
              vaultCid = vaultResponse.data.cid
              vaultUrl = vaultResponse.data.vaultUrl
              vaultGatewayUrl = vaultResponse.data.gatewayUrl
              blockchainTxId = vaultResponse.data.transactionHash
            }
          } catch (vaultError) {
            console.error("VAULT Protocol error:", vaultError)
          }
        }
        
        // Step 7: Update credential with certificate/badge and blockchain data
        tempCredential.certificateUrl = certificateUrl
        tempCredential.badgeUrl = badgeUrl
        tempCredential.vaultFid = vaultFid
        tempCredential.vaultCid = vaultCid
        tempCredential.vaultUrl = vaultUrl
        tempCredential.vaultGatewayUrl = vaultGatewayUrl
        tempCredential.blockchainTxId = blockchainTxId
        tempCredential.blockchainNetwork = useBlockchain ? "VAULT Protocol / Quorum" : undefined
        await tempCredential.save()
        
        // Success - credential is now complete
        // Continue with notification email below
      } catch (error) {
        // Rollback: Delete credential if any step failed
        if (credentialIdForQR) {
          try {
            await Credential.findByIdAndDelete(credentialIdForQR)
            console.log("Rolled back credential creation due to error:", error)
          } catch (deleteError) {
            console.error("Failed to delete credential during rollback:", deleteError)
          }
        }
        console.error("Error in QR code credential issuance:", error)
        return NextResponse.json(
          { error: `Failed to issue credential with QR code: ${error instanceof Error ? error.message : "Unknown error"}` },
          { status: 500 }
        )
      }
    } else {
      // Normal flow without QR code
      try {
        // Generate certificate if template type is "certificate" or "both"
        if ((template.type === "certificate" || template.type === "both") && template.certificateImage) {
          // Only generate for placeholders that have coordinates (displayed on certificate)
          const displayedPlaceholders = template.placeholders.filter(
            (p) => p.x !== undefined && p.y !== undefined
          )

          if (displayedPlaceholders.length > 0) {
            certificateUrl = await generateCertificate({
              templateImageBase64: template.certificateImage,
              placeholders: displayedPlaceholders,
              data,
            })

            // If blockchain is enabled, upload certificate to VAULT Protocol
            if (useBlockchain && certificateUrl) {
              try {
                const buffer = VaultProtocolService.base64ToBuffer(certificateUrl)
                const extension = VaultProtocolService.getFileExtension(certificateUrl)
                const fileName = `certificate_${recipientEmail}_${Date.now()}${extension}`

                const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, recipientEmail)
                
                console.log("VAULT Protocol Response (Certificate):", JSON.stringify(vaultResponse, null, 2))
                
                if (vaultResponse.success) {
                  vaultFid = vaultResponse.data.fid
                  vaultCid = vaultResponse.data.cid
                  vaultUrl = vaultResponse.data.vaultUrl
                  vaultGatewayUrl = vaultResponse.data.gatewayUrl
                  blockchainTxId = vaultResponse.data.transactionHash
                  
                  console.log("Assigned VAULT values (Certificate):", { vaultFid, vaultCid, vaultUrl, blockchainTxId })
                  // Note: vaultIssuer is retrieved later via getCertificate or verifyCertificate
                }
              } catch (vaultError) {
                console.error("VAULT Protocol error:", vaultError)
                // Continue without VAULT Protocol if it fails
              }
            }
          }
        }

        // Generate badge if template type is "badge" or "both"
        if ((template.type === "badge" || template.type === "both") && template.badgeImage) {
          // Only generate for placeholders that have coordinates (displayed on badge)
          const displayedPlaceholders = template.placeholders.filter(
            (p) => p.x !== undefined && p.y !== undefined
          )

          if (displayedPlaceholders.length > 0) {
            badgeUrl = await generateBadge({
              templateImageBase64: template.badgeImage,
              placeholders: displayedPlaceholders,
              data,
            })

            // If blockchain is enabled and certificate wasn't uploaded, upload badge to VAULT Protocol
            if (useBlockchain && badgeUrl && !vaultFid) {
              try {
                const buffer = VaultProtocolService.base64ToBuffer(badgeUrl)
                const extension = VaultProtocolService.getFileExtension(badgeUrl)
                const fileName = `badge_${recipientEmail}_${Date.now()}${extension}`

                const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, recipientEmail)
                
                console.log("VAULT Protocol Response (Badge):", JSON.stringify(vaultResponse, null, 2))
                
                if (vaultResponse.success) {
                  vaultFid = vaultResponse.data.fid
                  vaultCid = vaultResponse.data.cid
                  vaultUrl = vaultResponse.data.vaultUrl
                  vaultGatewayUrl = vaultResponse.data.gatewayUrl
                  blockchainTxId = vaultResponse.data.transactionHash
                  
                  console.log("Assigned VAULT values (Badge):", { vaultFid, vaultCid, vaultUrl, blockchainTxId })
                  // Note: vaultIssuer is retrieved later via getCertificate or verifyCertificate
                }
              } catch (vaultError) {
                console.error("VAULT Protocol error:", vaultError)
                // Continue without VAULT Protocol if it fails
              }
            }
          }
        }
      } catch (error) {
        console.error("Error generating certificate/badge images:", error)
        // Continue with credential creation even if image generation fails
        // The credential will still be created but without certificateUrl/badgeUrl
      }

      // Log values before creating credential
      console.log("Creating credential with VAULT values:", {
        vaultFid,
        vaultCid,
        vaultUrl,
        vaultGatewayUrl,
        blockchainTxId,
        isOnBlockchain: useBlockchain || false,
      })

      // Create credential
      const credential = await Credential.create({
        templateId: template._id,
        organizationId,
        recipientEmail,
        recipientId,
        credentialData: data,
        type: template.type,
        certificateUrl,
        badgeUrl,
        isOnBlockchain: useBlockchain || false,
        blockchainTxId,
        vaultFid,
        vaultCid,
        vaultUrl,
        vaultGatewayUrl,
        // vaultIssuer will be set later when certificate is verified
        blockchainNetwork: useBlockchain ? "VAULT Protocol / Quorum" : undefined,
        status: "active",
        issuedAt: new Date(),
      })

      // Log what was actually saved to MongoDB
      console.log("Credential saved to MongoDB:", {
        id: credential._id.toString(),
        vaultFid: credential.vaultFid,
        vaultCid: credential.vaultCid,
        vaultUrl: credential.vaultUrl,
        blockchainTxId: credential.blockchainTxId,
        isOnBlockchain: credential.isOnBlockchain,
      })
    }

    // If QR code was handled above, get the credential
    let credential
    if (hasQRCodePlaceholder && credentialIdForQR) {
      credential = await Credential.findById(credentialIdForQR)
      if (!credential) {
        return NextResponse.json({ error: "Failed to retrieve created credential" }, { status: 500 })
      }
    } else {
      // Credential was created in the else block above
      // Find the most recently created credential for this recipient and template
      credential = await Credential.findOne({
        templateId: template._id,
        organizationId,
        recipientEmail,
      }).sort({ issuedAt: -1 })
      
      if (!credential) {
        return NextResponse.json({ error: "Failed to retrieve created credential" }, { status: 500 })
      }
    }

    // Send notification email to recipient
    try {
      const recipientName = data.Name || data.name || "Recipient"
      
      // Fetch organization for email
      const organization = await Organization.findById(organizationId)
      const issuerOrganization = organization?.name || "Unknown Organization"
      
      const emailHtml = generateCredentialIssuedEmail({
        recipientName,
        credentialName: template.name || (template.type === "certificate" ? "Certificate" : template.type === "badge" ? "Badge" : "Credential"),
        issuerName: user?.name as string || "Unknown Issuer",
        issuerOrganization,
        issuedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        credentialId: credential._id.toString(),
        viewCredentialLink: `${process.env.NEXTAUTH_URL}/verify/${credential._id.toString()}`,
        blockchainVerified: credential.isOnBlockchain || false,
      })

      await sendEmail({
        to: recipientEmail,
        subject: `New ${template.type === "certificate" ? "Certificate" : template.type === "badge" ? "Badge" : "Credential"} Issued - CredVault`,
        html: emailHtml,
      })

      // Create notification for recipient if they exist
      const recipientUser = await User.findOne({ email: recipientEmail.toLowerCase() })
      if (recipientUser) {
        await createNotification({
          userId: recipientUser._id,
          type: "credential_issued",
          title: "New Credential Issued",
          message: `You have been issued a new ${template.name || "credential"} by ${issuerOrganization}.`,
          link: `/verify/${credential._id.toString()}`,
        })
      }
    } catch (emailError) {
      console.error("Failed to send credential notification email:", emailError)
      // Don't fail credential issuance if email fails
    }

    return NextResponse.json(
      {
        message: "Credential issued successfully",
        credential: {
          id: credential._id.toString(),
          recipientEmail: credential.recipientEmail,
          issuedAt: credential.issuedAt,
          certificateUrl: credential.certificateUrl,
          badgeUrl: credential.badgeUrl,
          isOnBlockchain: credential.isOnBlockchain,
          vaultFid: credential.vaultFid,
          vaultCid: credential.vaultCid,
          vaultUrl: credential.vaultUrl,
          vaultGatewayUrl: credential.vaultGatewayUrl,
          blockchainTxId: credential.blockchainTxId,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function GET(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  try {
    const handler = withIssuer(getHandler)
    return await handler(req, context)
  } catch (error) {
    console.error("GET handler error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  try {
    const handler = withIssuer(postHandler)
    return await handler(req, context)
  } catch (error) {
    console.error("POST handler error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
