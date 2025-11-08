"use client"

import { LogOut, Bell, Building2, Check } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { formatDistanceToNow } from "date-fns"

interface DashboardHeaderProps {
  userRole: "admin" | "issuer" | "recipient"
  userName?: string
}

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export function DashboardHeader({ userRole, userName }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  
  
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

  // Fetch user avatar if not in session (for base64 images)
  useEffect(() => {
    // Only fetch if image is missing from session and user is not issuer
    if (userRole !== "issuer" && session?.user?.id && !session?.user?.image) {
      let cancelled = false
      
      fetch("/api/v1/user/profile", {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            return res.json()
          }
          return null
        })
        .then((data) => {
          if (!cancelled && data?.image) {
            setUserAvatar(data.image)
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error("Error fetching user image:", error)
          }
        })
      
      return () => {
        cancelled = true
      }
    }
  }, [userRole, session?.user?.id, session?.user?.image])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoadingNotifications(true)
    try {
      const response = await fetch("/api/v1/notifications?limit=10", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id, fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      })
      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/v1/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      })
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id)
    }
    if (notification.link) {
      // Close popover first to ensure it unmounts before navigation
      setIsNotificationOpen(false)
      // Use setTimeout to ensure popover unmounts before navigation
      setTimeout(() => {
        router.push(notification.link!)
      }, 150)
    }
  }

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
    : (session?.user?.image || userAvatar || null)
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
        {/* Popover state is controlled by isNotificationOpen - when set to false, it unmounts */}
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoadingNotifications ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification._id)
                            }}
                            className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="border-t border-border p-2 text-center">
                <Link
                  href={
                    userRole === "admin"
                      ? "/dashboard/admin/notifications"
                      : userRole === "issuer"
                      ? "/dashboard/issuer/notifications"
                      : "/dashboard/recipient/notifications"
                  }
                  onClick={(e) => {
                    e.preventDefault()
                    setIsNotificationOpen(false)
                    // Use setTimeout to ensure popover unmounts before navigation
                    // This applies to all roles: admin, issuer, and recipient
                    setTimeout(() => {
                      router.push(
                        userRole === "admin"
                          ? "/dashboard/admin/notifications"
                          : userRole === "issuer"
                          ? "/dashboard/issuer/notifications"
                          : "/dashboard/recipient/notifications"
                      )
                    }, 150)
                  }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </PopoverContent>
        </Popover>
        
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

