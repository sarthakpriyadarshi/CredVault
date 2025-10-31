"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BarChart3, Users, FileText, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const chartData = [
  { month: "Jan", organizations: 45, credentials: 320 },
  { month: "Feb", organizations: 52, credentials: 420 },
  { month: "Mar", organizations: 48, credentials: 380 },
  { month: "Apr", organizations: 61, credentials: 550 },
  { month: "May", organizations: 55, credentials: 480 },
  { month: "Jun", organizations: 67, credentials: 620 },
]

interface Organization {
  id: string
  name: string
  description?: string
  website?: string
  verificationStatus: "pending" | "approved" | "rejected"
  createdAt: string
  issuerCount: number
  issuers: Array<{
    id: string
    name: string
    email: string
    createdAt: string
  }>
}

interface Stats {
  users: {
    total: number
    recipients: number
    issuers: number
    admins: number
    recent: number
  }
  organizations: {
    total: number
    pending: number
    approved: number
    rejected: number
    recent: number
  }
  credentials: {
    total: number
    onBlockchain: number
    recent: number
  }
  templates: {
    total: number
    active: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [processingOrg, setProcessingOrg] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (not during loading)
    if (status === "unauthenticated") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      // Only check role after authentication is confirmed
      router.push("/auth/admin/login")
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const loadData = async () => {
    setLoading(true)
    try {
      // Use NextAuth session cookies (automatically sent)
      const fetchOptions: RequestInit = {
        credentials: "include",
      }

      // Load pending organizations
      const pendingRes = await fetch("/api/v1/admin/organizations/pending", fetchOptions)
      if (!pendingRes.ok) {
        if (pendingRes.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        console.error("Failed to fetch pending organizations:", pendingRes.statusText)
        setOrganizations([])
      } else {
        const pendingData = await pendingRes.json()
        setOrganizations(pendingData.data || pendingData || [])
      }

      // Load stats
      const statsRes = await fetch("/api/v1/admin/stats", fetchOptions)
      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        console.error("Failed to fetch stats:", statsRes.statusText)
      } else {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (orgId: string) => {
    if (!confirm("Are you sure you want to approve this organization?")) return

    setProcessingOrg(orgId)
    try {
      const res = await fetch(`/api/v1/admin/organizations/${orgId}/approve`, {
        method: "POST",
        credentials: "include",
      })

      if (res.ok) {
        await loadData()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to approve organization")
      }
    } catch (error) {
      console.error("Error approving organization:", error)
      alert("An error occurred while approving the organization")
    } finally {
      setProcessingOrg(null)
    }
  }

  const handleReject = async (orgId: string) => {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    setProcessingOrg(orgId)
    try {
      const res = await fetch(`/api/v1/admin/organizations/${orgId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (res.ok) {
        await loadData()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to reject organization")
      }
    } catch (error) {
      console.error("Error rejecting organization:", error)
      alert("An error occurred while rejecting the organization")
    } finally {
      setProcessingOrg(null)
    }
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
  if (status === "authenticated" && (!session || session.user?.role !== "admin")) {
    return null
  }

  // If we reach here without a session, something is wrong
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <DashboardHeader userRole="admin" userName={session.user?.name || undefined} />

      <div className="flex">
        <DashboardSidebar userRole="admin" />

        <main className="flex-1 md:ml-80 p-4 md:p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage organizations, verify requests, and monitor system activity
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Organizations</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.organizations?.total || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pending Verification</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.organizations?.pending || organizations.length || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <FileText className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Credentials</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.credentials?.total || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <CheckCircle className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Active Issuers</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.users?.issuers || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/10">
                    <BarChart3 className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold text-foreground mb-4">Growth Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis stroke="hsl(var(--muted-foreground))" dataKey="month" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="organizations"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="credentials"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis stroke="hsl(var(--muted-foreground))" dataKey="month" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="organizations" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Verification Requests</h3>
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading...</div>
              ) : organizations.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No pending verification requests. All organizations have been reviewed.
                </div>
              ) : (
                <div className="space-y-3">
                  {organizations.slice(0, 4).map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to detailed view if needed
                          }}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]"
                          onClick={() => handleApprove(org.id)}
                          disabled={processingOrg === org.id}
                        >
                          {processingOrg === org.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(org.id)}
                          disabled={processingOrg === org.id}
                        >
                          {processingOrg === org.id ? "Processing..." : "Reject"}
                        </Button>
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
  )
}
