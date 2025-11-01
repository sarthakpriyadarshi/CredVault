/**
 * Unified change password endpoint
 * Works for all user roles (recipient, issuer, admin)
 * Next.js API Route Handler
 */

import { NextRequest } from "next/server"
import { withAuth, handleApiError } from "@/lib/api/middleware"
import { methodNotAllowed, successResponse, errorResponse, validationErrorResponse } from "@/lib/api/responses"
import { parseBody } from "@/lib/api/utils"
import { changePasswordService } from "@/lib/services/auth.service"
import { validateRequired, validatePassword } from "@/lib/api/validation"

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return methodNotAllowed()
  }

  try {
    const userId = user?.id as string | undefined
    if (!userId) {
      return errorResponse("User not authenticated", 401)
    }

    const body = await parseBody<ChangePasswordRequest>(req)
    const { currentPassword, newPassword } = body

    // Validation
    const currentPasswordValidation = validateRequired(currentPassword, "Current password")
    if (!currentPasswordValidation.valid) {
      return validationErrorResponse(currentPasswordValidation.errors)
    }

    const newPasswordValidation = validatePassword(newPassword, 8)
    if (!newPasswordValidation.valid) {
      return validationErrorResponse(newPasswordValidation.errors)
    }

    // Change password using service
    const result = await changePasswordService({
      userId,
      currentPassword,
      newPassword,
    })

    if (!result.success) {
      return errorResponse(result.error || "Failed to change password", 400)
    }

    return successResponse({ message: "Password changed successfully" })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const POST = withAuth(handler)

