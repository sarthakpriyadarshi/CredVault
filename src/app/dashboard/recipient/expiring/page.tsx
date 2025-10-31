"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Eye, Share2, Shield, Clock } from "lucide-react"

interface Credential {
  id: string
  title: string
  issuer: string
  date: string
  verified: boolean
  expiresAt?: string
}

interface Stats {
  total: number
  blockchainVerified: number
  aboutToExpire: number
}

export default function ExpiringCredentialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "recipient") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role === "recipient") {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const loadData = async () => {
    setLoading(true)
    try {
      const fetchOptions: RequestInit = {
        credentials: "include",
      }

      // Load stats
      const statsRes = await fetch("/api/v1/recipient/stats", fetchOptions)
      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          router.push("/auth/login")
          return
        }
        console.error("Failed to fetch stats:", statsRes.statusText)
      } else {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Load expiring credentials
      const credentialsRes = await fetch("/api/v1/recipient/credentials?filter=expiring&limit=100", fetchOptions)
      if (!credentialsRes.ok) {
        if (credentialsRes.status === 401) {
          router.push("/auth/login")
          return
        }
        console.error("Failed to fetch credentials:", credentialsRes.statusText)
      } else {
        const credentialsData = await credentialsRes.json()
        setCredentials(credentialsData.data || credentialsData || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    )
  }

  if (status === "unauthenticated" || (status === "authenticated" && (!session || session.user?.role !== "recipient"))) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader userRole="recipient" userName={session.user?.name || undefined} />

        <div className="flex mt-4">
        <DashboardSidebar 
          userRole="recipient" 
          badgeCounts={{
            expiringCredentials: stats?.aboutToExpire,
          }}
        />

        <main className="flex-1 md:ml-80 p-4 md:p-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">About to Expire</h1>
              <p className="text-muted-foreground">Credentials expiring within the next 30 days</p>
            </div>

            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-foreground mb-4">Expiring Credentials</h3>
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : credentials.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No credentials expiring soon. All your credentials are valid!
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map((credential) => {
                    const daysLeft = getDaysUntilExpiry(credential.expiresAt)
                    return (
                      <div
                        key={credential.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group border border-destructive/30 hover:border-destructive/60"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{credential.title}</p>
                            {credential.verified && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                                <Shield className="h-3 w-3" />
                                Verified
                              </div>
                            )}
                            {daysLeft !== null && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
                                <Clock className="h-3 w-3" />
                                {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{credential.issuer}</p>
                          <p className="text-xs text-muted-foreground/70">{credential.date}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap md:flex-nowrap">
                          <Link href={`/dashboard/recipient/credentials/${credential.id}/verify`}>
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                              <Eye className="h-4 w-4" />
                              <span className="hidden md:inline">Verify</span>
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <Share2 className="h-4 w-4" />
                            <span className="hidden md:inline">Share</span>
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] gap-2"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline">Download</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </main>
        </div>
      </div>
    </div>
  )
}

