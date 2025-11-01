/**
 * Authentication service
 * Handles password change and authentication logic
 */

import { User } from "@/models"
import type { IUser } from "@/models"
import { validatePassword } from "@/lib/api/validation"
import { updateUserPasswordService } from "./user.service"

export interface ChangePasswordData {
  userId: string
  currentPassword: string
  newPassword: string
}

/**
 * Change user password
 * Validates current password and sets new password
 */
export async function changePasswordService(data: ChangePasswordData): Promise<{ success: boolean; error?: string }> {
  // Validate password format
  const passwordValidation = validatePassword(data.newPassword, 8)
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.errors[0] }
  }

  // Find user with password field
  const dbUser = await User.findById(data.userId).select("+password")
  if (!dbUser) {
    return { success: false, error: "User not found" }
  }

  // Verify current password
  if (!dbUser.password || !(await dbUser.comparePassword(data.currentPassword))) {
    return { success: false, error: "Current password is incorrect" }
  }

  // Check if new password is different from current password
  if (await dbUser.comparePassword(data.newPassword)) {
    return { success: false, error: "New password must be different from current password" }
  }

  // Update password (User model's setter will hash it automatically)
  await updateUserPasswordService(data.userId, data.newPassword)

  return { success: true }
}

