import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import connectDB from "@/lib/db/mongodb"
import { User } from "@/models"

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

          // Check if issuer is verified
          if (user.role === "issuer" && !user.isVerified) {
            throw new Error("VERIFICATION_PENDING: Your organization is pending verification. Please wait for admin approval.")
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId?.toString(),
            isVerified: user.isVerified,
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

          // Check if user exists
          const existingUser = await User.findOne({ email: user.email?.toLowerCase() })

          if (!existingUser) {
            // Create new user with OAuth (default to recipient)
            const newUser = await User.create({
              name: user.name || profile?.name || "User",
              email: user.email?.toLowerCase(),
              role: "recipient", // Default role for OAuth users
              isVerified: true,
              emailVerified: true,
              image: user.image || profile?.picture || profile?.avatar_url,
            })

            user.id = newUser._id.toString()
            user.role = newUser.role
          } else {
            // Update user info if needed
            if (user.image && !existingUser.image) {
              existingUser.image = user.image
              await existingUser.save()
            }
            user.id = existingUser._id.toString()
            user.role = existingUser.role
          }

          return true
        } catch (error) {
          console.error("OAuth sign-in error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // Set user info when user first signs in
        token.id = (user as User).id
        token.role = (user as User).role
        token.organizationId = (user as User).organizationId
        token.isVerified = (user as User).isVerified
        token.email = (user as User).email
        token.name = (user as User).name
      }
      
      // On session update, refresh user data from database
      if (trigger === "update" && token.id) {
        try {
          await connectDB()
          const dbUser = await User.findById(token.id)
          if (dbUser) {
            token.role = dbUser.role
            token.organizationId = dbUser.organizationId?.toString()
            token.isVerified = dbUser.isVerified
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
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
