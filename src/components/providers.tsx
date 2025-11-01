"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={30 * 60} // Refetch session every 30 minutes (instead of 5)
      refetchOnWindowFocus={false} // Disable refetch on window focus to reduce API calls
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  )
}

