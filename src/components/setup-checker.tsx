"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

export function SetupChecker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(pathname !== "/setup")
  const [setupNeeded, setSetupNeeded] = useState(false)

  useEffect(() => {
    // Don't check if already on setup page
    if (pathname === "/setup") {
      return
    }

    const checkSetup = async () => {
      try {
        const res = await fetch("/api/v1/admin/setup")
        const data = await res.json()

        if (data.setupNeeded) {
          setSetupNeeded(true)
          // Use replace instead of push to avoid adding to history
          // Use window.location for immediate navigation to ensure page loads
          window.location.href = "/setup"
        } else {
          setIsChecking(false)
        }
      } catch (error) {
        console.error("Error checking setup:", error)
        setIsChecking(false)
      }
    }

    checkSetup()
  }, [pathname])

  // Show loading while checking or during redirect
  if (isChecking || (setupNeeded && pathname !== "/setup")) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
