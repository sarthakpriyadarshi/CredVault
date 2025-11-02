/**
 * Cache Invalidation Service
 * 
 * This module provides utilities for invalidating cached user data
 * when changes occur (e.g., role changes, verification status updates)
 * 
 * IMPORTANT: updateTag can ONLY be used in Server Actions (use server directive)
 * For Route Handlers, use the non-immediate versions or revalidateTag directly
 */

"use server"

import { revalidateTag, updateTag } from "next/cache"

/**
 * Invalidate user role cache
 * Use this when a user's role changes
 * 
 * @param userId - The user ID whose cache should be invalidated
 * @param immediate - If true, uses updateTag for immediate invalidation (Server Actions ONLY)
 *                   If false, uses revalidateTag with background revalidation
 */
export async function invalidateUserRole(userId: string, immediate = false) {
  if (immediate) {
    // Immediate invalidation - ONLY for Server Actions
    updateTag(`user-role-${userId}`)
    updateTag(`user-info-${userId}`)
  } else {
    // Background revalidation - safe for Route Handlers and Server Actions
    revalidateTag(`user-role-${userId}`, "user-role")
    revalidateTag(`user-info-${userId}`, "user-role")
  }
}

/**
 * Invalidate user verification cache
 * Use this when a user's verification status changes
 * 
 * @param userId - The user ID whose cache should be invalidated
 * @param immediate - If true, uses updateTag for immediate invalidation (Server Actions ONLY)
 */
export async function invalidateUserVerification(userId: string, immediate = false) {
  if (immediate) {
    updateTag(`user-verification-${userId}`)
    updateTag(`user-info-${userId}`)
  } else {
    revalidateTag(`user-verification-${userId}`, "user-role")
    revalidateTag(`user-info-${userId}`, "user-role")
  }
}

/**
 * Invalidate all user caches
 * Use this for bulk updates or admin operations
 * 
 * @param immediate - If true, uses updateTag for immediate invalidation (Server Actions ONLY)
 */
export async function invalidateAllUsers(immediate = false) {
  if (immediate) {
    updateTag("user-roles")
    updateTag("user-verifications")
    updateTag("user-info")
  } else {
    revalidateTag("user-roles", "user-role")
    revalidateTag("user-verifications", "user-role")
    revalidateTag("user-info", "user-role")
  }
}

/**
 * Invalidate admin existence cache
 * Use this when the first admin is created or all admins are removed
 * 
 * @param immediate - If true, uses updateTag for immediate invalidation (Server Actions ONLY)
 */
export async function invalidateAdminExists(immediate = false) {
  if (immediate) {
    updateTag("admin-exists")
  } else {
    revalidateTag("admin-exists", "admin-check")
  }
}

/**
 * Refresh all user-related caches
 * This triggers a background revalidation for all user data
 * Use this sparingly, for major system updates
 */
export async function refreshAllUserCaches() {
  revalidateTag("user-roles", "user-role")
  revalidateTag("user-verifications", "user-role")
  revalidateTag("user-info", "user-role")
  revalidateTag("admin-exists", "admin-check")
}
