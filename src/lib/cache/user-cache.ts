/**
 * User Cache Service
 * 
 * This module provides cached user role and admin status checks using Next.js
 * unstable_cache API. It implements:
 * 
 * 1. Cached admin checks that run on first compilation
 * 2. Background revalidation when cache expires
 * 3. Manual cache invalidation when user roles change
 * 4. Tagged caching for granular control
 */

import { unstable_cache } from "next/cache"
import { User } from "@/models"
import connectDB from "@/lib/db/mongodb"

/**
 * Check if a user is an admin (cached)
 * 
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin
 */
export const isUserAdmin = (userId: string) => 
  unstable_cache(
    async () => {
      try {
        await connectDB()
        const user = await User.findById(userId).select("role").lean()
        return user?.role === "admin"
      } catch (error) {
        console.error("Error checking if user is admin:", error)
        return false
      }
    },
    [`user-admin-${userId}`],
    {
      tags: [`user-role-${userId}`, "user-roles"],
      revalidate: 3600, // 1 hour
    }
  )()

/**
 * Get user role (cached)
 * 
 * @param userId - The user ID
 * @returns Promise<string | null> - The user's role or null
 */
export const getUserRole = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        await connectDB()
        const user = await User.findById(userId).select("role").lean()
        return user?.role || null
      } catch (error) {
        console.error("Error fetching user role:", error)
        return null
      }
    },
    [`user-role-${userId}`],
    {
      tags: [`user-role-${userId}`, "user-roles"],
      revalidate: 3600, // 1 hour
    }
  )()

/**
 * Get user verification status (cached)
 * 
 * @param userId - The user ID
 * @returns Promise<{isVerified: boolean, organizationId: string | null}> - Verification status
 */
export const getUserVerificationStatus = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        await connectDB()
        const user = await User.findById(userId)
          .select("isVerified organizationId")
          .lean()
        
        return {
          isVerified: user?.isVerified || false,
          organizationId: user?.organizationId?.toString() || null,
        }
      } catch (error) {
        console.error("Error fetching user verification status:", error)
        return {
          isVerified: false,
          organizationId: null,
        }
      }
    },
    [`user-verification-${userId}`],
    {
      tags: [`user-verification-${userId}`, "user-verifications"],
      revalidate: 3600, // 1 minute
    }
  )()

/**
 * Get comprehensive user info (cached)
 * This combines role and verification status in a single query
 * 
 * @param userId - The user ID
 * @returns Promise<UserCacheInfo | null> - User info or null
 */
export const getUserCacheInfo = (userId: string) =>
  unstable_cache(
    async () => {
      try {
        await connectDB()
        const user = await User.findById(userId)
          .select("role isVerified organizationId")
          .lean()
        
        if (!user) {
          return null
        }
        
        return {
          userId,
          role: user.role as "admin" | "issuer" | "recipient",
          isVerified: user.isVerified,
          organizationId: user.organizationId?.toString() || null,
        }
      } catch (error) {
        console.error("Error fetching user cache info:", error)
        return null
      }
    },
    [`user-info-${userId}`],
    {
      tags: [`user-info-${userId}`, "user-info"],
      revalidate: 3600, // 1 hour
    }
  )()

/**
 * Check if any admin exists (cached)
 * Useful for setup page
 * 
 * @returns Promise<boolean> - True if at least one admin exists
 */
export const hasAdminUser = () =>
  unstable_cache(
    async () => {
      const startTime = Date.now()
      
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("[CACHE] hasAdminUser() - DB query executed (cache miss or expired)")
        }
        
        await connectDB()
        const adminCount = await User.countDocuments({ role: "admin" })
        const result = adminCount > 0
        
        if (process.env.NODE_ENV === "development") {
          const duration = Date.now() - startTime
          console.log(`[CACHE] hasAdminUser() result: ${result} (adminCount: ${adminCount}) - took ${duration}ms`)
        }
        
        return result
      } catch (error) {
        console.error("Error checking admin existence:", error)
        return false
      }
    },
    ["admin-exists"],
    {
      tags: ["admin-exists"],
      revalidate: 60, // 2 hours 3600
    }
  )()

/**
 * Type definitions
 */
export interface UserCacheInfo {
  userId: string
  role: "admin" | "issuer" | "recipient"
  isVerified: boolean
  organizationId: string | null
}
