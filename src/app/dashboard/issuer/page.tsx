"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Users, Upload, Plus } from "lucide-react"
import Link from "next/link"
import { LoadingScreen } from "@/components/loading-screen"

interface Template {
  id: string
  name: string
  issued: number
  created: string
}

interface Stats {
  templates: {
    total: number
    active: number
  }
  credentials: {
    total: number
    onBlockchain: number
  }
}

export default function IssuerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [skipRedirectCheck, setSkipRedirectCheck] = useState(false)

  // Check if this is a redirect from complete registration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('setup') === 'complete') {
        setSkipRedirectCheck(true)
      }
    }
  }, [])

  useEffect(() => {
    // Skip all checks if coming from complete registration
    if (skipRedirectCheck) {
      // Just load the page, show pending verification message
      // Don't try to load data for unverified users
      setLoading(false)
      return
    }

    // Only redirect if we're sure the user is not authenticated (not during loading)
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated") {
      // Only check role and verification after authentication is confirmed
      if (session?.user?.role !== "issuer") {
        router.push("/auth/issuer/login")
      } else if (session?.user?.role === "issuer" && !session.user?.organizationId) {
        // Redirect to completion page if organization not created (OAuth signup)
        router.push("/auth/issuer/complete")
      } else if (session?.user?.role === "issuer" && !session.user?.isVerified) {
        // Redirect to pending page if not verified
        router.push("/auth/issuer/login?pending=true")
      } else if (session?.user?.isVerified) {
        // Only load data if user is verified
        loadData()
      } else {
        // User is unverified - just show pending message
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, skipRedirectCheck])

  const loadData = async () => {
    setLoading(true)
    try {
      const fetchOptions: RequestInit = {
        credentials: "include",
      }

      // Load stats
      const statsRes = await fetch("/api/v1/issuer/stats", fetchOptions)
      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        console.error("Failed to fetch stats:", statsRes.statusText)
      } else {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Load templates
      const templatesRes = await fetch("/api/v1/issuer/templates?limit=3", fetchOptions)
      if (!templatesRes.ok) {
        if (templatesRes.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        console.error("Failed to fetch templates:", templatesRes.statusText)
      } else {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.data || templatesData || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while session is being fetched
  if (status === "loading") {
    return <LoadingScreen message="Loading session..." />
  }

  // If unauthenticated, the useEffect will redirect, but show nothing while redirecting
  if (status === "unauthenticated") {
    return null
  }

  // Only check role if we have a session (allow unverified issuers with skipRedirectCheck)
  if (status === "authenticated" && (!session || session.user?.role !== "issuer")) {
    return null
  }

  // If we reach here without a session, something is wrong
  if (!session) {
    return null
  }

  // Check if user is unverified
  const isUnverified = !session.user?.isVerified

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader userRole="issuer" userName={session?.user?.name || undefined} />

        {isUnverified && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <Card className="p-8 border border-yellow-500/20 bg-yellow-500/5 backdrop-blur">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">
                  Verification Pending
                </h2>
                <p className="text-zinc-300 mb-2">
                  Thank you for completing your registration! Your organization is currently under review.
                </p>
                <p className="text-zinc-400 text-sm">
                  You will receive an email notification once your account has been verified by an administrator.
                  This usually takes 24-48 hours.
                </p>
              </div>
            </Card>
          </div>
        )}

        {!isUnverified && (

        <div className="flex mt-4">
        <DashboardSidebar userRole="issuer" />

        <main className="flex-1 md:ml-80 p-4 md:p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Issuer Dashboard</h1>
              <p className="text-muted-foreground">Create and manage credential templates and issue certificates</p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <Link href="/dashboard/issuer/templates/create" className="space-y-4 block">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Create Template</h3>
                    <p className="text-sm text-muted-foreground">Design a new credential template with custom fields</p>
                  </div>
                </Link>
              </Card>

              <Card className="p-6 border border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <Link href="/dashboard/issuer/issue" className="space-y-4 block">
                  <div className="p-3 rounded-lg bg-secondary/10 w-fit group-hover:bg-secondary/20 transition-colors">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Issue Credential</h3>
                    <p className="text-sm text-muted-foreground">Issue a single credential to a recipient</p>
                  </div>
                </Link>
              </Card>

              <Card className="p-6 border border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <Link href="/dashboard/issuer/bulk-issuance" className="space-y-4 block">
                  <div className="p-3 rounded-lg bg-accent/10 w-fit group-hover:bg-accent/20 transition-colors">
                    <Upload className="h-6 w-6 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Bulk Issuance</h3>
                    <p className="text-sm text-muted-foreground">Upload CSV file to issue multiple credentials</p>
                  </div>
                </Link>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Templates</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats?.templates?.active || 0}
                  </p>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Credentials Issued</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats?.credentials?.total || 0}
                  </p>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">On Blockchain</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stats?.credentials?.onBlockchain || 0}
                  </p>
                </div>
              </Card>
            </div>

            {/* Templates List */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Templates</h3>
                <Link href="/dashboard/issuer/templates">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : templates.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No templates yet. Create your first template to get started.
                </div>
              ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.issued} issued • {template.created}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
              )}
            </Card>
          </div>
        </main>
        </div>

        )}
      </div>
    </div>
  )
}
