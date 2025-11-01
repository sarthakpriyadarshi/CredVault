"use client"

import { LogOut, Bell, Building2 } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  userRole: "admin" | "issuer" | "recipient"
  userName?: string
}

export function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  
  
  const roleLabel = {
    admin: "CredVault Admin",
    issuer: "CredVault Issuer",
    recipient: "CredVault",
  }

  // Fetch organization logo and name for issuers
  useEffect(() => {
    if (userRole === "issuer" && session?.user?.organizationId) {
      fetch("/api/v1/issuer/organization", {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
          return null
        })
        .then((data) => {
          if (data) {
            if (data.logo) {
              setOrganizationLogo(data.logo)
            }
            if (data.name) {
              setOrganizationName(data.name)
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching organization data:", error)
        })
    }
  }, [userRole, session?.user?.organizationId])

  const handleSignOut = () => {
    const callbackUrl = {
      admin: "/auth/admin/login",
      issuer: "/auth/issuer/login",
      recipient: "/auth/login",
    }[userRole]
    signOut({ callbackUrl })
  }

  const getSettingsUrl = () => {
    switch (userRole) {
      case "admin":
        return "/dashboard/admin/settings"
      case "issuer":
        return "/dashboard/issuer/settings"
      case "recipient":
        return "/dashboard/recipient/settings"
      default:
        return "/dashboard"
    }
  }

  // For issuers, show organization logo; for others, show user avatar
  const displayImage = userRole === "issuer" 
    ? (organizationLogo || null)
    : (session?.user?.image || null)
  const userEmail = session?.user?.email || ""

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
          <div className="hidden md:flex">
            <p className="text-lg font-semibold text-foreground">{roleLabel[userRole]}</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        
        <DropdownMenu
          trigger={
            <button className="p-0 rounded-full hover:opacity-80 transition-opacity cursor-pointer">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={userRole === "issuer" ? "Organization Logo" : "User Avatar"}
                  width={32}
                  height={32}
                  className="rounded-full w-8 h-8 object-cover border-2 border-border/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border/50">
                  {userRole === "issuer" ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
              )}
            </button>
          }
          align="right"
        >
          {(userEmail || (userRole === "issuer" && organizationName) || (userRole !== "issuer" && userName)) && (
            <>
              <div className="px-3 py-2 text-center">
                <span className="text-xs text-muted-foreground">Signed in as</span>
              </div>
              <div className="h-px bg-border/50 mx-1"></div>
              <div className="px-3 py-2 text-center">
                <div className="flex flex-col space-y-1 items-center">
                  {userRole === "issuer" && organizationName && (
                    <span className="text-sm font-medium text-foreground">{organizationName}</span>
                  )}
                  {userRole !== "issuer" && userName && (
                    <span className="text-sm font-medium text-foreground">{userName}</span>
                  )}
                  {userEmail && (
                    <span className="text-xs text-muted-foreground">{userEmail}</span>
                  )}
                </div>
              </div>
              <div className="h-px bg-border/50 mx-1"></div>
              <DropdownMenuItem onClick={() => router.push(getSettingsUrl())} className="flex justify-center text-center">
                <span className="text-sm text-foreground">Settings</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenu>

        <PrimaryButton onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </PrimaryButton>
      </div>
    </header>
  )
}

