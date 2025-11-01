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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedCredential, setSelectedCredential] = useState<{ id: string; title: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogMessage, setDialogMessage] = useState("")

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
        console.log("Stats data received:", statsData) // Debug log
        setStats(statsData)
      }

      // Load credentials
      const credentialsRes = await fetch("/api/v1/recipient/credentials?limit=10", fetchOptions)
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

  const handleShare = (credentialId: string, credentialTitle: string) => {
    setSelectedCredential({ id: credentialId, title: credentialTitle })
    setShareDialogOpen(true)
  }

  const handleSharePlatform = (platform: string) => {
    if (!selectedCredential) return
    
    const verifyUrl = `${window.location.origin}/verify/${selectedCredential.id}`
    const shareText = `Check out my verified credential: ${selectedCredential.title}`
    const shareUrlEncoded = encodeURIComponent(verifyUrl)
    const encodedText = encodeURIComponent(shareText)

    const urls: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${shareUrlEncoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${shareUrlEncoded}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
    setShareDialogOpen(false)
  }

  const handleCopyLink = async () => {
    if (!selectedCredential) return
    
    const verifyUrl = `${window.location.origin}/verify/${selectedCredential.id}`
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setDialogTitle("Link Copied!")
      setDialogMessage("The credential link has been copied to your clipboard.")
      setDialogOpen(true)
      setShareDialogOpen(false)
    } catch (error) {
      console.error("Failed to copy link:", error)
      setDialogTitle("Error")
      setDialogMessage("Failed to copy link to clipboard")
      setDialogOpen(true)
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Your Credentials</h3>
                <Link href="/dashboard/recipient/all">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    View All
                  </Button>
                </Link>
              </div>
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

      {/* Feedback Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Credential</DialogTitle>
            <DialogDescription>
              Share this verified credential on social media or copy the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Social Media Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSharePlatform('twitter')}
                className="w-full gap-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSharePlatform('linkedin')}
                className="w-full gap-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSharePlatform('facebook')}
                className="w-full gap-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSharePlatform('whatsapp')}
                className="w-full gap-2"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
            </div>

            {/* Copy Link Button */}
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

