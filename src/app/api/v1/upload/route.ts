/**
 * Unified file upload endpoint
 * Handles various file upload types: avatar, logo, template-image, organization-proof
 * 
 * Note: organization-proof uploads are allowed without authentication (for signup)
 * All other upload types require authentication
 */

import { NextRequest } from "next/server"
import { withAuth, withDB, handleApiError } from "@/lib/api/middleware"
import { methodNotAllowed, successResponse, errorResponse, validationErrorResponse } from "@/lib/api/responses"
import { validateFileType, validateFileSize } from "@/lib/api/validation"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
const ALLOWED_TEMPLATE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"]

async function uploadHandler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>,
  parsedFormData?: FormData
) {
  if (req.method !== "POST") {
    return methodNotAllowed()
  }

  try {
    // Use provided formData if available, otherwise parse from request
    const formData = parsedFormData || await req.formData()
    const file = formData.get("file") as File | null
    const uploadType = formData.get("type") as string | null

    if (!file) {
      return errorResponse("No file uploaded", 400)
    }

    // Validate upload type
    const validTypes = ["avatar", "logo", "template-image", "organization-proof"]
    if (!uploadType || !validTypes.includes(uploadType)) {
      return errorResponse(`Invalid upload type. Must be one of: ${validTypes.join(", ")}`, 400)
    }

    // Check permissions for issuer-only uploads (only if user is provided, i.e., authenticated)
    const userRole = user?.role as string | undefined
    if ((uploadType === "logo" || uploadType === "template-image") && userRole !== "issuer" && userRole !== "admin") {
      return errorResponse("Forbidden: Only issuers and admins can upload logos and template images", 403)
    }

    // Determine allowed file types and max size based on upload type
    let allowedTypes: string[]
    let maxSize: number
    let message: string

    switch (uploadType) {
      case "avatar":
        allowedTypes = ALLOWED_IMAGE_TYPES
        maxSize = 5 * 1024 * 1024 // 5MB
        message = "Avatar uploaded successfully"
        break
      case "logo":
        allowedTypes = ALLOWED_IMAGE_TYPES
        maxSize = 5 * 1024 * 1024 // 5MB
        message = "Logo uploaded successfully"
        break
      case "template-image":
        allowedTypes = ALLOWED_TEMPLATE_TYPES
        maxSize = 10 * 1024 * 1024 // 10MB
        message = "Template image uploaded successfully"
        // Additional validation for template-image
        const imageType = formData.get("imageType") as string | null
        if (!imageType || !["certificate", "badge"].includes(imageType)) {
          return errorResponse("Invalid image type for template. Must be 'certificate' or 'badge'", 400)
        }
        break
      case "organization-proof":
        allowedTypes = ALLOWED_IMAGE_TYPES
        maxSize = 5 * 1024 * 1024 // 5MB
        message = "Organization proof uploaded successfully"
        break
      default:
        return errorResponse("Invalid upload type", 400)
    }

    // Validate file type
    const typeValidation = validateFileType(file, allowedTypes)
    if (!typeValidation.valid) {
      return validationErrorResponse(typeValidation.errors)
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, maxSize)
    if (!sizeValidation.valid) {
      return validationErrorResponse(sizeValidation.errors)
    }

    // Read file and convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Create data URL with MIME type
    const dataUrl = `data:${file.type};base64,${base64}`

    const responseData: Record<string, unknown> = {
      message,
      base64: dataUrl,
      mimeType: file.type,
      size: file.size,
    }

    // Add imageType for template-image
    if (uploadType === "template-image") {
      const imageType = formData.get("imageType") as string | null
      if (imageType) {
        responseData.type = imageType
      }
    }

    return successResponse(responseData)
  } catch (error: unknown) {
    console.error("File upload error:", error)
    return handleApiError(error)
  }
}

// Upload handler with conditional authentication:
// - organization-proof: allowed without authentication (for signup)
// - avatar, logo, template-image: require authentication
// - logo and template-image: additionally require issuer/admin role
export async function POST(
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> }
) {
  // Read formData once to check upload type (formData can only be read once from request)
  // We'll need to recreate the request or pass the formData to handlers
  const formData = await req.formData()
  const uploadType = formData.get("type") as string | null

  // organization-proof uploads are allowed without authentication (for signup)
  if (uploadType === "organization-proof") {
    async function unauthenticatedHandler(
      req: NextRequest,
      ctx?: { params?: Promise<Record<string, string>> | Record<string, string> }
    ) {
      // Pass undefined user and pre-parsed formData for organization-proof uploads
      return uploadHandler(req, ctx, undefined, formData)
    }

    return withDB(unauthenticatedHandler)(req, context)
  }

  // All other upload types require authentication
  async function authenticatedHandler(
    req: NextRequest,
    ctx?: { params?: Promise<Record<string, string>> | Record<string, string> },
    user?: Record<string, unknown>
  ) {
    // Use pre-parsed formData since we already read it from the original request
    return uploadHandler(req, ctx, user, formData)
  }

  // withAuth doesn't need to read request body, so we can pass original req
  return withAuth(authenticatedHandler)(req, context)
}

