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
import { Save, Upload, ExternalLink, Eye } from "lucide-react"
import Link from "next/link"
import { PrimaryButton } from "@/components/ui/primary-button"
import { LoadingScreen } from "@/components/loading-screen"

export default function RecipientProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    try {
      const res = await fetch("/api/v1/recipient/profile", {
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
          image: profile.image,
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        const errorData = await res.json()
        setError(errorData.error || "Failed to update profile")
        return
      }

      // Update session to reflect changes
      await updateSession()
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error saving profile:", error)
      setError("Failed to update profile")
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
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
                  <p className="text-muted-foreground">Manage your personal information and public profile</p>
                </div>
                {profile.id || profile.email ? (
                  <Link
                    href={`${profileUrl}?from=dashboard`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("profileSource", "dashboard")
                        sessionStorage.setItem("profileSourceRole", session?.user?.role || "")
                      }
                    }}
                  >
                    <Button variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="hidden md:inline">View Public Profile</span>
                      <span className="md:hidden">View</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : null}
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
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">Public Profile</p>
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
                        <p className="text-sm text-muted-foreground mb-2">
                          Allow others to view your public profile
                        </p>
                        {profile.profilePublic && (profile.id || profile.email) && (
                          <Link
                            href={`${profileUrl}?from=dashboard`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                sessionStorage.setItem("profileSource", "dashboard")
                                sessionStorage.setItem("profileSourceRole", session?.user?.role || "")
                              }
                            }}
                          >
                            <Button variant="outline" size="sm" className="gap-2 text-xs">
                              <Eye className="h-3 w-3" />
                              View Public Profile
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <PrimaryButton
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

