import { NextRequest, NextResponse } from "next/server"
import { getServerSessionForApi } from "@/lib/auth-server"
import connectDB from "@/lib/db/mongodb"
import { getUserCacheInfo } from "@/lib/cache"

type Handler = (
  req: NextRequest,
  context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  user?: Record<string, unknown>
) => Promise<NextResponse>

/**
 * Database connection wrapper
 * Ensures MongoDB connection before route handler execution
 */
export function withDB(handler: Handler) {
  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    try {
      await connectDB()
      // If params is a Promise, await it before passing to handler
      if (context?.params && context.params instanceof Promise) {
        context.params = await context.params
      }
      const result = await handler(req, context)
      if (!result || !(result instanceof NextResponse)) {
        console.error("Handler did not return a NextResponse:", result)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
      return result
    } catch (error: unknown) {
      console.error("Database connection error:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
  }
}

/**
 * Authentication middleware for API routes with caching
 * Validates session and optionally checks user roles using cached data
 * 
 * In Next.js 16 App Router, middleware functions wrap route handlers
 * This follows the pattern recommended for API route protection
 */
export function withAuth(handler: Handler, options?: { roles?: string[]; skipVerificationCheck?: boolean }) {
  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    try {
      const session = await getServerSessionForApi()

      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Get user ID from session
      const userId = session.user.id as string | undefined
      
      if (!userId) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
      }

      // Check role if specified - use cached data
      if (options?.roles && options.roles.length > 0) {
        // Fetch cached user info including role and verification status
        const userInfo = await getUserCacheInfo(userId)
        
        if (!userInfo) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          )
        }
        
        // Check if user's role is in the allowed roles
        if (!options.roles.includes(userInfo.role)) {
          return NextResponse.json(
            { error: "Forbidden: Insufficient permissions" },
            { status: 403 }
          )
        }
        
        // For issuer role, check verification status (unless explicitly skipped)
        // Skip verification check for endpoints like create-organization where user needs to create org first
        if (userInfo.role === "issuer" && !userInfo.isVerified && !options.skipVerificationCheck) {
          return NextResponse.json(
            { error: "Forbidden: Organization pending verification" },
            { status: 403 }
          )
        }
        
        // Enrich session.user with cached data
        session.user.role = userInfo.role
        session.user.isVerified = userInfo.isVerified
        session.user.organizationId = userInfo.organizationId || undefined
      }

      // Await params if it's a Promise
      let resolvedContext = context
      if (context?.params && context.params instanceof Promise) {
        resolvedContext = {
          ...context,
          params: await context.params,
        }
      }

      // Combine DB connection with auth - execute handler with authenticated user
      const dbHandler = withDB(async (req, ctx) => {
        const result = await handler(req, ctx, session.user as Record<string, unknown>)
        if (!result || !(result instanceof NextResponse)) {
          console.error("Handler did not return a NextResponse:", result)
          return NextResponse.json({ error: "Internal server error" }, { status: 500 })
        }
        return result
      })
      const result = await dbHandler(req, resolvedContext)
      if (!result || !(result instanceof NextResponse)) {
        console.error("DB handler did not return a NextResponse:", result)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
      return result
    } catch (error: unknown) {
      console.error("Auth error:", error)
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      )
    }
  }
}

/**
 * Admin-only route protection
 * Restricts access to users with admin role
 */
export function withAdmin(handler: Handler) {
  return withAuth(handler, { roles: ["admin"] })
}

/**
 * Issuer-only route protection
 * Allows access to both issuer and admin roles
 */
export function withIssuer(handler: Handler) {
  return withAuth(handler, { roles: ["issuer", "admin"] })
}

/**
 * Issuer route protection (allows unverified issuers)
 * Use this for endpoints that unverified issuers need access to (e.g., create organization)
 */
export function withIssuerUnverified(handler: Handler) {
  return withAuth(handler, { roles: ["issuer", "admin"], skipVerificationCheck: true })
}

/**
 * Error handler for API routes
 * Provides consistent error responses across the API
 */
export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  // Handle Mongoose validation errors
  if (error && typeof error === "object" && "name" in error) {
    if (error.name === "ValidationError" && "errors" in error) {
      const errors = error.errors as Record<string, { message: string }>
      return NextResponse.json(
        {
          error: "Validation error",
          details: Object.values(errors).map((e) => e.message),
        },
        { status: 400 }
      )
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      )
    }
  }

  // Handle duplicate key errors (MongoDB unique constraint)
  if (error && typeof error === "object" && "code" in error && error.code === 11000) {
    return NextResponse.json(
      { error: "Duplicate entry - resource already exists" },
      { status: 409 }
    )
  }

  // Extract error message and status
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "Internal server error"

  const status =
    error && typeof error === "object" && "status" in error && typeof error.status === "number"
      ? error.status
      : 500

  return NextResponse.json({ error: message }, { status })
}
