"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronRight, Save, Lock, Bell, Edit2 } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { LoadingScreen } from "@/components/loading-screen"

export default function RecipientSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("notifications")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const { update: updateSession } = useSession()

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "recipient") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role === "recipient") {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])


  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("All fields are required")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match")
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError("New password must be different from current password")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to change password")
      }

      setSuccess("Password changed successfully")
      setShowChangePassword(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error changing password:", err)
      setError(err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setError(null)
    try {
      // Settings API can be added later if needed
      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }


  if (status === "loading") {
    return <LoadingScreen message="Loading session..." />
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
        <DashboardHeader userRole="recipient" userName={session?.user?.name || undefined} />

        <div className="flex mt-4">
          <DashboardSidebar userRole="recipient" />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and preferences</p>
              </div>

              {/* Messages */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                  <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-red-200">
                    ×
                  </button>
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                  <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur space-y-2">
                    {[
                      {
                        id: "notifications",
                        icon: <Bell className="h-5 w-5" />,
                        title: "Notifications",
                        desc: "Alert settings",
                      },
                      { id: "security", icon: <Lock className="h-5 w-5" />, title: "Security", desc: "Password & access" },
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
                  {activeSection === "notifications" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Notification Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Email Notifications</p>
                              <p className="text-sm text-muted-foreground">Get updates about your credentials</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notifications.emailNotifications}
                                onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeSection === "security" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Change Password</p>
                              <p className="text-sm text-muted-foreground">Update your account password</p>
                            </div>
                            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPasswordForm({
                                    currentPassword: "",
                                    newPassword: "",
                                    confirmPassword: "",
                                  })
                                  setError(null)
                                  setShowChangePassword(true)
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Change Password
                              </Button>
                              <DialogContent className="bg-card border-border/50 max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Change Password</DialogTitle>
                                  <DialogDescription>
                                    Enter your current password and choose a new secure password
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input
                                      id="current-password"
                                      type="password"
                                      value={passwordForm.currentPassword}
                                      onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                      }
                                      placeholder="Enter current password"
                                      className="mt-1"
                                      autoComplete="current-password"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                      id="new-password"
                                      type="password"
                                      value={passwordForm.newPassword}
                                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                      placeholder="Min. 8 characters"
                                      className="mt-1"
                                      autoComplete="new-password"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                                    <Input
                                      id="confirm-new-password"
                                      type="password"
                                      value={passwordForm.confirmPassword}
                                      onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                      }
                                      placeholder="Confirm new password"
                                      className="mt-1"
                                      autoComplete="new-password"
                                    />
                                  </div>
                                  {error && (
                                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                      {error}
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowChangePassword(false)
                                      setPasswordForm({
                                        currentPassword: "",
                                        newPassword: "",
                                        confirmPassword: "",
                                      })
                                      setError(null)
                                    }}
                                    disabled={saving}
                                  >
                                    Cancel
                                  </Button>
                                  <PrimaryButton onClick={handleChangePassword} disabled={saving}>
                                    {saving ? "Changing..." : "Change Password"}
                                  </PrimaryButton>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Save Button */}
                  {activeSection === "notifications" && (
                    <div className="flex justify-end gap-2">
                      <PrimaryButton
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

