"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

export default function IssuerRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (status === "authenticated" && session?.user) {
      // If already logged in, redirect to appropriate dashboard based on role
      if (session.user.role === "issuer") {
        // Check if issuer needs to complete registration
        if (!session.user.organizationId) {
          router.push("/auth/issuer/complete")
        } else if (!session.user.isVerified) {
          router.push("/auth/issuer/login?pending=true")
        } else {
          router.push("/dashboard/issuer")
        }
      } else if (session.user.role === "recipient") {
        router.push("/dashboard/recipient")
      } else if (session.user.role === "admin") {
        router.push("/dashboard/admin")
      } else {
        // Unknown role, redirect to issuer login
        router.push("/auth/issuer/login")
      }
    } else {
      // Not authenticated, redirect to issuer login
      router.push("/auth/issuer/login")
    }
  }, [session, status, router])

  // Show loading while checking session
  return <LoadingScreen />
}

