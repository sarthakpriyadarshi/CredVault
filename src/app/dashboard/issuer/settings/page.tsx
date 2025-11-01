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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronRight, Save, Building2, Bell, Lock, FileText, Edit2, Upload } from "lucide-react"
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
  const [organization, setOrganization] = useState<{
    id?: string
    name?: string
    email?: string
    website?: string
    verificationStatus?: string
    description?: string
    logo?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit states
  const [editName, setEditName] = useState(false)
  const [editWebsite, setEditWebsite] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [nameValue, setNameValue] = useState("")
  const [websiteValue, setWebsiteValue] = useState("")
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Modal states for error and success messages
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")

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
    setSaving(true)
    setError(null)
    setSuccess(null)
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
        throw new Error("Failed to save settings")
      }

      setSuccess("Settings saved successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setError("Organization name cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/issuer/organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: nameValue.trim() }),
      })

      if (!res.ok) {
        throw new Error("Failed to update organization name")
      }

      setEditName(false)
      await loadOrganization()
      setSuccess("Organization name updated successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Failed to update organization name")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWebsite = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/issuer/organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ website: websiteValue.trim() }),
      })

      if (!res.ok) {
        throw new Error("Failed to update website")
      }

      setEditWebsite(false)
      await loadOrganization()
      setSuccess("Website updated successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Failed to update website")
    } finally {
      setSaving(false)
    }
  }

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
                      { id: "security", icon: <Lock className="h-5 w-5" />, title: "Security", desc: "Password & access" },
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
                            {/* Logo Upload */}
                            <div className="space-y-2">
                              <Label>Organization Logo</Label>
                              <div className="flex items-center gap-4">
                                {organization?.logo ? (
                                  <img
                                    src={organization.logo}
                                    alt="Logo"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50">
                                    <Building2 className="h-10 w-10 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <input
                                    type="file"
                                    id="logo-upload"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return

                                      try {
                                        const formData = new FormData()
                                        formData.append("file", file)
                                        formData.append("type", "logo")

                                        const res = await fetch("/api/v1/upload", {
                                          method: "POST",
                                          credentials: "include",
                                          body: formData,
                                        })

                                        if (!res.ok) {
                                          const error = await res.json()
                                          setModalMessage(error.error || "Failed to upload logo")
                                          setShowErrorModal(true)
                                          return
                                        }

                                        const data = await res.json()
                                        
                                        // Update organization logo via API
                                        const updateRes = await fetch("/api/v1/issuer/organization", {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          credentials: "include",
                                          body: JSON.stringify({ logo: data.base64 }),
                                        })

                                        if (!updateRes.ok) {
                                          const error = await updateRes.json()
                                          setModalMessage(error.error || "Failed to update logo")
                                          setShowErrorModal(true)
                                          return
                                        }

                                        setOrganization({ ...organization, logo: data.base64 })
                                        setSuccess("Logo updated successfully!")
                                        setTimeout(() => setSuccess(null), 3000)
                                      } catch (error) {
                                        console.error("Error uploading logo:", error)
                                        setModalMessage("Failed to upload logo")
                                        setShowErrorModal(true)
                                      }
                                    }}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    type="button" 
                                    className="gap-2"
                                    onClick={() => {
                                      const fileInput = document.getElementById("logo-upload") as HTMLInputElement
                                      fileInput?.click()
                                    }}
                                  >
                                    <Upload className="h-4 w-4" />
                                    Upload Logo
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">Upload organization logo (max 5MB)</p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Organization Name</p>
                                <p className="text-sm text-muted-foreground">{organization?.name || "N/A"}</p>
                              </div>
                              <Dialog open={editName} onOpenChange={setEditName}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNameValue(organization?.name || "")
                                    setEditName(true)
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Edit Organization Name</DialogTitle>
                                    <DialogDescription>Update your organization name</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Organization Name</Label>
                                      <Input
                                        value={nameValue}
                                        onChange={(e) => setNameValue(e.target.value)}
                                        placeholder="Enter organization name"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditName(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveName} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Email</p>
                                <p className="text-sm text-muted-foreground">{session?.user?.email || "N/A"}</p>
                              </div>
                              <Button variant="outline" size="sm" disabled>
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Website</p>
                                <p className="text-sm text-muted-foreground">{organization?.website || "N/A"}</p>
                              </div>
                              <Dialog open={editWebsite} onOpenChange={setEditWebsite}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setWebsiteValue(organization?.website || "")
                                    setEditWebsite(true)
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Edit Website</DialogTitle>
                                    <DialogDescription>Update your organization website</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Website</Label>
                                      <Input
                                        value={websiteValue}
                                        onChange={(e) => setWebsiteValue(e.target.value)}
                                        placeholder="https://example.com"
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditWebsite(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveWebsite} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Verification Status</p>
                                <p className="text-sm text-muted-foreground">{organization?.verificationStatus || "N/A"}</p>
                              </div>
                            </div>
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
                            <Button variant="outline" size="sm" disabled>
                              Change
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                            <div>
                              <p className="font-medium text-foreground">Verification Required</p>
                              <p className="text-sm text-muted-foreground">Enabled</p>
                            </div>
                            <Button variant="outline" size="sm" disabled>
                              Configure
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Save Button */}
                  {(activeSection === "notifications") && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => loadOrganization()}>
                        Cancel
                      </Button>
                      <PrimaryButton onClick={handleSaveSettings} disabled={saving} className="gap-2">
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

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowErrorModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Success</DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
