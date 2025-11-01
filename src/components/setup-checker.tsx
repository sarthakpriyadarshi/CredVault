"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function SetupChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
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
          router.push("/setup")
        }
      } catch (error) {
        console.error("Error checking setup:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkSetup()
  }, [pathname, router])

  // Show loading while checking (only for a brief moment)
  if (isChecking && !setupNeeded) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // If setup is needed and we're redirecting, show nothing
  if (setupNeeded && pathname !== "/setup") {
    return null
  }

  return <>{children}</>
}
