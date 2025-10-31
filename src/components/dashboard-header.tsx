"use client"

import { LogOut, Settings, Bell } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { PrimaryButton } from "@/components/ui/primary-button"

interface DashboardHeaderProps {
  userRole: "admin" | "issuer" | "recipient"
  userName?: string
}

export function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const roleLabel = {
    admin: "CredVault Admin",
    issuer: "CredVault Issuer",
    recipient: "CredVault",
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
    <header className="fixed top-4 left-4 right-4 z-[9999] flex items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 md:px-6 py-3">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full size-8 w-8 h-8 object-contain"
          />
          <div className="hidden md:flex flex-col">
            <p className="text-sm font-semibold text-foreground">{roleLabel[userRole]}</p>
            {userName && <p className="text-xs text-muted-foreground">{userName}</p>}
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <PrimaryButton onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </PrimaryButton>
      </div>
    </header>
  )
}

