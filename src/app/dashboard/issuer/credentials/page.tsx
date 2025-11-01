"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Eye, Ban, Download, FileText, CheckCircle2, Clock } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"

interface Credential {
  id: string
  templateName: string
  templateCategory?: string
  recipientEmail: string
  recipientName: string
  type: "certificate" | "badge" | "both"
  status: "active" | "expired" | "revoked"
  isOnBlockchain: boolean
  issuedAt: string
  expiresAt?: string
  revokedAt?: string
  certificateUrl?: string
  badgeUrl?: string
  credentialData: Record<string, unknown>
}

export default function ManageCredentialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "revoked" | "expired">("all")
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && !session.user?.isVerified) {
      router.push("/auth/issuer/login?pending=true")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && session.user?.isVerified) {
      loadCredentials()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, filter])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("filter", filter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const res = await fetch(`/api/v1/issuer/credentials?${params.toString()}`, {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        console.error("Failed to fetch credentials:", res.statusText)
      } else {
        const data = await res.json()
        const credentialsList = data.data || data || []
        setCredentials(
          credentialsList.map((cred: {
            id?: string
            _id?: { toString: () => string }
            templateName?: string
            templateCategory?: string
            recipientEmail?: string
            recipientName?: string
            type?: string
            status?: string
            isOnBlockchain?: boolean
            issuedAt?: string
            expiresAt?: string
            revokedAt?: string
            certificateUrl?: string
            badgeUrl?: string
            credentialData?: Record<string, unknown>
          }) => ({
            id: cred.id || cred._id?.toString() || "",
            templateName: cred.templateName || "Unknown Template",
            templateCategory: cred.templateCategory || "general",
            recipientEmail: cred.recipientEmail || "",
            recipientName: cred.recipientName || "Unknown",
            type: cred.type || "certificate",
            status: cred.status || "active",
            isOnBlockchain: cred.isOnBlockchain || false,
            issuedAt: cred.issuedAt ? new Date(cred.issuedAt).toISOString() : new Date().toISOString(),
            expiresAt: cred.expiresAt,
            revokedAt: cred.revokedAt,
            certificateUrl: cred.certificateUrl,
            badgeUrl: cred.badgeUrl,
            credentialData: cred.credentialData || {},
          }))
        )
      }
    } catch (error) {
      console.error("Error loading credentials:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "issuer" && session.user?.isVerified) {
      loadCredentials()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchTerm])

  const handleRevoke = async () => {
    if (!selectedCredential) return

    setRevoking(true)
    try {
      const res = await fetch(`/api/v1/issuer/credentials/${selectedCredential.id}/revoke`, {
        method: "PUT",
        credentials: "include",
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "Failed to revoke credential")
        return
      }

      await loadCredentials()
      setShowRevokeDialog(false)
      setSelectedCredential(null)
    } catch (error) {
      console.error("Error revoking credential:", error)
      alert("An error occurred while revoking credential")
    } finally {
      setRevoking(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleDownload = (url: string, filename: string) => {
    if (!url) return

    // Check if it's a base64 data URL
    if (url.startsWith("data:")) {
      // Create a temporary link element and trigger download
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // For regular URLs, open in new tab
      window.open(url, "_blank")
    }
  }

  const filteredCredentials = credentials.filter((cred) => {
    if (filter === "all") return true
    return cred.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "revoked":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            <Ban className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
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
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Manage Credentials</h1>
                  <p className="text-muted-foreground">View, manage, and revoke issued credentials</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by recipient email or template name..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="bg-card/50 border-border/50 pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    className={filter === "all" ? "" : "bg-transparent"}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "active" ? "default" : "outline"}
                    onClick={() => setFilter("active")}
                    className={filter === "active" ? "" : "bg-transparent"}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === "revoked" ? "default" : "outline"}
                    onClick={() => setFilter("revoked")}
                    className={filter === "revoked" ? "" : "bg-transparent"}
                  >
                    Revoked
                  </Button>
                  <Button
                    variant={filter === "expired" ? "default" : "outline"}
                    onClick={() => setFilter("expired")}
                    className={filter === "expired" ? "" : "bg-transparent"}
                  >
                    Expired
                  </Button>
                </div>
              </div>

              {/* Credentials Table */}
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead>Blockchain</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Loading credentials...
                          </TableCell>
                        </TableRow>
                      ) : filteredCredentials.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No credentials found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCredentials.map((credential) => (
                          <TableRow key={credential.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{credential.templateName}</span>
                              </div>
                            </TableCell>
                            <TableCell>{credential.recipientName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{credential.recipientEmail}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {credential.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(credential.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(credential.issuedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              {credential.isOnBlockchain ? (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  No
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCredential(credential)
                                    setShowViewDialog(true)
                                  }}
                                  className="bg-transparent"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {credential.status !== "revoked" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCredential(credential)
                                      setShowRevokeDialog(true)
                                    }}
                                    className="bg-transparent text-destructive hover:text-destructive"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                                {(credential.certificateUrl || credential.badgeUrl) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const url = credential.certificateUrl || credential.badgeUrl
                                      if (url) {
                                        const filename = credential.certificateUrl
                                          ? `${credential.templateName.replace(/\s+/g, "_")}_certificate.png`
                                          : `${credential.templateName.replace(/\s+/g, "_")}_badge.png`
                                        handleDownload(url, filename)
                                      }
                                    }}
                                    className="bg-transparent"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={(open) => {
        setShowRevokeDialog(open)
        if (!open) {
          setSelectedCredential(null)
        }
      }}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Revoke Credential</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this credential? This action cannot be undone. The recipient will no longer be able to verify or use this credential.
            </DialogDescription>
          </DialogHeader>
          {selectedCredential && (
            <div className="space-y-2 p-4 bg-background/50 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Template:</span> {selectedCredential.templateName}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Recipient:</span> {selectedCredential.recipientEmail}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Issued:</span>{" "}
                {new Date(selectedCredential.issuedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeDialog(false)
                setSelectedCredential(null)
              }}
              disabled={revoking}
            >
              Cancel
            </Button>
            <PrimaryButton
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-destructive hover:bg-destructive/80"
            >
              {revoking ? "Revoking..." : "Revoke Credential"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Credential Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(open) => {
        setShowViewDialog(open)
        if (!open) {
          setSelectedCredential(null)
        }
      }}>
        <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credential Details</DialogTitle>
            <DialogDescription>
              Complete information about this credential
            </DialogDescription>
          </DialogHeader>
          {selectedCredential && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Template</p>
                  <p className="text-foreground">{selectedCredential.templateName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Type</p>
                  <Badge variant="outline">{selectedCredential.type}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Recipient Name</p>
                  <p className="text-foreground">{selectedCredential.recipientName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Email</p>
                  <p className="text-foreground">{selectedCredential.recipientEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Status</p>
                  {getStatusBadge(selectedCredential.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Blockchain</p>
                  {selectedCredential.isOnBlockchain ? (
                    <Badge className="bg-blue-500/20 text-blue-400">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Issued At</p>
                  <p className="text-foreground">
                    {new Date(selectedCredential.issuedAt).toLocaleString()}
                  </p>
                </div>
                {selectedCredential.expiresAt && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Expires At</p>
                    <p className="text-foreground">
                      {new Date(selectedCredential.expiresAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedCredential.revokedAt && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Revoked At</p>
                    <p className="text-foreground">
                      {new Date(selectedCredential.revokedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50">
                <p className="text-sm font-semibold text-muted-foreground">Credential Data</p>
                <div className="bg-background/50 p-4 rounded-lg">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(selectedCredential.credentialData, null, 2)}
                  </pre>
                </div>
              </div>

              {(selectedCredential.certificateUrl || selectedCredential.badgeUrl) && (
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <p className="text-sm font-semibold text-muted-foreground">Downloads</p>
                  <div className="flex gap-2">
                    {selectedCredential.certificateUrl && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const filename = `${selectedCredential.templateName.replace(/\s+/g, "_")}_certificate.png`
                          handleDownload(selectedCredential.certificateUrl!, filename)
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Certificate
                      </Button>
                    )}
                    {selectedCredential.badgeUrl && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const filename = `${selectedCredential.templateName.replace(/\s+/g, "_")}_badge.png`
                          handleDownload(selectedCredential.badgeUrl!, filename)
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Badge
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

