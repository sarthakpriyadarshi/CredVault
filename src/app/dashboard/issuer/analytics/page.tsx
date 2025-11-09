"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  FileText,
  Users,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PrimaryButton } from "@/components/ui/primary-button";

export default function IssuerAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  interface AnalyticsData {
    totalIssued?: number;
    activeRecipients?: number;
    revoked?: number;
    avgTime?: string;
    topTemplates?: Array<{
      name: string;
      issued: number;
      active?: boolean;
      [key: string]: unknown;
    }>;
    trend?: Array<{
      month: string;
      issued: number;
      recipients: number;
      revoked: number;
    }>;
    [key: string]: unknown;
  }
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login");
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role === "issuer" &&
      !session.user?.isVerified
    ) {
      router.push("/auth/issuer/login?pending=true");
    } else if (
      status === "authenticated" &&
      session?.user?.role === "issuer" &&
      session.user?.isVerified
    ) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/issuer/analytics", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login");
          return;
        }
        console.error("Failed to fetch analytics");
      } else {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) {
      console.error("No analytics data to export");
      return;
    }

    try {
      const csvRows: string[] = [];

      // Summary Section
      csvRows.push("ANALYTICS SUMMARY");
      csvRows.push("");
      csvRows.push("Metric,Value");
      csvRows.push(`Total Issued,${analytics.totalIssued || 0}`);
      csvRows.push(`Active Recipients,${analytics.activeRecipients || 0}`);
      csvRows.push(`Revoked Credentials,${analytics.revoked || 0}`);
      csvRows.push(`Average Issuance Time,${analytics.avgTime || "N/A"}`);
      csvRows.push("");
      csvRows.push("");

      // Monthly Trend Section
      const trendData = analytics.trend || [];
      if (trendData.length > 0) {
        csvRows.push("MONTHLY TREND");
        csvRows.push("");
        csvRows.push("Month,Issued,Recipients,Revoked");
        trendData.forEach((item) => {
          csvRows.push(
            `${item.month || ""},${item.issued || 0},${item.recipients || 0},${
              item.revoked || 0
            }`
          );
        });
        csvRows.push("");
        csvRows.push("");
      }

      // Top Templates Section
      const topTemplates = analytics.topTemplates || [];
      if (topTemplates.length > 0) {
        csvRows.push("TOP TEMPLATES");
        csvRows.push("");
        csvRows.push("Template Name,Issued,Status");
        topTemplates.forEach((template) => {
          const status = template.active !== false ? "Active" : "Archived";
          const name = template.name || "Unknown";
          const issued = template.issued || 0;
          // Escape commas and quotes in CSV values
          const escapedName =
            name.includes(",") || name.includes('"')
              ? `"${name.replace(/"/g, '""')}"`
              : name;
          csvRows.push(`${escapedName},${issued},${status}`);
        });
      }

      const csv = csvRows.join("\n");

      // Create download
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
      );
      const timestamp = new Date().toISOString().split("T")[0];
      element.setAttribute("download", `analytics_report_${timestamp}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Error exporting analytics:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    );
  }

  if (
    status === "unauthenticated" ||
    (status === "authenticated" &&
      (!session || session.user?.role !== "issuer"))
  ) {
    return null;
  }

  const chartData = analytics?.trend || [];

  const mockData = [
    { month: "Jan", issued: 120, recipients: 45, revoked: 2 },
    { month: "Feb", issued: 145, recipients: 52, revoked: 1 },
    { month: "Mar", issued: 130, recipients: 48, revoked: 3 },
    { month: "Apr", issued: 180, recipients: 61, revoked: 2 },
    { month: "May", issued: 165, recipients: 55, revoked: 1 },
    { month: "Jun", issued: 210, recipients: 67, revoked: 2 },
  ];

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader
          userRole="issuer"
          userName={session?.user?.name || undefined}
        />

        <div className="flex mt-4">
          <DashboardSidebar userRole="issuer" />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Analytics
                  </h1>
                  <p className="text-muted-foreground">
                    Track your credential issuance and performance
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <Calendar className="h-4 w-4" />
                    Last 6 Months
                  </Button>
                  <PrimaryButton className="gap-2" onClick={exportAnalytics}>
                    <Download className="h-4 w-4" />
                    Export
                  </PrimaryButton>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Total Issued
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analytics?.totalIssued || 0}
                    </p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +18% this month
                    </p>
                  </div>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Active Recipients
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analytics?.activeRecipients || 0}
                    </p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12% this month
                    </p>
                  </div>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Avg Issuance Time
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analytics?.avgTime || "45s"}
                    </p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      -8% vs last month
                    </p>
                  </div>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Revoked Credentials
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? "..." : analytics?.revoked || 0}
                    </p>
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +2 this month
                    </p>
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Issuance Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={chartData.length > 0 ? chartData : mockData}
                    >
                      <defs>
                        <linearGradient
                          id="colorIssued"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#DB2777"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#DB2777"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                      <XAxis dataKey="month" stroke="#A0A0A0" />
                      <YAxis stroke="#A0A0A0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1C1C1C",
                          border: "1px solid #4A4A4A",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#FFFFFF" }}
                        labelStyle={{ color: "#FFFFFF" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="issued"
                        stroke="#DB2777"
                        fillOpacity={1}
                        fill="url(#colorIssued)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Recipients Growth
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData.length > 0 ? chartData : mockData}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A4A4A" />
                      <XAxis dataKey="month" stroke="#A0A0A0" />
                      <YAxis stroke="#A0A0A0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1C1C1C",
                          border: "1px solid #4A4A4A",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#FFFFFF" }}
                        labelStyle={{ color: "#FFFFFF" }}
                      />
                      <Bar dataKey="recipients" fill="#DB2777" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Top Templates */}
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Top Templates
                </h3>
                {loading ? (
                  <div className="text-muted-foreground text-sm">
                    Loading...
                  </div>
                ) : (analytics?.topTemplates?.length ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {analytics?.topTemplates?.map(
                      (
                        template: {
                          name: string;
                          issued: number;
                          active?: boolean;
                          [key: string]: unknown;
                        },
                        i: number
                      ) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {template.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {template.issued} credentials issued
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              template.active !== false
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {template.active !== false ? "Active" : "Archived"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No templates data available
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
