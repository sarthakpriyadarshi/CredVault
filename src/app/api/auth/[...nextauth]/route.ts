import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// For NextAuth v5 beta with Next.js 16 App Router
// NextAuth returns a result object with handlers and auth property
const handler = NextAuth(authOptions)

// Export handlers
export const GET = handler.handlers?.GET || (() => new Response("Not found", { status: 404 }))
export const POST = handler.handlers?.POST || (() => new Response("Not found", { status: 404 }))

// Export auth function for use in API routes
export const auth = handler.auth

