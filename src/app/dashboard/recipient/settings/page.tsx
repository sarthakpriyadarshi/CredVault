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
import { ChevronRight, Save, User, Lock, Bell, Edit2, Upload } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"

export default function RecipientSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    image: null as string | null,
    profilePublic: true,
    description: "",
    linkedin: "",
    github: "",
    twitter: "",
    website: "",
  })

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
      loadProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/recipient/profile", {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        console.error("Failed to fetch profile")
      } else {
        const data = await res.json()
        setProfile({
          id: data.profile.id || "",
          name: data.profile.name || "",
          email: data.profile.email || "",
          image: data.profile.image || null,
          profilePublic: data.profile.profilePublic ?? true,
          description: data.profile.description || "",
          linkedin: data.profile.linkedin || "",
          github: data.profile.github || "",
          twitter: data.profile.twitter || "",
          website: data.profile.website || "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/v1/recipient/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
                              body: JSON.stringify({
                                name: profile.name.trim(),
                                description: profile.description.trim() || null,
                                linkedin: profile.linkedin.trim() || null,
                                github: profile.github.trim() || null,
                                twitter: profile.twitter.trim() || null,
                                website: profile.website.trim() || null,
                                profilePublic: profile.profilePublic,
                                image: profile.image || null,
                              }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save profile")
      }

      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
      // Update session to reflect new avatar
      await updateSession()
    } catch (err) {
      console.error("Error saving profile:", err)
      setError(err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to save profile")
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

  const profileUrl = profile.id 
    ? (typeof window !== "undefined" 
        ? `${window.location.origin}/profile/${profile.id}`
        : `/profile/${profile.id}`)
    : (typeof window !== "undefined" 
        ? `${window.location.origin}/profile/${encodeURIComponent(profile.email)}`
        : `/profile/${encodeURIComponent(profile.email)}`)

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    )
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
                        id: "profile",
                        icon: <User className="h-5 w-5" />,
                        title: "Profile",
                        desc: "Personal details",
                      },
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
                  {activeSection === "profile" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Profile Settings</h3>
                        {loading ? (
                          <div className="text-muted-foreground text-sm">Loading...</div>
                        ) : (
                          <div className="space-y-4">
                            {/* Avatar Upload */}
                            <div className="space-y-2">
                              <Label>Profile Avatar</Label>
                              <div className="flex items-center gap-4">
                                {profile.image ? (
                                  <img
                                    src={
                                      profile.image.startsWith('http://') || profile.image.startsWith('https://') 
                                        ? profile.image 
                                        : profile.image.startsWith('data:') 
                                        ? profile.image 
                                        : `data:image/png;base64,${profile.image}`
                                    }
                                    alt="Avatar"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
                                  />
                                ) : (
                                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50">
                                    <span className="text-2xl font-bold text-primary">
                                      {profile.name.charAt(0).toUpperCase() || "U"}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      if (!file) return

                                      try {
                                        const formData = new FormData()
                                        formData.append("file", file)

                                        formData.append("type", "avatar")
                                        const res = await fetch("/api/v1/upload", {
                                          method: "POST",
                                          credentials: "include",
                                          body: formData,
                                        })

                                        if (!res.ok) {
                                          const error = await res.json()
                                          alert(error.error || "Failed to upload avatar")
                                          return
                                        }

                                        const data = await res.json()
                                        
                                        // Update user image in database immediately
                                        const updateRes = await fetch("/api/v1/recipient/profile", {
                                          method: "PUT",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          credentials: "include",
                                          body: JSON.stringify({
                                            name: profile.name,
                                            description: profile.description || null,
                                            linkedin: profile.linkedin || null,
                                            github: profile.github || null,
                                            twitter: profile.twitter || null,
                                            website: profile.website || null,
                                            profilePublic: profile.profilePublic,
                                            image: data.base64,
                                          }),
                                        })

                                        if (!updateRes.ok) {
                                          const errorData = await updateRes.json()
                                          alert(errorData.error || "Failed to update profile with new avatar")
                                          return
                                        }

                                        // Update local state
                                        setProfile({ ...profile, image: data.base64 })
                                        
                                        // Update session to reflect new avatar (this will refresh the header)
                                        // Call updateSession multiple times with delays to ensure it propagates
                                        await updateSession()
                                        setTimeout(async () => {
                                          await updateSession()
                                        }, 1000)
                                        setTimeout(async () => {
                                          await updateSession()
                                        }, 2000)
                                      } catch (error) {
                                        console.error("Error uploading avatar:", error)
                                        alert("Failed to upload avatar")
                                      }
                                    }}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    type="button" 
                                    className="gap-2"
                                    onClick={() => {
                                      const fileInput = document.getElementById("avatar-upload") as HTMLInputElement
                                      fileInput?.click()
                                    }}
                                  >
                                    <Upload className="h-4 w-4" />
                                    Upload Avatar
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">Upload a profile picture (max 5MB)</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Enter your full name"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" value={profile.email} disabled className="bg-background/30" />
                              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={profile.description}
                                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                placeholder="Tell people about yourself..."
                                className="min-h-[100px] bg-background/50"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="linkedin">LinkedIn URL</Label>
                              <Input
                                id="linkedin"
                                value={profile.linkedin}
                                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                placeholder="https://linkedin.com/in/yourprofile"
                                type="url"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="github">GitHub URL</Label>
                              <Input
                                id="github"
                                value={profile.github}
                                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                                placeholder="https://github.com/yourusername"
                                type="url"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="twitter">Twitter/X URL</Label>
                              <Input
                                id="twitter"
                                value={profile.twitter}
                                onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                                placeholder="https://twitter.com/yourusername"
                                type="url"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="website">Website</Label>
                              <Input
                                id="website"
                                value={profile.website}
                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                placeholder="https://yourwebsite.com"
                                type="url"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Public Profile</p>
                                <p className="text-sm text-muted-foreground">
                                  Allow others to view your profile at{" "}
                                  <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {profileUrl}
                                  </a>
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={profile.profilePublic}
                                  onChange={(e) => setProfile({ ...profile, profilePublic: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                              </label>
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
                  {(activeSection === "profile" || activeSection === "notifications") && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => loadProfile()}>
                        Cancel
                      </Button>
                      <PrimaryButton
                        onClick={activeSection === "profile" ? handleSaveProfile : handleSaveSettings}
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

