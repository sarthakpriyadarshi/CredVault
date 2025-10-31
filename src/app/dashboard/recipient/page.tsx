"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Eye, Share2, CheckCircle, Clock, Shield } from "lucide-react"

export default function RecipientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (not during loading)
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "recipient") {
      // Only check role after authentication is confirmed
      router.push("/auth/login")
    }
  }, [session, status, router])

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
    <div className="min-h-screen w-full bg-background">
      <DashboardHeader userRole="recipient" userName={session.user?.name || undefined} />

      <div className="flex">
        <DashboardSidebar userRole="recipient" />

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
                    <p className="text-2xl font-bold text-foreground">12</p>
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
                    <p className="text-2xl font-bold text-foreground">8</p>
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
                    <p className="text-2xl font-bold text-foreground">2</p>
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
              <div className="space-y-3">
                {[
                  {
                    title: "AWS Solutions Architect",
                    issuer: "Amazon Web Services",
                    date: "Issued Dec 15, 2024",
                    verified: true,
                  },
                  {
                    title: "React Developer Badge",
                    issuer: "Tech Academy",
                    date: "Issued Nov 20, 2024",
                    verified: true,
                  },
                  {
                    title: "Project Management Certificate",
                    issuer: "PMI",
                    date: "Issued Oct 10, 2024",
                    verified: false,
                  },
                  {
                    title: "Data Science Specialization",
                    issuer: "Coursera",
                    date: "Issued Sep 5, 2024",
                    verified: true,
                  },
                ].map((credential, i) => (
                  <div
                    key={i}
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
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Eye className="h-4 w-4" />
                        <span className="hidden md:inline">View</span>
                      </Button>
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
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
