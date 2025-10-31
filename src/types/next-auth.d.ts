import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role?: string
      organizationId?: string
      isVerified?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    organizationId?: string
    isVerified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    organizationId?: string
    isVerified?: boolean
  }
}

