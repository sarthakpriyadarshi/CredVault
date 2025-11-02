// Server-side auth helper for API routes in Next.js 16 with NextAuth v5

/**
 * Get server session for API routes
 * Uses the auth function from NextAuth v5 route handler
 * In Next.js 16, auth() automatically reads from cookies() in API routes
 */
export async function getServerSessionForApi() {
  try {
    // Import auth function from NextAuth route handler
    const routeModule = await import("@/app/api/auth/[...nextauth]/route")
    const auth = routeModule.auth
    
    if (!auth) {
      console.warn("Auth function not available from route handler")
      return null
    }
    
    // In NextAuth v5, auth() automatically reads cookies using Next.js cookies() function
    // This works in API routes - no need to pass headers manually
    const session = await auth()
    
    if (!session) {
      return null
    }
    
    return session
  } catch (error) {
    // Suppress prerendering warnings during build time
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('During prerendering') || errorMessage.includes('headers()')) {
      // Silent failure during prerendering - this is expected
      return null
    }
    console.error("Auth error:", error)
    console.warn("Failed to get server session - authentication may not be available")
    return null
  }
}

/**
 * Get authenticated user from session
 * Helper to extract user data safely
 */
export async function getAuthenticatedUser() {
  const session = await getServerSessionForApi()
  if (!session?.user) {
    return null
  }
  return session.user
}
