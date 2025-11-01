"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BarChart3, Users, FileText, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { LoadingScreen } from "@/components/loading-screen"

interface ChartData {
  month: string
  organizations: number
  credentials: number
}

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
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [error, setError] = useState<string | null>(null)

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

      // Load chart data
      const chartRes = await fetch("/api/v1/admin/chart-data", fetchOptions)
      if (!chartRes.ok) {
        if (chartRes.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        console.error("Failed to fetch chart data:", chartRes.statusText)
      } else {
        const chartDataResponse = await chartRes.json()
        setChartData(chartDataResponse || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (orgId: string) => {
    setPendingOrgId(orgId)
    setShowApproveModal(true)
  }

  const handleApprove = async () => {
    if (!pendingOrgId) return

    setProcessingOrg(pendingOrgId)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/organizations/${pendingOrgId}/approve`, {
        method: "POST",
        credentials: "include",
      })

      if (res.ok) {
        setShowApproveModal(false)
        setPendingOrgId(null)
        await loadData()
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Failed to approve organization")
      }
    } catch (error) {
      console.error("Error approving organization:", error)
      setError("An error occurred while approving the organization")
    } finally {
      setProcessingOrg(null)
    }
  }

  const handleRejectClick = (orgId: string) => {
    setPendingOrgId(orgId)
    setRejectReason("")
    setError(null)
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!pendingOrgId || !rejectReason.trim()) {
      setError("Please provide a reason for rejection")
      return
    }

    setProcessingOrg(pendingOrgId)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/organizations/${pendingOrgId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })

      if (res.ok) {
        setShowRejectModal(false)
        setPendingOrgId(null)
        setRejectReason("")
        await loadData()
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Failed to reject organization")
      }
    } catch (error) {
      console.error("Error rejecting organization:", error)
      setError("An error occurred while rejecting the organization")
    } finally {
      setProcessingOrg(null)
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

  // Only check role if we have a session
  if (status === "authenticated" && (!session || session.user?.role !== "admin")) {
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
        <DashboardHeader userRole="admin" userName={session?.user?.name || undefined} />

        <div className="flex mt-4">
        <DashboardSidebar 
          userRole="admin" 
          badgeCounts={{
            organizations: stats?.organizations?.total,
            verificationRequests: stats?.organizations?.pending,
          }}
        />

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
                {loading || chartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {loading ? "Loading chart data..." : "No data available"}
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} style={{ color: "#ffffff" }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis 
                      stroke="#a1a1aa" 
                      dataKey="month"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#a1a1aa"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                      }}
                      itemStyle={{
                        color: "#ffffff",
                      }}
                      cursor={{ stroke: "#3f3f46" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="organizations"
                      stroke="#db2777"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#db2777" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="credentials"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#a855f7" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Activity</h3>
                {loading || chartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {loading ? "Loading chart data..." : "No data available"}
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} style={{ color: "#ffffff" }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis 
                      stroke="#a1a1aa" 
                      dataKey="month"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#a1a1aa"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                      }}
                      itemStyle={{
                        color: "#ffffff",
                      }}
                      cursor={{ fill: "rgba(219, 39, 119, 0.1)" }}
                    />
                    <Bar dataKey="organizations" fill="#db2777" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                )}
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
                          onClick={() => handleApproveClick(org.id)}
                          disabled={processingOrg === org.id}
                        >
                          {processingOrg === org.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleRejectClick(org.id)}
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

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={(open) => {
        setShowApproveModal(open)
        if (!open) {
          setPendingOrgId(null)
          setError(null)
        }
      }}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Approve Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this organization? This action will verify the organization and allow them to issue credentials.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false)
                setPendingOrgId(null)
                setError(null)
              }}
              disabled={processingOrg !== null}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]"
              onClick={handleApprove}
              disabled={processingOrg !== null}
            >
              {processingOrg ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={(open) => {
        setShowRejectModal(open)
        if (!open) {
          setPendingOrgId(null)
          setRejectReason("")
          setError(null)
        }
      }}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Reject Organization</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this organization. This reason will be communicated to the organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for Rejection *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="min-h-[100px] bg-background/50"
                disabled={processingOrg !== null}
              />
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false)
                setPendingOrgId(null)
                setRejectReason("")
                setError(null)
              }}
              disabled={processingOrg !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingOrg !== null || !rejectReason.trim()}
            >
              {processingOrg ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
