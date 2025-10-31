"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Settings, Bell } from "lucide-react"
import { signOut } from "next-auth/react"

interface DashboardHeaderProps {
  userRole: "admin" | "issuer" | "recipient"
  userName?: string
}

export function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const roleLabel = {
    admin: "Admin Dashboard",
    issuer: "Issuer Dashboard",
    recipient: "Recipient Dashboard",
  }

  const handleSignOut = () => {
    const callbackUrl = {
      admin: "/auth/admin/login",
      issuer: "/auth/issuer/login",
      recipient: "/auth/login",
    }[userRole]
    signOut({ callbackUrl })
  }

  return (
    <header className="sticky top-4 z-[9999] mx-4 md:mx-6 flex items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 md:px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <div className="hidden md:flex flex-col">
            <p className="text-sm font-semibold text-foreground">{roleLabel[userRole]}</p>
            {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}

