"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

export function SetupChecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)

  useEffect(() => {
    // Don't check if already on setup page
    if (pathname === "/setup") {
      return
    }

    const checkSetup = async () => {
      try {
        // Use direct=true for auth pages to ensure fresh data
        const isDirect = pathname.startsWith("/setup") || pathname.startsWith("/auth")
        const url = isDirect ? "/api/v1/admin/setup?direct=true" : "/api/v1/admin/setup"
        
        console.log(`[SetupChecker] Checking setup on ${pathname} (direct: ${isDirect})`)
        const res = await fetch(url)
        
        if (!res.ok) {
          console.error(`[SetupChecker] API error: ${res.status} ${res.statusText}`)
          return
        }
        
        const data = await res.json()
        console.log(`[SetupChecker] Setup check result:`, data)
        console.log(`[SetupChecker] data.setupNeeded = ${data.setupNeeded}, data.hasAdmin = ${data.hasAdmin}`)
        
        if (data.setupNeeded === true) {
          console.log(`[SetupChecker] Setup needed! Redirecting to /setup`)
          setRedirectMessage("Setup required. Redirecting...")
          // Use window.location for immediate hard redirect
          window.location.href = "/setup"
          return
        } else {
          console.log(`[SetupChecker] Setup complete, allowing access`)
        }
      } catch (error) {
        console.error("[SetupChecker] Error checking setup:", error)
      }
    }

    checkSetup()
  }, [pathname])

  // Only show loading screen when actively redirecting
  if (redirectMessage) {
    return <LoadingScreen message={redirectMessage} />
  }

  return <>{children}</>
}
