"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Eye, Share2, CheckCircle, Clock, Shield } from "lucide-react"

interface Credential {
  id: string
  title: string
  issuer: string
  date: string
  verified: boolean
  certificateUrl?: string
  badgeUrl?: string
  type?: "certificate" | "badge" | "both"
}

interface Stats {
  total: number
  blockchainVerified: number
  aboutToExpire: number
}

export default function RecipientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (not during loading)
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "recipient") {
      // Only check role after authentication is confirmed
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

      // Load credentials
      const credentialsRes = await fetch("/api/v1/recipient/credentials?limit=20", fetchOptions)
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

  const handleShare = async (credentialId: string, credentialTitle: string) => {
    const verifyUrl = `${window.location.origin}/verify/${credentialId}`
    const shareText = `Check out my credential: ${credentialTitle}`

    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: credentialTitle,
          text: shareText,
          url: verifyUrl,
        })
        return
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(verifyUrl)
      alert("Verification link copied to clipboard!")
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        // Try fallback to clipboard if Web Share failed
        try {
          await navigator.clipboard.writeText(verifyUrl)
          alert("Verification link copied to clipboard!")
        } catch (clipboardError) {
          console.error("Failed to copy to clipboard:", clipboardError)
          alert("Failed to share. Please copy the link manually.")
        }
      }
    }
  }

  const handleDownload = (credential: Credential) => {
    // Prioritize certificate, fallback to badge
    const url = credential.certificateUrl || credential.badgeUrl
    if (!url) {
      alert("No certificate or badge available for download")
      return
    }

    // Check if it's a base64 data URL
    if (url.startsWith("data:")) {
      // Create a temporary link element and trigger download
      const link = document.createElement("a")
      link.href = url
      const filename = credential.certificateUrl
        ? `${credential.title.replace(/\s+/g, "_")}_certificate.png`
        : `${credential.title.replace(/\s+/g, "_")}_badge.png`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For regular URLs, open in new tab
      window.open(url, "_blank")
    }
  }

  const handleVerify = (credentialId: string) => {
    // Navigate to verify page
    router.push(`/dashboard/recipient/credentials/${credentialId}/verify`)
  }

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    )
  }

  // If unauthenticated, the useEffect will redirect, but show nothing while redirecting
  if (status === "unauthenticated") {
    return null
  }

  // Only check role if we have a session
  if (status === "authenticated" && (!session || session.user?.role !== "recipient")) {
    return null
  }

  // If we reach here without a session, something is wrong
  if (!session) {
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
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">My Credentials</h1>
              <p className="text-muted-foreground">View and manage your certificates and badges</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Credentials</p>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? "..." : stats?.total || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Blockchain Verified</p>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? "..." : stats?.blockchainVerified || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Shield className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">About to Expire</p>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? "..." : stats?.aboutToExpire || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <Clock className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Credentials List */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Credentials</h3>
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : credentials.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No credentials yet. You&apos;ll see credentials here once they&apos;re issued to you.
                </div>
              ) : (
              <div className="space-y-3">
                {credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group border border-border/30 hover:border-border/60"
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
                      </div>
                      <p className="text-sm text-muted-foreground">{credential.issuer}</p>
                      <p className="text-xs text-muted-foreground/70">{credential.date}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap md:flex-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => handleVerify(credential.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden md:inline">Verify</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => handleShare(credential.id, credential.title)}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden md:inline">Share</span>
                      </Button>
                      {(credential.certificateUrl || credential.badgeUrl) ? (
                        <Button
                          size="sm"
                          className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] gap-2"
                          onClick={() => handleDownload(credential)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden md:inline">Download</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] gap-2"
                          disabled
                          title="No certificate or badge available"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden md:inline">Download</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
