"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Save, Building2, Bell, Key, FileText } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"

export default function IssuerSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("organization")
  const [settings, setSettings] = useState({
    emailNotifications: true,
    webhookEnabled: true,
    apiAccessEnabled: true,
  })
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && !session.user?.isVerified) {
      router.push("/auth/issuer/login?pending=true")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && session.user?.isVerified) {
      loadOrganization()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const loadOrganization = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/issuer/organization", {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        console.error("Failed to fetch organization")
      } else {
        const data = await res.json()
        setOrganization(data)
      }
    } catch (error) {
      console.error("Error loading organization:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/v1/issuer/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        alert("Failed to save settings")
        return
      }

      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("An error occurred")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    )
  }

  if (status === "unauthenticated" || (status === "authenticated" && (!session || session.user?.role !== "issuer"))) {
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
        <DashboardHeader userRole="issuer" userName={session?.user?.name || undefined} />

        <div className="flex mt-4">
          <DashboardSidebar userRole="issuer" />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your issuer profile and preferences</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                  <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur space-y-2">
                    {[
                      {
                        id: "organization",
                        icon: <Building2 className="h-5 w-5" />,
                        title: "Organization",
                        desc: "Profile details",
                      },
                      {
                        id: "notifications",
                        icon: <Bell className="h-5 w-5" />,
                        title: "Notifications",
                        desc: "Alert settings",
                      },
                      { id: "api", icon: <Key className="h-5 w-5" />, title: "API Keys", desc: "Manage access keys" },
                      {
                        id: "templates",
                        icon: <FileText className="h-5 w-5" />,
                        title: "Templates",
                        desc: "Template settings",
                      },
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                          activeSection === section.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="mt-1">{section.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{section.title}</p>
                          <p className="text-xs opacity-70 line-clamp-1">{section.desc}</p>
                        </div>
                        {activeSection === section.id && <ChevronRight className="h-4 w-4 mt-1 shrink-0" />}
                      </button>
                    ))}
                  </Card>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3 space-y-4">
                  {activeSection === "organization" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Organization Profile</h3>
                        {loading ? (
                          <div className="text-muted-foreground text-sm">Loading...</div>
                        ) : (
                          <div className="space-y-4">
                            {[
                              { label: "Organization Name", value: organization?.name || "N/A" },
                              { label: "Email", value: organization?.email || session?.user?.email || "N/A" },
                              { label: "Website", value: organization?.website || "N/A" },
                              { label: "Verification Status", value: organization?.verificationStatus || "N/A" },
                            ].map((field, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                                <div>
                                  <p className="font-medium text-foreground">{field.label}</p>
                                  <p className="text-sm text-muted-foreground">{field.value}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>
                  )}

                  {activeSection === "notifications" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Notification Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Email Notifications</p>
                              <p className="text-sm text-muted-foreground">Get updates about issuance and revocation</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Webhook Events</p>
                              <p className="text-sm text-muted-foreground">Send events to webhook endpoint</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.webhookEnabled}
                                onChange={(e) => setSettings({ ...settings, webhookEnabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeSection === "api" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-foreground">API Keys</h3>
                        <PrimaryButton size="sm">Generate New Key</PrimaryButton>
                      </div>
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            API keys allow you to programmatically issue credentials and manage templates.
                          </p>
                          <p className="text-sm text-muted-foreground">No API keys generated yet.</p>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeSection === "templates" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Template Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Default Expiration Period</p>
                              <p className="text-sm text-muted-foreground">5 years</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Change
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Verification Required</p>
                              <p className="text-sm text-muted-foreground">Enabled</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <PrimaryButton onClick={handleSaveSettings} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

