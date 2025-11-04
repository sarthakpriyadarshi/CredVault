import { NextRequest, NextResponse } from "next/server"
import { withIssuer, handleApiError } from "@/lib/api/middleware"
import { isValidEmail } from "@/lib/api/utils"
import { Credential, Template, User } from "@/models"
import connectDB from "@/lib/db/mongodb"
import mongoose from "mongoose"
import { generateCertificate, generateBadge } from "@/lib/certificate"
import { vaultProtocol, VaultProtocolService } from "@/lib/services/vault-protocol.service"
import { checkVaultHealth, getHealthErrorMessage } from "@/lib/services/vault-health.service"
import { sendEmail } from "@/lib/email/nodemailer"
import { generateCredentialIssuedEmail } from "@/lib/email/templates"

async function handler(
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

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const templateId = formData.get("templateId") as string | null
    const useBlockchain = formData.get("useBlockchain") === "true"

    if (!file || !templateId) {
      return NextResponse.json({ error: "File and template ID are required" }, { status: 400 })
    }

    // Find template
    const template = await Template.findOne({
      _id: templateId,
      organizationId,
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
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

    // Parse CSV
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have header and at least one data row" }, { status: 400 })
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    
    // Find email field from template
    const emailField = template.placeholders.find((p) => p.type === "email")
    if (!emailField) {
      return NextResponse.json({ error: "Template must have an email field" }, { status: 400 })
    }

    // Find Name, Issue Date, and QR Code fields from template
    const nameField = template.placeholders.find((p) => p.fieldName.toLowerCase().trim() === "name")
    const issueDateField = template.placeholders.find(
      (p) => p.fieldName.toLowerCase().trim() === "issue date" && p.type === "date"
    )
    const qrCodeField = template.placeholders.find((p) => p.type === "qr")

    // Map CSV headers to template field names
    // Try to match CSV headers with template field names (case-insensitive, flexible matching)
    const fieldMapping: Record<string, string> = {}
    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().trim()
      // Find matching template field
      const matchedField = template.placeholders.find((p) => {
        const fieldName = p.fieldName.toLowerCase()
        return (
          fieldName === normalizedHeader ||
          fieldName.includes(normalizedHeader) ||
          normalizedHeader.includes(fieldName)
        )
      })
      if (matchedField) {
        fieldMapping[header] = matchedField.fieldName
      }
    })

    // Ensure email field is mapped
    const emailHeader = headers.find((h) => {
      const normalizedHeader = h.toLowerCase().trim()
      const emailFieldName = emailField.fieldName.toLowerCase()
      return (
        normalizedHeader.includes("email") ||
        emailFieldName.includes(normalizedHeader) ||
        normalizedHeader.includes(emailFieldName)
      )
    })
    if (!emailHeader) {
      return NextResponse.json({ error: "CSV must contain an email column matching the template email field" }, { status: 400 })
    }
    fieldMapping[emailHeader] = emailField.fieldName

    const records: Array<{
      recipientName: string
      email: string
      status: "pending" | "success" | "error"
      message?: string
    }> = []

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      // Fetch organization name for email
      let organizationName = "Unknown Organization";
      try {
        const org = await (await import("@/models")).Organization.findById(organizationId);
        if (org && org.name) organizationName = org.name;
      } catch {
        // Ignore error, fallback to default
      }
      const values = lines[i].split(",").map((v) => v.trim())
      const emailValue = values[headers.indexOf(emailHeader)]?.toLowerCase().trim()
      const recipientName = values[0] || "Unknown"

      if (!emailValue || !isValidEmail(emailValue)) {
        records.push({
          recipientName,
          email: emailValue || "N/A",
          status: "error",
          message: "Invalid email format",
        })
        continue
      }

      try {
        // Find recipient user
        let recipientId = undefined
        const recipientUser = await User.findOne({ email: emailValue })
        if (recipientUser) {
          recipientId = recipientUser._id
        }

        // Create credential data by mapping CSV values to template field names
        const credentialData: Record<string, string> = {}
        headers.forEach((header, idx) => {
          const templateFieldName = fieldMapping[header]
          if (templateFieldName && values[idx]) {
            credentialData[templateFieldName] = values[idx]
          }
        })
        
        // Ensure email is set correctly
        credentialData[emailField.fieldName] = emailValue

        // Validate Name field (required)
        if (nameField && (!credentialData[nameField.fieldName] || !credentialData[nameField.fieldName].trim())) {
          records.push({
            recipientName: values[0] || "Unknown",
            email: emailValue || "N/A",
            status: "error",
            message: "Name field is required",
          })
          continue
        }

        // Auto-fill Issue Date if field exists (required, auto-filled with current date)
        if (issueDateField) {
          const today = new Date()
          const day = String(today.getDate()).padStart(2, '0')
          const month = String(today.getMonth() + 1).padStart(2, '0')
          const year = today.getFullYear()
          const todayFormatted = `${day}-${month}-${year}` // DD-MM-YYYY format
          credentialData[issueDateField.fieldName] = todayFormatted
        }

        // Check if template has QR code placeholder
        const hasQRCodePlaceholder = qrCodeField && qrCodeField.x !== undefined && qrCodeField.y !== undefined

        // Generate certificate/badge images if template has them
        let certificateUrl: string | undefined = undefined
        let badgeUrl: string | undefined = undefined
        let tempCredentialId: mongoose.Types.ObjectId | undefined = undefined
        let vaultFid: string | undefined = undefined
        let vaultCid: string | undefined = undefined
        let vaultUrl: string | undefined = undefined
        let vaultGatewayUrl: string | undefined = undefined
        let blockchainTxId: string | undefined = undefined

        // If QR code is present, we need to create credential first, then generate QR code, then update credential
        if (hasQRCodePlaceholder) {
          try {
            // Step 1: Create credential document first (without certificate image)
            const tempCredential = await Credential.create({
              templateId: template._id,
              organizationId,
              recipientEmail: emailValue,
              recipientId,
              credentialData,
              type: template.type,
              isOnBlockchain: useBlockchain || false,
              status: "active",
              issuedAt: new Date(),
            })
            
            tempCredentialId = new mongoose.Types.ObjectId(tempCredential._id.toString())
            
            // Step 2: Generate verification URL
            const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:4300"
            const verificationUrl = `${baseUrl}/verify/${tempCredentialId.toString()}`
            
            // Step 3: Prepare QR code data for certificate generation
            const qrCodeData: Record<string, string> = {}
            qrCodeData[qrCodeField.fieldName] = verificationUrl
            
            // Step 4: Generate certificate with QR code
            if ((template.type === "certificate" || template.type === "both") && template.certificateImage) {
              const displayedPlaceholders = template.placeholders.filter(
                (p) => p.x !== undefined && p.y !== undefined
              )

              if (displayedPlaceholders.length > 0) {
                certificateUrl = await generateCertificate({
                  templateImageBase64: template.certificateImage,
                  placeholders: displayedPlaceholders,
                  data: credentialData,
                  qrCodeData,
                })

                // If blockchain is enabled, upload certificate to VAULT Protocol
                if (useBlockchain && certificateUrl) {
                  try {
                    const buffer = VaultProtocolService.base64ToBuffer(certificateUrl)
                    const extension = VaultProtocolService.getFileExtension(certificateUrl)
                    const fileName = `certificate_${emailValue}_${Date.now()}${extension}`

                    const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, emailValue)
                    
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
                }
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
                  data: credentialData,
                  qrCodeData,
                })

                // If blockchain is enabled and no certificate was uploaded, upload badge to VAULT Protocol
                if (useBlockchain && badgeUrl && !vaultFid) {
                  try {
                    const buffer = VaultProtocolService.base64ToBuffer(badgeUrl)
                    const extension = VaultProtocolService.getFileExtension(badgeUrl)
                    const fileName = `badge_${emailValue}_${Date.now()}${extension}`

                    const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, emailValue)
                    
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
                }
              }
            }
            
            // Step 6: Update the credential with certificate/badge URLs and blockchain data
            await Credential.findByIdAndUpdate(tempCredentialId, {
              certificateUrl,
              badgeUrl,
              vaultFid,
              vaultCid,
              vaultUrl,
              vaultGatewayUrl,
              blockchainTxId,
              blockchainNetwork: useBlockchain ? "VAULT Protocol / Quorum" : undefined,
            })
          } catch (error) {
            console.error(`Error generating certificate/badge with QR code for ${emailValue}:`, error)
            // If QR code generation fails, delete the temporary credential
            if (tempCredentialId) {
              await Credential.findByIdAndDelete(tempCredentialId).catch(() => {
                // Ignore deletion errors
              })
            }
            throw error
          }
        } else {
          // No QR code - normal flow
          try {
            // Generate certificate if template type is "certificate" or "both"
            if ((template.type === "certificate" || template.type === "both") && template.certificateImage) {
              const displayedPlaceholders = template.placeholders.filter(
                (p) => p.x !== undefined && p.y !== undefined
              )

              if (displayedPlaceholders.length > 0) {
                certificateUrl = await generateCertificate({
                  templateImageBase64: template.certificateImage,
                  placeholders: displayedPlaceholders,
                  data: credentialData,
                })

                // If blockchain is enabled, upload certificate to VAULT Protocol
                if (useBlockchain && certificateUrl) {
                  try {
                    const buffer = VaultProtocolService.base64ToBuffer(certificateUrl)
                    const extension = VaultProtocolService.getFileExtension(certificateUrl)
                    const fileName = `certificate_${emailValue}_${Date.now()}${extension}`

                    const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, emailValue)
                    
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
                }
              }
            }

            // Generate badge if template type is "badge" or "both"
            if ((template.type === "badge" || template.type === "both") && template.badgeImage) {
              const displayedPlaceholders = template.placeholders.filter(
                (p) => p.x !== undefined && p.y !== undefined
              )

              if (displayedPlaceholders.length > 0) {
                badgeUrl = await generateBadge({
                  templateImageBase64: template.badgeImage,
                  placeholders: displayedPlaceholders,
                  data: credentialData,
                })

                // If blockchain is enabled and no certificate was uploaded, upload badge to VAULT Protocol
                if (useBlockchain && badgeUrl && !vaultFid) {
                  try {
                    const buffer = VaultProtocolService.base64ToBuffer(badgeUrl)
                    const extension = VaultProtocolService.getFileExtension(badgeUrl)
                    const fileName = `badge_${emailValue}_${Date.now()}${extension}`

                    const vaultResponse = await vaultProtocol.issueCertificate(buffer, fileName, emailValue)
                    
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
                }
              }
            }
          } catch (error) {
            console.error(`Error generating certificate/badge for ${emailValue}:`, error)
            // Continue with credential creation even if image generation fails
          }

          // Create credential normally (no QR code)
          await Credential.create({
            templateId: template._id,
            organizationId,
            recipientEmail: emailValue,
            recipientId,
            credentialData,
            type: template.type,
            certificateUrl,
            badgeUrl,
            vaultFid,
            vaultCid,
            vaultUrl,
            vaultGatewayUrl,
            blockchainTxId,
            isOnBlockchain: useBlockchain || false,
            blockchainNetwork: useBlockchain ? "VAULT Protocol / Quorum" : undefined,
            status: "active",
            issuedAt: new Date(),
          })
        }

        // Get the credential for email notification (either tempCredential or newly created)
        const credential = tempCredentialId 
          ? await Credential.findById(tempCredentialId)
          : await Credential.findOne({
              templateId: template._id,
              organizationId,
              recipientEmail: emailValue,
            }).sort({ issuedAt: -1 })

        // Send notification email to recipient
        if (credential) {
          try {
            const emailHtml = generateCredentialIssuedEmail({
              recipientName,
              credentialName: template.name || (template.type === "certificate" ? "Certificate" : template.type === "badge" ? "Badge" : "Credential"),
              issuerName: user?.name as string || "Unknown Issuer",
              issuerOrganization: organizationName,
              issuedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              credentialId: credential._id.toString(),
              viewCredentialLink: `${process.env.NEXTAUTH_URL}/verify/${credential._id.toString()}`,
              blockchainVerified: useBlockchain || false,
            })

            await sendEmail({
              to: emailValue,
              subject: `New ${template.type === "certificate" ? "Certificate" : template.type === "badge" ? "Badge" : "Credential"} Issued - CredVault`,
              html: emailHtml,
            })
          } catch (emailError) {
            console.error(`Failed to send notification email to ${emailValue}:`, emailError)
            // Don't fail credential issuance if email fails
          }
        }

        records.push({
          recipientName,
          email: emailValue,
          status: "success",
          message: "Credential issued successfully",
        })
      } catch (error) {
        records.push({
          recipientName,
          email: emailValue || "N/A",
          status: "error",
          message: error && typeof error === "object" && "message" in error ? String(error.message) : "Failed to issue credential",
        })
      }
    }

    return NextResponse.json({
      message: "Bulk issuance completed",
      records,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withIssuer(handler)

