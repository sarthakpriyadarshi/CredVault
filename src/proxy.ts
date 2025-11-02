import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for complete registration page
  // This page needs to update session and redirect without middleware interference
  if (pathname === "/auth/issuer/complete") {
    return NextResponse.next()
  }

  // NOTE: Setup check cannot run in middleware because:
  // 1. Middleware runs on Edge Runtime (no database access)
  // 2. unstable_cache/database queries are not available
  // Setup check is handled by SetupChecker component (client-side) instead

  // Handle redirect routes - check session and redirect appropriately
  if (pathname === "/issuer" || pathname === "/login" || pathname === "/signup") {
    try {
      // Get session using NextAuth's auth function
      const session = await auth()

      if (!session || !session.user) {
        // Not authenticated - redirect to appropriate login/signup
        if (pathname === "/issuer") {
          return NextResponse.redirect(new URL("/auth/issuer/login", request.url))
        } else if (pathname === "/login") {
          return NextResponse.redirect(new URL("/auth/login", request.url))
        } else if (pathname === "/signup") {
          return NextResponse.redirect(new URL("/auth/signup", request.url))
        }
      } else {
        // Authenticated - redirect to appropriate dashboard based on role
        const userRole = session.user.role as string | undefined

        if (pathname === "/issuer") {
          if (userRole === "issuer") {
            // Check if issuer needs to complete registration
            if (!session.user.organizationId) {
              return NextResponse.redirect(new URL("/auth/issuer/complete", request.url))
            } else if (!session.user.isVerified) {
              return NextResponse.redirect(new URL("/auth/issuer/login?pending=true", request.url))
            } else {
              return NextResponse.redirect(new URL("/dashboard/issuer", request.url))
            }
          } else if (userRole === "recipient") {
            return NextResponse.redirect(new URL("/dashboard/recipient", request.url))
          } else if (userRole === "admin") {
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          } else {
            return NextResponse.redirect(new URL("/auth/issuer/login", request.url))
          }
        } else if (pathname === "/login") {
          if (userRole === "recipient") {
            return NextResponse.redirect(new URL("/dashboard/recipient", request.url))
          } else if (userRole === "issuer") {
            if (!session.user.organizationId) {
              return NextResponse.redirect(new URL("/auth/issuer/complete", request.url))
            } else if (!session.user.isVerified) {
              return NextResponse.redirect(new URL("/auth/issuer/login?pending=true", request.url))
            } else {
              return NextResponse.redirect(new URL("/dashboard/issuer", request.url))
            }
          } else if (userRole === "admin") {
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          } else {
            return NextResponse.redirect(new URL("/auth/login", request.url))
          }
        } else if (pathname === "/signup") {
          if (userRole === "recipient") {
            return NextResponse.redirect(new URL("/dashboard/recipient", request.url))
          } else if (userRole === "issuer") {
            if (!session.user.organizationId) {
              return NextResponse.redirect(new URL("/auth/issuer/complete", request.url))
            } else if (!session.user.isVerified) {
              return NextResponse.redirect(new URL("/auth/issuer/login?pending=true", request.url))
            } else {
              return NextResponse.redirect(new URL("/dashboard/issuer", request.url))
            }
          } else if (userRole === "admin") {
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          } else {
            return NextResponse.redirect(new URL("/auth/signup", request.url))
          }
        }
      }
    } catch (error) {
      // If auth check fails, redirect to appropriate login page
      console.error("Middleware auth error:", error)
      if (pathname === "/issuer") {
        return NextResponse.redirect(new URL("/auth/issuer/login", request.url))
      } else if (pathname === "/login") {
        return NextResponse.redirect(new URL("/auth/login", request.url))
      } else if (pathname === "/signup") {
        return NextResponse.redirect(new URL("/auth/signup", request.url))
      }
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard/")) {
    try {
      const session = await auth()
      
      // Combined check: both session AND role must be valid
      const userRole = session?.user?.role as string | undefined
      const hasValidSession = session && session.user
      const hasValidRole = userRole === "admin" || userRole === "recipient" || userRole === "issuer"
      
      // If either session or role is invalid, redirect to login
      if (!hasValidSession || !hasValidRole) {
        // Determine which login page based on the dashboard route
        if (pathname.startsWith("/dashboard/recipient")) {
          return NextResponse.redirect(new URL("/auth/login", request.url))
        } else if (pathname.startsWith("/dashboard/issuer")) {
          return NextResponse.redirect(new URL("/auth/issuer/login", request.url))
        } else if (pathname.startsWith("/dashboard/admin")) {
          return NextResponse.redirect(new URL("/auth/admin/login", request.url))
        } else {
          // Unknown dashboard route, redirect to home
          return NextResponse.redirect(new URL("/", request.url))
        }
      }

      // Recipient dashboard protection
      if (pathname.startsWith("/dashboard/recipient")) {
        // Strictly check: must be recipient role, undefined/null roles not allowed
        if (!userRole || userRole !== "recipient") {
          // Wrong role or no role - redirect to appropriate login
          if (userRole === "issuer") {
            if (!session.user.organizationId) {
              return NextResponse.redirect(new URL("/auth/issuer/complete", request.url))
            } else if (!session.user.isVerified) {
              return NextResponse.redirect(new URL("/auth/issuer/login?pending=true", request.url))
            } else {
              return NextResponse.redirect(new URL("/dashboard/issuer", request.url))
            }
          } else if (userRole === "admin") {
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          } else {
            // No role or unknown role - redirect to recipient login
            return NextResponse.redirect(new URL("/auth/login", request.url))
          }
        }
      }

      // Issuer dashboard protection
      if (pathname.startsWith("/dashboard/issuer")) {
        // Strictly check: must be issuer role, undefined/null roles not allowed
        if (!userRole || userRole !== "issuer") {
          // Wrong role or no role - redirect to appropriate dashboard
          if (userRole === "recipient") {
            return NextResponse.redirect(new URL("/dashboard/recipient", request.url))
          } else if (userRole === "admin") {
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          } else {
            // No role or unknown role - redirect to issuer login
            return NextResponse.redirect(new URL("/auth/issuer/login", request.url))
          }
        } else {
          // Issuer role is correct, but check if they need to complete registration
          // Skip organizationId check if coming from complete registration (session update in progress)
          const isFromCompleteRegistration = request.nextUrl.searchParams.get("setup") === "complete"
          
          if (!session.user.organizationId && !isFromCompleteRegistration) {
            return NextResponse.redirect(new URL("/auth/issuer/complete", request.url))
          } else if (!session.user.isVerified && !isFromCompleteRegistration) {
            return NextResponse.redirect(new URL("/auth/issuer/login?pending=true", request.url))
          }
        }
      }

      // Admin dashboard protection
      if (pathname.startsWith("/dashboard/admin")) {
        // Strictly check: must be admin role, undefined/null roles not allowed
        if (!userRole || userRole !== "admin") {
          // Wrong role or no role - redirect to appropriate dashboard or login
          if (userRole === "recipient") {
            return NextResponse.redirect(new URL("/dashboard/recipient", request.url))
          } else if (userRole === "issuer") {
            if (!session.user.organizationId) {
              return NextResponse.redirect(new URL("/auth/issuer/complete", request.url))
            } else if (!session.user.isVerified) {
              return NextResponse.redirect(new URL("/auth/issuer/login?pending=true", request.url))
            } else {
              return NextResponse.redirect(new URL("/dashboard/issuer", request.url))
            }
          } else {
            // No role or unknown role - redirect to admin login
            return NextResponse.redirect(new URL("/auth/admin/login", request.url))
          }
        }
      }
    } catch (error) {
      // If auth check fails, redirect to login
      console.error("Middleware dashboard protection error:", error)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/issuer",
    "/login", 
    "/signup",
    "/dashboard/:path*",
    "/auth/:path*",
    "/profile/:path*",
    "/verify/:path*",
  ],
}

