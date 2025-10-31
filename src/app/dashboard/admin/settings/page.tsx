"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronRight, Save, Shield, Bell, Users, Lock, Edit2 } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Badge } from "@/components/ui/badge"

interface SettingSection {
  icon: React.ReactNode
  title: string
  description: string
}

interface SystemSettings {
  systemName: string
  autoVerificationTimeoutHours: number
  backupSchedule: string
  backupScheduleDisplay: string
  apiKeyRotationDays: number
  ipWhitelisting: string[]
  ipWhitelistingDisplay: string
  emailNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isVerified: boolean
  createdAt: string
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("general")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    secret: "",
  })

  // Edit modal states
  const [editSystemName, setEditSystemName] = useState(false)
  const [editTimeout, setEditTimeout] = useState(false)
  const [editBackup, setEditBackup] = useState(false)
  const [editApiKey, setEditApiKey] = useState(false)
  const [editIpWhitelist, setEditIpWhitelist] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [systemNameValue, setSystemNameValue] = useState("")
  const [timeoutValue, setTimeoutValue] = useState(24)
  const [backupValue, setBackupValue] = useState("0 2 * * *")
  const [apiKeyValue, setApiKeyValue] = useState(90)
  const [ipWhitelistValue, setIpWhitelistValue] = useState("0.0.0.0/0")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      loadSettings()
      if (activeSection === "users") {
        loadAdminUsers()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, activeSection])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/settings", {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        throw new Error("Failed to load settings")
      }

      const data = await res.json()
      setSystemSettings(data)
    } catch (err) {
      console.error("Error loading settings:", err)
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const loadAdminUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch("/api/v1/admin/users?role=admin", {
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to load admin users")
      }

      const data = await res.json()
      setAdminUsers(data.data || data || [])
    } catch (err) {
      console.error("Error loading admin users:", err)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!systemSettings) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          emailNotificationsEnabled: systemSettings.emailNotificationsEnabled,
          smsNotificationsEnabled: systemSettings.smsNotificationsEnabled,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      setSuccess("Settings saved successfully")
      await loadSettings()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error saving settings:", err)
      setError(err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSystemName = async () => {
    if (!systemNameValue.trim()) {
      setError("System name cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ systemName: systemNameValue.trim() }),
      })

      if (!res.ok) {
        throw new Error("Failed to update system name")
      }

      setEditSystemName(false)
      await loadSettings()
    } catch {
      setError("Failed to update system name")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTimeout = async () => {
    if (timeoutValue < 1 || timeoutValue > 168) {
      setError("Timeout must be between 1 and 168 hours")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ autoVerificationTimeoutHours: timeoutValue }),
      })

      if (!res.ok) {
        throw new Error("Failed to update timeout")
      }

      setEditTimeout(false)
      await loadSettings()
    } catch {
      setError("Failed to update timeout")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBackup = async () => {
    if (!backupValue.trim()) {
      setError("Backup schedule cannot be empty")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ backupSchedule: backupValue.trim() }),
      })

      if (!res.ok) {
        throw new Error("Failed to update backup schedule")
      }

      setEditBackup(false)
      await loadSettings()
    } catch {
      setError("Failed to update backup schedule")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (apiKeyValue < 30) {
      setError("API key rotation must be at least 30 days")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ apiKeyRotationDays: apiKeyValue }),
      })

      if (!res.ok) {
        throw new Error("Failed to update API key rotation")
      }

      setEditApiKey(false)
      await loadSettings()
    } catch {
      setError("Failed to update API key rotation")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIpWhitelist = async () => {
    const ips = ipWhitelistValue
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)

    if (ips.length === 0) {
      setError("At least one IP address is required")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ipWhitelisting: ips }),
      })

      if (!res.ok) {
        throw new Error("Failed to update IP whitelist")
      }

      setEditIpWhitelist(false)
      await loadSettings()
    } catch {
      setError("Failed to update IP whitelist")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      setError("All fields are required")
      return
    }

    if (!isValidEmail(adminForm.email)) {
      setError("Please enter a valid email address")
      return
    }

    if (adminForm.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      // Add secret header if provided
      if (adminForm.secret) {
        headers["x-admin-secret"] = adminForm.secret
      }

      const res = await fetch("/api/v1/admin/create-admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          name: adminForm.name.trim(),
          email: adminForm.email.trim(),
          password: adminForm.password,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create admin user")
      }

      const data = await res.json()
      setSuccess(`Admin user "${data.user.name}" created successfully`)
      setShowCreateAdmin(false)
      setAdminForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        secret: "",
      })
      await loadAdminUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error creating admin:", err)
      setError(err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to create admin user")
    } finally {
      setSaving(false)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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
      const res = await fetch("/api/v1/admin/change-password", {
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

  const settingSections: Record<string, SettingSection> = {
    general: {
      icon: <Shield className="h-5 w-5" />,
      title: "General Settings",
      description: "Manage system-wide configuration and policies",
    },
    security: {
      icon: <Lock className="h-5 w-5" />,
      title: "Security",
      description: "Configure security policies and access controls",
    },
    notifications: {
      icon: <Bell className="h-5 w-5" />,
      title: "Notifications",
      description: "Control notification preferences",
    },
    users: {
      icon: <Users className="h-5 w-5" />,
      title: "User Management",
      description: "Manage admin users and permissions",
    },
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
          <DashboardSidebar userRole="admin" />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage system configuration and preferences</p>
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
                    {Object.entries(settingSections).map(([key, section]) => (
                      <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                          activeSection === key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="mt-1">{section.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{section.title}</p>
                          <p className="text-xs opacity-70 line-clamp-1">{section.description}</p>
                        </div>
                        {activeSection === key && <ChevronRight className="h-4 w-4 mt-1 shrink-0" />}
                      </button>
                    ))}
                  </Card>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-3 space-y-4">
                  {/* General Settings */}
                  {activeSection === "general" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">System Settings</h3>
                        {loading ? (
                          <div className="text-muted-foreground text-sm">Loading...</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">System Name</p>
                                <p className="text-sm text-muted-foreground">
                                  {systemSettings?.systemName || "Credential Management System"}
                                </p>
                              </div>
                              <Dialog open={editSystemName} onOpenChange={setEditSystemName}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSystemNameValue(systemSettings?.systemName || "")}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Edit System Name</DialogTitle>
                                    <DialogDescription>Update the system name</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>System Name</Label>
                                      <Input
                                        value={systemNameValue}
                                        onChange={(e) => setSystemNameValue(e.target.value)}
                                        placeholder="Enter system name"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditSystemName(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveSystemName} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Auto-verification Timeout</p>
                                <p className="text-sm text-muted-foreground">
                                  {systemSettings?.autoVerificationTimeoutHours || 24} hours
                                </p>
                              </div>
                              <Dialog open={editTimeout} onOpenChange={setEditTimeout}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTimeoutValue(systemSettings?.autoVerificationTimeoutHours || 24)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Edit Auto-verification Timeout</DialogTitle>
                                    <DialogDescription>Set timeout in hours (1-168)</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Timeout (hours)</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={timeoutValue}
                                        onChange={(e) => setTimeoutValue(parseInt(e.target.value) || 24)}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditTimeout(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveTimeout} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Backup Schedule</p>
                                <p className="text-sm text-muted-foreground">
                                  {systemSettings?.backupScheduleDisplay || "Daily at 2:00 AM"}
                                </p>
                              </div>
                              <Dialog open={editBackup} onOpenChange={setEditBackup}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBackupValue(systemSettings?.backupSchedule || "0 2 * * *")}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Edit Backup Schedule</DialogTitle>
                                    <DialogDescription>Enter cron expression (e.g., 0 2 * * * for daily at 2 AM)</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Cron Expression</Label>
                                      <Input
                                        value={backupValue}
                                        onChange={(e) => setBackupValue(e.target.value)}
                                        placeholder="0 2 * * *"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditBackup(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveBackup} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeSection === "security" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Security Policies</h3>
                        {loading ? (
                          <div className="text-muted-foreground text-sm">Loading...</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">API Key Rotation</p>
                                <p className="text-sm text-muted-foreground">
                                  Rotate every {systemSettings?.apiKeyRotationDays || 90} days
                                </p>
                              </div>
                              <Dialog open={editApiKey} onOpenChange={setEditApiKey}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setApiKeyValue(systemSettings?.apiKeyRotationDays || 90)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Configure
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Configure API Key Rotation</DialogTitle>
                                    <DialogDescription>Set rotation period in days (minimum 30)</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Rotation Period (days)</Label>
                                      <Input
                                        type="number"
                                        min="30"
                                        value={apiKeyValue}
                                        onChange={(e) => setApiKeyValue(parseInt(e.target.value) || 90)}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditApiKey(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveApiKey} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">IP Whitelisting</p>
                                <p className="text-sm text-muted-foreground">
                                  {systemSettings?.ipWhitelistingDisplay || "0.0.0.0/0 (Allow all)"}
                                </p>
                              </div>
                              <Dialog open={editIpWhitelist} onOpenChange={setEditIpWhitelist}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setIpWhitelistValue(
                                        systemSettings?.ipWhitelisting.join(", ") || "0.0.0.0/0"
                                      )
                                    }
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Manage
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border/50">
                                  <DialogHeader>
                                    <DialogTitle>Manage IP Whitelisting</DialogTitle>
                                    <DialogDescription>Enter IP addresses or CIDR ranges, separated by commas</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>IP Addresses (comma-separated)</Label>
                                      <Input
                                        value={ipWhitelistValue}
                                        onChange={(e) => setIpWhitelistValue(e.target.value)}
                                        placeholder="0.0.0.0/0, 192.168.1.0/24"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditIpWhitelist(false)} disabled={saving}>
                                      Cancel
                                    </Button>
                                    <PrimaryButton onClick={handleSaveIpWhitelist} disabled={saving}>
                                      {saving ? "Saving..." : "Save"}
                                    </PrimaryButton>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Change Password</p>
                                <p className="text-sm text-muted-foreground">Update your account password</p>
                              </div>
                              <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                                <DialogTrigger asChild>
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
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Change Password
                                  </Button>
                                </DialogTrigger>
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
                        )}
                      </Card>
                    </div>
                  )}

                  {/* Notifications Settings */}
                  {activeSection === "notifications" && (
                    <div className="space-y-4">
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
                        {loading ? (
                          <div className="text-muted-foreground text-sm">Loading...</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates via email</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={systemSettings?.emailNotificationsEnabled || false}
                                  onChange={(e) => {
                                    if (systemSettings) {
                                      setSystemSettings({
                                        ...systemSettings,
                                        emailNotificationsEnabled: e.target.checked,
                                      })
                                    }
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                              </label>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">SMS Notifications</p>
                                <p className="text-sm text-muted-foreground">Critical alerts only</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={systemSettings?.smsNotificationsEnabled || false}
                                  onChange={(e) => {
                                    if (systemSettings) {
                                      setSystemSettings({
                                        ...systemSettings,
                                        smsNotificationsEnabled: e.target.checked,
                                      })
                                    }
                                  }}
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

                  {/* User Management */}
                  {activeSection === "users" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-foreground">Admin Users</h3>
                        <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                          <DialogTrigger asChild>
                            <PrimaryButton onClick={() => setShowCreateAdmin(true)}>
                              Add Admin User
                            </PrimaryButton>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border/50 max-w-md">
                            <DialogHeader>
                              <DialogTitle>Create Admin User</DialogTitle>
                              <DialogDescription>Create a new admin account for the system</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="admin-name">Full Name</Label>
                                <Input
                                  id="admin-name"
                                  value={adminForm.name}
                                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                                  placeholder="Enter admin name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="admin-email">Email</Label>
                                <Input
                                  id="admin-email"
                                  type="email"
                                  value={adminForm.email}
                                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                                  placeholder="admin@example.com"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="admin-password">Password</Label>
                                <Input
                                  id="admin-password"
                                  type="password"
                                  value={adminForm.password}
                                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                                  placeholder="Min. 8 characters"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="admin-confirm-password">Confirm Password</Label>
                                <Input
                                  id="admin-confirm-password"
                                  type="password"
                                  value={adminForm.confirmPassword}
                                  onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                                  placeholder="Confirm password"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="admin-secret">
                                  Admin Secret Key <span className="text-muted-foreground text-xs">(Optional)</span>
                                </Label>
                                <Input
                                  id="admin-secret"
                                  type="password"
                                  value={adminForm.secret}
                                  onChange={(e) => setAdminForm({ ...adminForm, secret: e.target.value })}
                                  placeholder="Required if ADMIN_CREATE_SECRET is set"
                                  className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Only required if ADMIN_CREATE_SECRET is configured in environment variables
                                </p>
                              </div>
                              {error && (
                                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                  {error}
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setShowCreateAdmin(false)
                                setAdminForm({
                                  name: "",
                                  email: "",
                                  password: "",
                                  confirmPassword: "",
                                  secret: "",
                                })
                                setError(null)
                              }} disabled={saving}>
                                Cancel
                              </Button>
                              <PrimaryButton onClick={handleCreateAdmin} disabled={saving}>
                                {saving ? "Creating..." : "Create Admin"}
                              </PrimaryButton>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                        {usersLoading ? (
                          <div className="text-muted-foreground text-sm">Loading admin users...</div>
                        ) : adminUsers.length === 0 ? (
                          <div className="text-muted-foreground text-sm">No admin users found</div>
                        ) : (
                          <div className="space-y-3">
                            {adminUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
                              >
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-primary/20 text-primary">
                                    {user.role}
                                  </Badge>
                                  {user.isVerified && (
                                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400">
                                      Verified
                                    </Badge>
                                  )}
                                  <Button variant="outline" size="sm">
                                    Manage
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>
                  )}

                  {/* Save Button - Only show for settings that need saving */}
                  {(activeSection === "security" || activeSection === "notifications") && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => loadSettings()}>
                        Cancel
                      </Button>
                      <PrimaryButton className="gap-2" onClick={handleSaveSettings} disabled={saving || loading}>
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
