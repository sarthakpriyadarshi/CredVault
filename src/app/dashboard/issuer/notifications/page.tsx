"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { LoadingScreen } from "@/components/loading-screen"
import { Check, CheckCheck, Bell, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export default function IssuerNotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAsRead, setIsMarkingAsRead] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    }
  }, [status, router])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/v1/notifications?limit=100", {
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
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  const handleMarkAsRead = async (notificationId: string) => {
    setIsMarkingAsRead(notificationId)
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    } finally {
      setIsMarkingAsRead(null)
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
      router.push(notification.link)
    }
  }

  // Show loading state while session is being fetched
  if (status === "loading" || isLoading) {
    return <LoadingScreen message="Loading notifications..." />
  }

  // If unauthenticated, the useEffect will redirect, but show nothing while redirecting
  if (status === "unauthenticated") {
    return null
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader userRole="issuer" userName={session?.user?.name || undefined} />

        <div className="flex mt-4">
          <DashboardSidebar 
            userRole="issuer" 
            badgeCounts={{}}
          />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    Notifications
                  </h1>
                  <p className="text-muted-foreground">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                      : "All caught up!"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {unreadNotifications.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">Unread</h2>
                    <div className="space-y-2">
                      {unreadNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base font-semibold text-foreground">
                                  {notification.title}
                                </h3>
                                <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {notification.link && (
                                <Link
                                  href={notification.link}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 rounded hover:bg-muted transition-colors"
                                  title="View"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </Link>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification._id)
                                }}
                                disabled={isMarkingAsRead === notification._id}
                                className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {readNotifications.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">Read</h2>
                    <div className="space-y-2">
                      {readNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="p-4 bg-card/50 border border-border/50 rounded-lg hover:bg-card/70 transition-colors cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-foreground mb-2">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            {notification.link && (
                              <Link
                                href={notification.link}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded hover:bg-muted transition-colors"
                                title="View"
                              >
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {notifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

