import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import connectDB from "@/lib/db/mongodb"
import { User } from "@/models"
import { setOAuthError } from "@/lib/oauth-errors"
import { headers } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  role: "recipient" | "issuer" | "admin"
  organizationId?: string
  isVerified?: boolean
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const email = typeof credentials.email === "string" ? credentials.email : String(credentials.email)
        const password = typeof credentials.password === "string" ? credentials.password : String(credentials.password)

        try {
          await connectDB()

          // Find user by email with password field
          const user = await User.findOne({ email: email.toLowerCase() }).select("+password")

          if (!user) {
            throw new Error("Invalid email or password")
          }

          // Verify password
          if (!user.password || !(await user.comparePassword(password))) {
            throw new Error("Invalid email or password")
          }

          // Check role match if specified
          const requestedRole = typeof credentials.role === "string" ? credentials.role : credentials.role ? String(credentials.role) : undefined
          if (requestedRole && user.role !== requestedRole) {
            throw new Error(`Invalid role. This account is registered as ${user.role}, not ${requestedRole}.`)
          }

          // Check if issuer is verified - check organization status directly from DB
          if (user.role === "issuer") {
            if (user.organizationId) {
              const Organization = (await import("@/models")).Organization
              const organization = await Organization.findById(user.organizationId).select("verificationStatus")
              if (!organization) {
                throw new Error("VERIFICATION_PENDING: Organization not found. Please contact support.")
              }
              if (organization.verificationStatus !== "approved") {
                throw new Error(organization.verificationStatus === "pending"
                  ? "VERIFICATION_PENDING: Your organization is pending verification. Please wait for admin approval."
                  : "VERIFICATION_REJECTED: Your organization verification was rejected. Please contact support.")
              }
              // Organization is approved - sync user.isVerified
              if (!user.isVerified) {
                user.isVerified = true
                await user.save()
              }
            } else {
              throw new Error("VERIFICATION_PENDING: No organization found. Please complete your registration.")
            }
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("EMAIL_NOT_VERIFIED: Please verify your email address before signing in. Check your inbox for the verification link.")
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId?.toString(),
            isVerified: user.isVerified,
            image: user.image || null,
          }
        } catch (error: unknown) {
          console.error("Auth error:", error)
          // Re-throw custom error messages
          if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
            throw error
          }
          // Default error for unexpected cases
          throw new Error("An error occurred during authentication. Please try again.")
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await connectDB()

          // Extract requested role from cookie set by client before OAuth
          let requestedRole: "recipient" | "issuer" | undefined = undefined
          
          try {
            const headersList = await headers()
            const cookieHeader = headersList.get("cookie") || ""
            const cookies = cookieHeader.split(";").map(c => c.trim())
            for (const cookie of cookies) {
              if (cookie.startsWith("oauth_role=")) {
                const roleValue = cookie.split("=")[1]
                if (roleValue === "issuer" || roleValue === "recipient") {
                  requestedRole = roleValue as "recipient" | "issuer"
                }
                break
              }
            }
          } catch (err) {
            // If we can't read cookies, that's okay - we'll proceed without role validation
            console.warn("Could not read oauth_role cookie:", err)
          }

          // Check if user exists
          const existingUser = await User.findOne({ email: user.email?.toLowerCase() })

          if (!existingUser) {
            // Determine role for new user
            let newUserRole: "recipient" | "issuer" = "recipient"
            let isVerified = true
            const emailVerified = true

            if (requestedRole === "issuer") {
              newUserRole = "issuer"
              // Issuers need admin verification, so set to unverified
              // Also, OAuth issuers need to complete organization registration
              isVerified = false
            }

            // Create new user with OAuth
            // Note: For issuers, organizationId will be null initially - they need to complete registration
            const newUser = await User.create({
              name: user.name || profile?.name || "User",
              email: user.email?.toLowerCase(),
              role: newUserRole,
              isVerified,
              emailVerified,
              image: user.image || profile?.picture || profile?.avatar_url,
              organizationId: null, // OAuth issuers must complete registration to create organization
            })

            // Type assertion for custom user properties
            const customUser = user as User
            customUser.id = newUser._id.toString()
            customUser.role = newUser.role
            customUser.organizationId = newUser.organizationId?.toString()
            customUser.isVerified = newUser.isVerified
          } else {
            // Validate role match for existing user
            if (requestedRole && existingUser.role !== requestedRole) {
              const errorMessage = `This account is registered as ${existingUser.role}, not ${requestedRole}. Please use the ${existingUser.role} login page.`
              console.error(`OAuth sign-in failed: ${errorMessage}`)
              // Store error message for error page to retrieve
              setOAuthError(existingUser.email, errorMessage)
              return false
            }

            // Check if issuer is verified
            if (existingUser.role === "issuer" && !existingUser.isVerified) {
              const errorMessage = "VERIFICATION_PENDING: Your organization is pending verification. Please wait for admin approval."
              console.error(`OAuth sign-in failed: ${errorMessage}`)
              // Store error message for error page to retrieve
              setOAuthError(existingUser.email, errorMessage)
              return false
            }

            // Check if email is verified (for users who signed up with credentials first)
            if (!existingUser.emailVerified) {
              // If user came from OAuth, mark email as verified since OAuth providers verify emails
              existingUser.emailVerified = true
              await existingUser.save()
            }

            // Update user info if needed
            if (user.image && !existingUser.image) {
              existingUser.image = user.image
              await existingUser.save()
            }
            
            // Type assertion for custom user properties
            const customUser = user as User
            customUser.id = existingUser._id.toString()
            customUser.role = existingUser.role
            customUser.organizationId = existingUser.organizationId?.toString()
            customUser.isVerified = existingUser.isVerified
          }

          return true
        } catch (error) {
          console.error("OAuth sign-in error:", error)
          
          // If error contains REDIRECT, it's a custom redirect
          if (error && typeof error === "object" && "message" in error) {
            const errorMsg = String(error.message)
            if (errorMsg.startsWith("REDIRECT:")) {
              // This will be handled by NextAuth's error handling
              // We still return false, but the redirect URL is logged
              return false
            }
          }
          
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      // First, handle initial user data from OAuth sign-in
      if (user) {
        // Set user info when user first signs in
        token.id = (user as User).id
        token.role = (user as User).role
        token.organizationId = (user as User).organizationId
        token.isVerified = (user as User).isVerified
        token.email = (user as User).email
        token.name = (user as User).name
        token.lastUpdated = Date.now() // Track when user data was last updated
        
        // Store OAuth image URL if present (OAuth providers give URLs, not base64)
        if ("image" in user && user.image !== undefined) {
          const imageValue = user.image as string
          if (imageValue && (imageValue.startsWith("http://") || imageValue.startsWith("https://"))) {
            // OAuth provider URL - safe to store
            token.image = imageValue
          } else if (imageValue && !imageValue.startsWith("data:") && imageValue.length < 500) {
            // Small non-base64 value
            token.image = imageValue
          } else {
            // Base64 or invalid - don't store
            token.image = undefined
          }
        }
      }
      
      // Only refresh user data from database if:
      // 1. Explicitly triggered by update, OR
      // 2. More than 10 minutes have passed since last update (to reduce API calls)
      const shouldRefreshFromDB = trigger === "update" || 
        !token.lastUpdated || 
        (Date.now() - (token.lastUpdated as number)) > (10 * 60 * 1000) // 10 minutes
      
      if (token.id && shouldRefreshFromDB) {
        console.log(`[JWT] Refreshing user data from DB (trigger: ${trigger || 'interval'})`)
        try {
          await connectDB()
          const dbUser = await User.findById(token.id)
          if (dbUser) {
            token.role = dbUser.role
            token.organizationId = dbUser.organizationId?.toString()
            token.isVerified = dbUser.isVerified
            token.lastUpdated = Date.now() // Update timestamp
            
            // Only store image URL if it's a URL (not base64), otherwise omit to keep token small
            // Base64 images can be several MB and will exceed cookie size limits
            // OAuth providers (Google, GitHub) provide URLs starting with http/https
            if (dbUser.image) {
              if (dbUser.image.startsWith("http://") || dbUser.image.startsWith("https://")) {
                // OAuth provider URL - safe to store (overrides any previous value)
                token.image = dbUser.image
              } else if (!dbUser.image.startsWith("data:") && dbUser.image.length < 500) {
                // Small non-base64 value - might be a short reference
                token.image = dbUser.image
              } else {
                // Base64 data URL - don't store in token (keep existing token.image if it's a URL)
                const existingImage = token.image as string | undefined
                if (!existingImage || (!existingImage.startsWith("http://") && !existingImage.startsWith("https://"))) {
                  token.image = undefined
                }
                // Otherwise keep the existing URL from OAuth
              }
            } else {
              // No image in DB - keep existing token.image if it exists, otherwise undefined
              const existingImage = token.image as string | undefined
              if (!existingImage || (!existingImage.startsWith("http://") && !existingImage.startsWith("https://"))) {
                token.image = undefined
              }
            }
          }
        } catch (error) {
          console.error("Error refreshing user data:", error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Map token data to session user
        session.user.id = (token.id || token.sub) as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.isVerified = token.isVerified as boolean
        // Only set image if it exists and is a URL (not base64)
        // Base64 images should be fetched separately via API to avoid cookie size issues
        if (token.image && typeof token.image === "string") {
          if (token.image.startsWith("http://") || token.image.startsWith("https://")) {
            // OAuth URL - safe to include
            session.user.image = token.image
          } else if (token.image.length < 500 && !token.image.startsWith("data:")) {
            // Small non-base64 value
            session.user.image = token.image
          } else {
            // Base64 or too large - don't include
            session.user.image = null
          }
        } else {
          session.user.image = null
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  trustHost: true, // Allow dynamic host detection for subdomains
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours (instead of on every access)
  },
  secret: process.env.NEXTAUTH_SECRET || "credvault-secret-key-change-in-production",
}

// Helper functions for user management (using MongoDB)
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: "recipient" | "issuer",
  organizationName?: string
): Promise<User> {
  await connectDB()

  const { Organization } = await import("@/models")

  let organizationId = null

  if (role === "issuer" && organizationName) {
    // Check if organization exists
    const existingOrg = await Organization.findOne({
      name: { $regex: new RegExp(`^${organizationName}$`, "i") },
    })

    if (existingOrg) {
      organizationId = existingOrg._id
    } else {
      // Create new organization
      const organization = await Organization.create({
        name: organizationName,
        verificationStatus: "pending",
      })
      organizationId = organization._id
    }
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    role,
    organizationId,
    isVerified: role === "recipient", // Recipients auto-verified
    emailVerified: false,
  })

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId?.toString(),
    isVerified: user.isVerified,
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) return null

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId?.toString(),
    isVerified: user.isVerified,
  }
}
