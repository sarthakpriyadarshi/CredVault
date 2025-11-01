"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, BarChart3, Settings, HelpCircle, ChevronDown, ShieldCheck, UploadCloud } from "lucide-react"
import { useState } from "react"

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  subItems?: SidebarItem[]
}

interface DashboardSidebarProps {
  userRole: "admin" | "issuer" | "recipient"
  badgeCounts?: {
    organizations?: number
    verificationRequests?: number
    expiringCredentials?: number
  }
}

export function DashboardSidebar({ userRole, badgeCounts }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const adminItems: SidebarItem[] = [
    {
      label: "Overview",
      href: "/dashboard/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Organizations",
      href: "/dashboard/admin/organizations",
      icon: <Users className="h-5 w-5" />,
      badge: badgeCounts?.organizations,
    },
    {
      label: "Verification Requests",
      href: "/dashboard/admin/verification",
      icon: <FileText className="h-5 w-5" />,
      badge: badgeCounts?.verificationRequests,
    },
    {
      label: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const issuerItems: SidebarItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard/issuer",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Manage Credentials",
      href: "/dashboard/issuer/credentials",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      label: "Templates",
      href: "/dashboard/issuer/templates",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Create Template",
      href: "/dashboard/issuer/templates/create",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Issue Credentials",
      href: "/dashboard/issuer/issue",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Bulk Issuance",
      href: "/dashboard/issuer/bulk-issuance",
      icon: <UploadCloud className="h-5 w-5" />,
    },
    {
      label: "Analytics",
      href: "/dashboard/issuer/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/dashboard/issuer/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const recipientItems: SidebarItem[] = [
    {
      label: "My Credentials",
      href: "/dashboard/recipient",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "All Credentials",
      href: "/dashboard/recipient/all",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Blockchain Verified",
      href: "/dashboard/recipient/blockchain",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "About to Expire",
      href: "/dashboard/recipient/expiring",
      icon: <BarChart3 className="h-5 w-5" />,
      badge: badgeCounts?.expiringCredentials,
    },
    {
      label: "Settings",
      href: "/dashboard/recipient/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const items = {
    admin: adminItems,
    issuer: issuerItems,
    recipient: recipientItems,
  }[userRole]

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const isActive = (href: string) => {
    // Exact match
    if (pathname === href) {
      return true
    }
    // For base dashboard routes (e.g., /dashboard/admin), only match exact path
    const isBaseDashboardRoute = href.match(/^\/dashboard\/(admin|issuer|recipient)$/)
    if (isBaseDashboardRoute) {
      return false
    }
    // For sub-routes, only match if pathname starts with href + "/" 
    // AND there's no more specific menu item that would match better
    if (pathname.startsWith(href + "/")) {
      // Check if there's a more specific menu item that matches the current pathname
      const moreSpecificItem = items.find((item) => {
        return item.href !== href && pathname.startsWith(item.href) && item.href.length > href.length
      })
      // Only return true if there's no more specific item that matches
      return !moreSpecificItem
    }
    return false
  }

  return (
    <aside className="hidden md:flex fixed left-4 top-24 h-[calc(100vh-120px)] w-64 flex-col rounded-2xl bg-card border border-border/50 shadow-lg overflow-y-auto">
      <nav className="flex-1 p-6 space-y-1">
        {items.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={(e) => {
                if (item.subItems) {
                  e.preventDefault()
                  toggleExpanded(item.label)
                }
              }}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.subItems && (
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", expandedItems.includes(item.label) && "rotate-180")}
                  />
                )}
              </div>
            </Link>

            {item.subItems && expandedItems.includes(item.label) && (
              <div className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-4">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive(subItem.href)
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                    )}
                  >
                    {subItem.icon}
                    <span>{subItem.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-border/50 p-6">
        <Link
          href="#help"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="font-medium text-sm">Help & Support</span>
        </Link>
      </div>
    </aside>
  )
}

