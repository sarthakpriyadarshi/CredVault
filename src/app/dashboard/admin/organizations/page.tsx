"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Search, Edit2, Trash2, Eye } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import Image from "next/image"

interface Organization {
  id: string
  name: string
  description?: string
  website?: string
  logo?: string
  verificationProof?: string
  verificationStatus: "pending" | "approved" | "rejected"
  verifiedBy?: { id: string; name: string; email: string }
  verifiedAt?: string
  rejectionReason?: string
  createdAt: string
  issuerCount: number
  issuers: Array<{
    id: string
    name: string
    email: string
    createdAt: string
  }>
}

export default function OrganizationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    website: "",
    verificationStatus: "pending" as "pending" | "approved" | "rejected",
  })
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    name: "",
    website: "",
    email: "",
    password: "",
  })

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

      const res = await fetch("/api/v1/admin/organizations?status=all", fetchOptions)
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        console.error("Failed to fetch organizations:", res.statusText)
      } else {
        const data = await res.json()
        setOrganizations(data.data || data || [])
      }
    } catch (error) {
      console.error("Error loading organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgs = organizations.filter((org) => org.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleEditClick = (org: Organization) => {
    setEditingOrg(org)
    setEditForm({
      name: org.name || "",
      description: org.description || "",
      website: org.website || "",
      verificationStatus: org.verificationStatus || "pending",
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingOrg) return

    setSaving(true)
    try {
      const res = await fetch(`/api/v1/admin/organizations/${editingOrg.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Failed to update organization")
        return
      }

      setIsEditOpen(false)
      setEditingOrg(null)
      await loadData()
    } catch (error) {
      console.error("Error updating organization:", error)
      alert("An error occurred while updating the organization")
    } finally {
      setSaving(false)
    }
  }

  const handleAddOrganization = async () => {
    if (!addForm.name.trim()) {
      alert("Organization name is required")
      return
    }
    if (!addForm.email.trim()) {
      alert("Issuer email is required")
      return
    }
    if (!addForm.password.trim()) {
      alert("Password is required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/v1/admin/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(addForm),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Failed to create organization")
        return
      }

      // Reset form and close dialog
      setAddForm({ name: "", website: "", email: "", password: "" })
      setIsAddOpen(false)
      await loadData()
    } catch (error) {
      console.error("Error creating organization:", error)
      alert("An error occurred while creating the organization")
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
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

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader userRole="admin" userName={session?.user?.name || undefined} />

        <div className="flex mt-4">
          <DashboardSidebar
            userRole="admin"
            badgeCounts={{
              organizations: organizations.length,
              verificationRequests: organizations.filter((o) => o.verificationStatus === "pending").length,
            }}
          />

        <main className="flex-1 md:ml-80 p-4 md:p-8 max-w-full overflow-x-hidden">
          <div className="space-y-8 max-w-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
                  <p className="text-muted-foreground">Manage and monitor all registered organizations</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <PrimaryButton className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Organization
                    </PrimaryButton>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border/50">
                    <DialogHeader>
                      <DialogTitle>Add New Organization</DialogTitle>
                      <DialogDescription>Register a new organization and create an issuer account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Organization Name</label>
                        <input
                          type="text"
                          placeholder="Enter organization name"
                          value={addForm.name}
                          onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Website</label>
                        <input
                          type="url"
                          placeholder="https://organization.com"
                          value={addForm.website}
                          onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Issuer Email</label>
                        <input
                          type="email"
                          placeholder="issuer@organization.com"
                          value={addForm.email}
                          onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Password</label>
                        <input
                          type="password"
                          placeholder="Enter password for issuer account"
                          value={addForm.password}
                          onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={saving}>
                        Cancel
                      </Button>
                      <PrimaryButton onClick={handleAddOrganization} disabled={saving}>
                        {saving ? "Creating..." : "Create Organization"}
                      </PrimaryButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search Bar */}
              <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search organizations by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                  />
                </div>
              </Card>

              {/* Organizations Table */}
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur w-full">
                <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Credentials</TableHead>
                        <TableHead>Verified At</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : filteredOrgs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No organizations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrgs.map((org) => {
                          return (
                            <TableRow key={org.id}>
                              <TableCell className="font-medium text-foreground">{org.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`capitalize font-medium ${getStatusColor(org.verificationStatus)}`}>
                                  {org.verificationStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-foreground">0</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {org.verifiedAt ? new Date(org.verifiedAt).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(org.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Dialog open={isOpen && selectedOrg?.id === org.id} onOpenChange={setIsOpen}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" onClick={() => setSelectedOrg(org)} className="gap-1">
                                        <Eye className="h-4 w-4" />
                                        View
                                      </Button>
                                    </DialogTrigger>
                                    {selectedOrg && (
                                      <DialogContent className="max-w-2xl bg-card border-border/50">
                                        <DialogHeader>
                                          <DialogTitle>{selectedOrg.name}</DialogTitle>
                                          <DialogDescription>Organization details</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Status</p>
                                              <Badge variant="outline" className={`capitalize ${getStatusColor(selectedOrg.verificationStatus)}`}>
                                                {selectedOrg.verificationStatus}
                                              </Badge>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Website</p>
                                              <p className="font-medium text-foreground">{selectedOrg.website || "-"}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Issuers</p>
                                              <p className="font-medium text-foreground">{selectedOrg.issuerCount}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Created</p>
                                              <p className="font-medium text-foreground">
                                                {new Date(selectedOrg.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Verified At</p>
                                              <p className="font-medium text-foreground">
                                                {selectedOrg.verifiedAt ? new Date(selectedOrg.verifiedAt).toLocaleDateString() : "-"}
                                              </p>
                                            </div>
                                          </div>
                                          {selectedOrg.verificationProof && (
                                            <div className="border-t border-border/50 pt-4">
                                              <p className="font-medium text-foreground mb-2">Verification Proof</p>
                                              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border/50">
                                                <Image
                                                  src={selectedOrg.verificationProof}
                                                  alt="Verification proof"
                                                  fill
                                                  className="object-contain"
                                                />
                                              </div>
                                            </div>
                                          )}
                                          {selectedOrg.description && (
                                            <div className="border-t border-border/50 pt-4">
                                              <p className="text-xs text-muted-foreground mb-1">Description</p>
                                              <p className="text-sm text-foreground">{selectedOrg.description}</p>
                                            </div>
                                          )}
                                        </div>
                                        <DialogFooter>
                                          <Button variant="outline" onClick={() => setIsOpen(false)}>
                                            Close
                                          </Button>
                                          <PrimaryButton
                                            className="gap-2"
                                            onClick={() => {
                                              setIsOpen(false)
                                              handleEditClick(selectedOrg)
                                            }}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                            Edit
                                          </PrimaryButton>
                                        </DialogFooter>
                                      </DialogContent>
                                    )}
                                  </Dialog>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleEditClick(org)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
              </Card>

              {/* Edit Dialog */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-card border-border/50 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Organization</DialogTitle>
                    <DialogDescription>Update organization information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Organization Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        placeholder="Enter organization name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary min-h-24"
                        placeholder="Enter organization description"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Website</label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        placeholder="https://organization.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Verification Status</label>
                      <select
                        value={editForm.verificationStatus}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            verificationStatus: e.target.value as "pending" | "approved" | "rejected",
                          })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <PrimaryButton onClick={handleSaveEdit} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </PrimaryButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

