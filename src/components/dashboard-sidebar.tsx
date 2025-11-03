"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, BarChart3, Settings, HelpCircle, ChevronDown, UploadCloud, Layers, PenTool, Award, Blocks, Clock, FolderOpen, Building2, CheckCircle, TrendingUp, Bell } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

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
      icon: <Building2 className="h-5 w-5" />,
      badge: badgeCounts?.organizations,
    },
    {
      label: "Verification Requests",
      href: "/dashboard/admin/verification",
      icon: <CheckCircle className="h-5 w-5" />,
      badge: badgeCounts?.verificationRequests,
    },
    {
      label: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: "Notifications",
      href: "/dashboard/admin/notifications",
      icon: <Bell className="h-5 w-5" />,
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
      icon: <Award className="h-5 w-5" />,
    },
    {
      label: "Templates",
      href: "/dashboard/issuer/templates",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      label: "Create Template",
      href: "/dashboard/issuer/templates/create",
      icon: <PenTool className="h-5 w-5" />,
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
      label: "Notifications",
      href: "/dashboard/issuer/notifications",
      icon: <Bell className="h-5 w-5" />,
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
      icon: <Award className="h-5 w-5" />,
    },
    {
      label: "All Credentials",
      href: "/dashboard/recipient/all",
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      label: "Blockchain Verified",
      href: "/dashboard/recipient/blockchain",
      icon: <Blocks className="h-5 w-5" />,
    },
    {
      label: "About to Expire",
      href: "/dashboard/recipient/expiring",
      icon: <Clock className="h-5 w-5" />,
      badge: badgeCounts?.expiringCredentials,
    },
    {
      label: "Notifications",
      href: "/dashboard/recipient/notifications",
      icon: <Bell className="h-5 w-5" />,
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

  // Get active index for mobile sidebar animation
  const getActiveIndex = () => {
    return items.findIndex((item) => isActive(item.href))
  }

  return (
    <>
      {/* Desktop Sidebar */}
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

      {/* Mobile Sidebar - Horizontal at Bottom */}
      <div className="md:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1rem)] px-2">
        <div className="bg-card border border-border/50 rounded-3xl sm:rounded-4xl p-1.5 sm:p-2 flex gap-1 sm:gap-2 relative shadow-lg">
          {/* Animated background indicator - horizontal pill */}
          <motion.div
            layoutId="activeTabIndicatorMobile"
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="absolute bg-primary/20 border-2 border-primary/50 rounded-3xl sm:rounded-4xl shadow-lg"
            style={{
              left: `calc(${getActiveIndex()} * (${items.length > 6 ? '2.5rem' : '3rem'} + ${items.length > 6 ? '0.25rem' : '0.25rem'}) + 0.375rem)`,
              top: '0.375rem',
              bottom: '0.375rem',
              width: items.length > 6 ? '2.5rem' : '3rem',
              opacity: getActiveIndex() === -1 ? 0 : 1,
            }}
          />

          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative z-10 flex items-center justify-center transition-all duration-300 shrink-0",
                items.length > 6 ? "w-10 h-10 sm:w-12 sm:h-12" : "w-12 h-12 sm:w-14 sm:h-14",
                isActive(item.href)
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                animate={{ scale: isActive(item.href) ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className={cn(items.length > 6 ? "scale-90" : "")}>
                  {item.icon}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1 py-0.5 text-[9px] font-bold leading-none text-destructive bg-destructive/20 rounded-full min-w-3.5">
                    {item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          ))}

          <div className="border-l border-border/50 mx-0.5 sm:mx-1 h-8 sm:h-10 self-center shrink-0"></div>

          <Link
            href="#help"
            className={cn(
              "relative z-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-300 shrink-0",
              items.length > 6 ? "w-10 h-10 sm:w-12 sm:h-12" : "w-12 h-12 sm:w-14 sm:h-14"
            )}
          >
            <motion.div
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <HelpCircle className={cn(items.length > 6 ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5")} />
            </motion.div>
          </Link>
        </div>
      </div>
    </>
  )
}

