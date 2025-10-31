import { NextRequest, NextResponse } from "next/server"
import { getServerSessionForApi } from "@/lib/auth-server"
import connectDB from "@/lib/db/mongodb"

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
      return handler(req, context)
    } catch (error: unknown) {
      console.error("Database connection error:", error)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
  }
}

/**
 * Authentication middleware for API routes
 * Validates session and optionally checks user roles
 * 
 * In Next.js 16 App Router, middleware functions wrap route handlers
 * This follows the pattern recommended for API route protection
 */
export function withAuth(handler: Handler, options?: { roles?: string[] }) {
  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    try {
      const session = await getServerSessionForApi()

      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check role if specified
      const userRole = session.user.role as string | undefined
      if (options?.roles && userRole && !options.roles.includes(userRole)) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        )
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
      return withDB(async (req, ctx) => {
        return handler(req, ctx, session.user as Record<string, unknown>)
      })(req, resolvedContext)
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
