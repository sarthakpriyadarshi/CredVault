/**
 * Server-side setup check
 * This runs on the server during page rendering to check if setup is needed
 */

import { hasAdminUser } from "@/lib/cache/user-cache"

/**
 * Check if setup is complete (server-side)
 * This uses the cached hasAdminUser function to avoid repeated DB queries
 * 
 * @returns Promise<boolean> - True if setup is complete (admin exists)
 */
export async function isSetupComplete(): Promise<boolean> {
  try {
    const adminExists = await hasAdminUser()
    return adminExists
  } catch (error) {
    console.error("Error checking setup status:", error)
    // On error, assume setup is complete to avoid redirect loops
    return true
  }
}
