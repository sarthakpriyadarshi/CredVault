"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, FileText, Download, Calendar } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AnalyticsData {
  metrics: {
    totalCredentials: { value: number; growth: number }
    totalOrganizations: { value: number; growth: number }
    verifiedCredentials: { value: number; growth: number }
    avgVerificationTime: { value: string; growth: number }
  }
  chartData: Array<{
    month: string
    credentials: number
    verified: number
    organizations: number
  }>
  credentialTypes: Array<{
    name: string
    value: number
  }>
  topIssuers: Array<{
    name: string
    credentials: number
    verified: string
  }>
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role === "admin") {
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

      const res = await fetch("/api/v1/admin/analytics", fetchOptions)
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        console.error("Failed to fetch analytics:", res.statusText)
      } else {
        const data = await res.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    )
  }

  if (status === "unauthenticated" || (status === "authenticated" && (!session || session.user?.role !== "admin"))) {
    return null
  }

  const COLORS = ["#db2777", "#a855f7", "#10b981", "#ef4444"]

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader userRole="admin" userName={session.user?.name || undefined} />

        <div className="flex mt-4">
          <DashboardSidebar
            userRole="admin"
            badgeCounts={{
              organizations: analyticsData?.metrics.totalOrganizations.value,
              verificationRequests: undefined,
            }}
          />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
                  <p className="text-muted-foreground">Track system performance and credential metrics</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Calendar className="h-4 w-4" />
                    Last 6 Months
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Total Credentials
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analyticsData?.metrics.totalCredentials.value.toLocaleString() || 0}
                    </p>
                    {analyticsData && (
                      <p
                        className={`text-xs flex items-center gap-1 ${
                          analyticsData.metrics.totalCredentials.growth >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {analyticsData.metrics.totalCredentials.growth >= 0 ? "+" : ""}
                        {analyticsData.metrics.totalCredentials.growth}% this month
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Total Organizations
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analyticsData?.metrics.totalOrganizations.value.toLocaleString() || 0}
                    </p>
                    {analyticsData && (
                      <p
                        className={`text-xs flex items-center gap-1 ${
                          analyticsData.metrics.totalOrganizations.growth >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {analyticsData.metrics.totalOrganizations.growth >= 0 ? "+" : ""}
                        {analyticsData.metrics.totalOrganizations.growth}% this month
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Verified Credentials
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analyticsData?.metrics.verifiedCredentials.value.toLocaleString() || 0}
                    </p>
                    {analyticsData && (
                      <p
                        className={`text-xs flex items-center gap-1 ${
                          analyticsData.metrics.verifiedCredentials.growth >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {analyticsData.metrics.verifiedCredentials.growth >= 0 ? "+" : ""}
                        {analyticsData.metrics.verifiedCredentials.growth}% this month
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Avg Verification Time
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analyticsData?.metrics.avgVerificationTime.value || "2.5h"}
                    </p>
                    {analyticsData && (
                      <p
                        className={`text-xs flex items-center gap-1 ${
                          analyticsData.metrics.avgVerificationTime.growth >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {analyticsData.metrics.avgVerificationTime.growth >= 0 ? "+" : ""}
                        {analyticsData.metrics.avgVerificationTime.growth}% vs last month
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credentials Trend Chart */}
                <Card className="lg:col-span-2 p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Credentials Issued Trend</h3>
                  {loading || !analyticsData ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.chartData} style={{ color: "#ffffff" }}>
                        <defs>
                          <linearGradient id="colorCredentials" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#db2777" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} dataKey="month" />
                        <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          labelStyle={{ color: "#ffffff" }}
                          itemStyle={{ color: "#ffffff" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="credentials"
                          stroke="#db2777"
                          fillOpacity={1}
                          fill="url(#colorCredentials)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                {/* Credential Types Pie Chart */}
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Credential Types</h3>
                  {loading || !analyticsData ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.credentialTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} ${value}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.credentialTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          labelStyle={{ color: "#ffffff" }}
                          itemStyle={{ color: "#ffffff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* Verification and Organizations Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Verification Status</h3>
                  {loading || !analyticsData ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.chartData} style={{ color: "#ffffff" }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} dataKey="month" />
                        <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          labelStyle={{ color: "#ffffff" }}
                          itemStyle={{ color: "#ffffff" }}
                        />
                        <Legend wrapperStyle={{ color: "#ffffff" }} />
                        <Bar dataKey="verified" fill="#db2777" name="Verified" />
                        <Bar dataKey="credentials" fill="#a855f7" name="Total" opacity={0.6} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Organization Growth</h3>
                  {loading || !analyticsData ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.chartData} style={{ color: "#ffffff" }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} dataKey="month" />
                        <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            border: "1px solid #3f3f46",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          labelStyle={{ color: "#ffffff" }}
                          itemStyle={{ color: "#ffffff" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="organizations"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name="Organizations"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* Top Issuers */}
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Issuers</h3>
                {loading ? (
                  <div className="text-muted-foreground text-sm">Loading...</div>
                ) : analyticsData && analyticsData.topIssuers.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.topIssuers.map((issuer, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{issuer.name}</p>
                          <p className="text-sm text-muted-foreground">{issuer.credentials} credentials issued</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{issuer.verified}</p>
                          <p className="text-xs text-emerald-500">verified</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No issuers data available</div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

