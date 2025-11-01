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
import { LoadingScreen } from "@/components/loading-screen"
import { Clock, CheckCircle, XCircle, FileText, Image as ImageIcon, Edit2 } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import Image from "next/image"

interface VerificationRequest {
  id: string
  name: string
  description?: string
  website?: string
  verificationProof?: string
  verificationStatus: "pending" | "approved" | "rejected"
  submittedAt: string
  issuers: Array<{
    id: string
    name: string
    email: string
  }>
}

export default function VerificationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [decisionNotes, setDecisionNotes] = useState("")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<VerificationRequest | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    website: "",
  })
  const [saving, setSaving] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/auth/admin/login")
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, selectedFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const fetchOptions: RequestInit = {
        credentials: "include",
      }

      const statusParam = selectedFilter === "all" ? "all" : selectedFilter
      const res = await fetch(`/api/v1/admin/organizations?status=${statusParam}`, fetchOptions)
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/admin/login")
          return
        }
        console.error("Failed to fetch verification requests:", res.statusText)
      } else {
        const data = await res.json()
        const orgs = data.data || data || []
        // Transform organizations into verification requests format
        const transformedRequests: VerificationRequest[] = orgs.map((org: {
          id: string
          name: string
          description?: string
          website?: string
          verificationProof?: string
          verificationStatus: string
          createdAt: string
          issuers?: Array<{ id: string; name: string; email: string }>
        }) => ({
          id: org.id,
          name: org.name,
          description: org.description,
          website: org.website,
          verificationProof: org.verificationProof,
          verificationStatus: org.verificationStatus,
          submittedAt: org.createdAt,
          issuers: org.issuers || [],
        }))
        setRequests(transformedRequests)
      }
    } catch (error) {
      console.error("Error loading verification requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (orgId: string) => {
    setPendingActionId(orgId)
    setShowApproveConfirm(true)
  }

  const handleApprove = async () => {
    if (!pendingActionId) return

    setProcessingId(pendingActionId)
    setShowApproveConfirm(false)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/v1/admin/organizations/${pendingActionId}/approve`, {
        method: "POST",
        credentials: "include",
      })

      if (res.ok) {
        setIsDetailsOpen(false)
        await loadData()
      } else {
        const error = await res.json()
        setErrorMessage(error.error || "Failed to approve organization")
      }
    } catch (error) {
      console.error("Error approving organization:", error)
      setErrorMessage("An error occurred while approving the organization")
    } finally {
      setProcessingId(null)
      setPendingActionId(null)
      setDecisionNotes("")
    }
  }

  const handleRejectClick = (orgId: string) => {
    setPendingActionId(orgId)
    setShowRejectConfirm(true)
  }

  const handleReject = async () => {
    if (!pendingActionId) return
    
    const reason = decisionNotes.trim()
    if (!reason) {
      setErrorMessage("Please provide a reason for rejection")
      return
    }

    setProcessingId(pendingActionId)
    setShowRejectConfirm(false)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/v1/admin/organizations/${pendingActionId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      })

      if (res.ok) {
        setIsDetailsOpen(false)
        await loadData()
      } else {
        const error = await res.json()
        setErrorMessage(error.error || "Failed to reject organization")
      }
    } catch (error) {
      console.error("Error rejecting organization:", error)
      setErrorMessage("An error occurred while rejecting the organization")
    } finally {
      setProcessingId(null)
      setPendingActionId(null)
      setDecisionNotes("")
    }
  }

  const handleEditClick = (request: VerificationRequest) => {
    setEditingRequest(request)
    setEditForm({
      name: request.name || "",
      description: request.description || "",
      website: request.website || "",
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRequest) return

    setSaving(true)
    try {
      const res = await fetch(`/api/v1/admin/organizations/${editingRequest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editForm),
      })

      if (!res.ok) {
        const error = await res.json()
        // Error is already handled by state in edit modal
        console.error("Failed to update organization:", error.error || "Unknown error")
        return
      }

      setIsEditOpen(false)
      setEditingRequest(null)
      setIsDetailsOpen(false)
      await loadData()
    } catch (error) {
      console.error("Error updating organization:", error)
      // Error is already handled by state in edit modal
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "approved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const pendingCount = requests.filter((r) => r.verificationStatus === "pending").length
  const approvedCount = requests.filter((r) => r.verificationStatus === "approved").length
  const rejectedCount = requests.filter((r) => r.verificationStatus === "rejected").length

  if (status === "loading") {
    return <LoadingScreen message="Loading session..." />
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
          <DashboardSidebar
            userRole="admin"
            badgeCounts={{
              organizations: undefined,
              verificationRequests: pendingCount,
            }}
          />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Verification Requests</h1>
                <p className="text-muted-foreground">
                  Review and manage organization and credential verification requests
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { label: "All", value: "all", count: requests.length },
                  { label: "Pending", value: "pending", count: pendingCount },
                  { label: "Approved", value: "approved", count: approvedCount },
                  { label: "Rejected", value: "rejected", count: rejectedCount },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedFilter(tab.value as "all" | "pending" | "approved" | "rejected")}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                      selectedFilter === tab.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Verification Requests Table */}
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Proof</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No verification requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium text-foreground">{request.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(request.verificationStatus)}
                                <Badge variant="outline" className={`capitalize font-medium ${getStatusColor(request.verificationStatus)}`}>
                                  {request.verificationStatus}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(request.submittedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {request.verificationProof ? (
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                ) : (
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-sm text-muted-foreground">
                                  {request.verificationProof ? "Uploaded" : "None"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog
                                open={isDetailsOpen && selectedRequest?.id === request.id}
                                onOpenChange={setIsDetailsOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                                    Review
                                  </Button>
                                </DialogTrigger>
                                {selectedRequest && (
                                  <DialogContent className="max-w-2xl bg-card border-border/50 max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Verification Request - {selectedRequest.name}</DialogTitle>
                                      <DialogDescription>
                                        Review and take action on this verification request
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6">
                                      {/* Request Details */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs text-muted-foreground">Organization</p>
                                          <p className="font-medium text-foreground">{selectedRequest.name}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Status</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            {getStatusIcon(selectedRequest.verificationStatus)}
                                            <Badge variant="outline" className={`capitalize ${getStatusColor(selectedRequest.verificationStatus)}`}>
                                              {selectedRequest.verificationStatus}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Website</p>
                                          <p className="font-medium text-foreground">{selectedRequest.website || "-"}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Submitted At</p>
                                          <p className="font-medium text-foreground">
                                            {new Date(selectedRequest.submittedAt).toLocaleString()}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Issuers</p>
                                          <p className="font-medium text-foreground">{selectedRequest.issuers.length}</p>
                                        </div>
                                      </div>

                                      {/* Issuers List */}
                                      {selectedRequest.issuers.length > 0 && (
                                        <div className="border-t border-border/50 pt-4">
                                          <p className="font-medium text-foreground mb-3">Issuer Users</p>
                                          <div className="space-y-2">
                                            {selectedRequest.issuers.map((issuer) => (
                                              <div key={issuer.id} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                                                <div className="flex-1">
                                                  <p className="text-sm font-medium text-foreground">{issuer.name}</p>
                                                  <p className="text-xs text-muted-foreground">{issuer.email}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Verification Proof */}
                                      {selectedRequest.verificationProof && (
                                        <div className="border-t border-border/50 pt-4">
                                          <p className="font-medium text-foreground mb-3">Verification Proof</p>
                                          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border/50">
                                            <Image
                                              src={selectedRequest.verificationProof}
                                              alt="Verification proof"
                                              fill
                                              className="object-contain"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Description */}
                                      {selectedRequest.description && (
                                        <div className="border-t border-border/50 pt-4">
                                          <p className="font-medium text-foreground mb-2">Description</p>
                                          <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                                            {selectedRequest.description}
                                          </p>
                                        </div>
                                      )}

                                      {/* Decision Section - Only show for pending */}
                                      {selectedRequest.verificationStatus === "pending" && (
                                        <div className="border-t border-border/50 pt-4">
                                          <label className="block font-medium text-foreground mb-2">
                                            Decision Notes <span className="text-muted-foreground text-sm">(Required for rejection)</span>
                                          </label>
                                          <textarea
                                            placeholder="Add notes about your decision..."
                                            value={decisionNotes}
                                            onChange={(e) => setDecisionNotes(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary min-h-24"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                                        Close
                                      </Button>
                                      {selectedRequest.verificationStatus === "pending" && (
                                        <>
                                          <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => {
                                              setIsDetailsOpen(false)
                                              handleEditClick(selectedRequest)
                                            }}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                            Edit
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            className="gap-2"
                                            onClick={() => handleRejectClick(selectedRequest.id)}
                                            disabled={processingId === selectedRequest.id}
                                          >
                                            <XCircle className="h-4 w-4" />
                                            {processingId === selectedRequest.id ? "Processing..." : "Reject"}
                                          </Button>
                                          <PrimaryButton
                                            className="gap-2"
                                            onClick={() => handleApproveClick(selectedRequest.id)}
                                            disabled={processingId === selectedRequest.id}
                                          >
                                            <CheckCircle className="h-4 w-4" />
                                            {processingId === selectedRequest.id ? "Processing..." : "Approve"}
                                          </PrimaryButton>
                                        </>
                                      )}
                                    </DialogFooter>
                                  </DialogContent>
                                )}
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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

              {/* Approve Confirmation Modal */}
              <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
                <DialogContent className="bg-card border-border/50">
                  <DialogHeader>
                    <DialogTitle>Approve Organization</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to approve this organization? This action will verify the organization and allow them to issue credentials.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setShowApproveConfirm(false)
                      setPendingActionId(null)
                    }}>
                      Cancel
                    </Button>
                    <PrimaryButton onClick={handleApprove} disabled={processingId !== null}>
                      {processingId ? "Processing..." : "Approve"}
                    </PrimaryButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Reject Confirmation Modal */}
              <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
                <DialogContent className="bg-card border-border/50">
                  <DialogHeader>
                    <DialogTitle>Reject Organization</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to reject this organization? Please ensure you have provided a reason in the decision notes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Rejection Reason</label>
                    <textarea
                      placeholder="Enter reason for rejection..."
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary min-h-24"
                      required
                    />
                    {errorMessage && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setShowRejectConfirm(false)
                      setPendingActionId(null)
                      setErrorMessage(null)
                    }}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={processingId !== null || !decisionNotes.trim()}
                    >
                      {processingId ? "Processing..." : "Reject"}
                    </Button>
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

