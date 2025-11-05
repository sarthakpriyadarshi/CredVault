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
import { Search, Eye, Ban, Download, FileText, CheckCircle2, Clock, Loader2 } from "lucide-react"
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
  blockchainVerified?: boolean
  blockchainVerifiedAt?: string
  vaultFid?: string
  vaultCid?: string
  issuedAt: string
  expiresAt?: string
  revokedAt?: string
  certificateUrl?: string
  badgeUrl?: string
  credentialData: Record<string, unknown>
}

// VAULT Protocol Icon Component
const VaultIcon = ({ verified, size = 32 }: { verified?: boolean, size?: number }) => {
  const bgColor = verified ? "oklch(0.95 0 0)" : "oklch(0.90 0 0)"
  const circleColor = verified ? "oklch(0.70 0.20 15)" : "oklch(0.5 0.02 270)"
  const lockColor = "oklch(0.1797 0.0043 308.1928)"
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="15 15 70 70" 
      xmlns="http://www.w3.org/2000/svg" 
      aria-labelledby="Vault Protocol" 
      role="img" 
      className="shrink-0"
      style={{ opacity: verified ? 1 : 0.6 }}
    >
      <title id="Vault Protocol">{verified ? "Verified on VAULT Protocol" : "Not verified on blockchain"}</title>
      <rect x="20" y="20" width="60" height="60" rx="10" ry="10" fill={bgColor}/>
      <circle cx="50" cy="50" r="22" fill={circleColor}/>
      <rect x="36" y="45" width="6" height="11" rx="1.5" ry="1.5" fill={lockColor}/>
      <rect x="58" y="45" width="6" height="11" rx="1.5" ry="1.5" fill={lockColor}/>
      <rect x="43" y="49" width="14" height="3" rx="0.5" ry="0.5" fill={lockColor}/>
    </svg>
  )
}

export default function ManageCredentialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "revoked" | "expired">("all")
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)

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
      loadCredentials()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, filter])

  const loadCredentials = async () => {
    setLoading(true)
    setCurrentPage(1)
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("filter", filter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      params.append("page", "1")
      params.append("limit", "10")

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
        const credentialsList = data.data || data.credentials || []
        const pagination = data.pagination
        
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
            blockchainVerified?: boolean
            blockchainVerifiedAt?: string
            vaultFid?: string
            vaultCid?: string
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
            blockchainVerified: cred.blockchainVerified || false,
            blockchainVerifiedAt: cred.blockchainVerifiedAt,
            vaultFid: cred.vaultFid,
            vaultCid: cred.vaultCid,
            issuedAt: cred.issuedAt ? new Date(cred.issuedAt).toISOString() : new Date().toISOString(),
            expiresAt: cred.expiresAt,
            revokedAt: cred.revokedAt,
            certificateUrl: cred.certificateUrl,
            badgeUrl: cred.badgeUrl,
            credentialData: cred.credentialData || {},
          }))
        )
        
        if (pagination) {
          setTotalPages(pagination.totalPages || 1)
          setHasMore(pagination.hasNext || false)
        }
      }
    } catch (error) {
      console.error("Error loading credentials:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreCredentials = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("filter", filter)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      params.append("page", nextPage.toString())
      params.append("limit", "10")

      const res = await fetch(`/api/v1/issuer/credentials?${params.toString()}`, {
        credentials: "include",
      })

      if (!res.ok) {
        console.error("Failed to fetch more credentials:", res.statusText)
        return
      }

      const data = await res.json()
      const credentialsList = data.data || data.credentials || []
      const pagination = data.pagination
      
      const newCredentials = credentialsList.map((cred: {
        id?: string
        _id?: { toString: () => string }
        templateName?: string
        templateCategory?: string
        recipientEmail?: string
        recipientName?: string
        type?: string
        status?: string
        isOnBlockchain?: boolean
        blockchainVerified?: boolean
        blockchainVerifiedAt?: string
        vaultFid?: string
        vaultCid?: string
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
        blockchainVerified: cred.blockchainVerified || false,
        blockchainVerifiedAt: cred.blockchainVerifiedAt,
        vaultFid: cred.vaultFid,
        vaultCid: cred.vaultCid,
        issuedAt: cred.issuedAt ? new Date(cred.issuedAt).toISOString() : new Date().toISOString(),
        expiresAt: cred.expiresAt,
        revokedAt: cred.revokedAt,
        certificateUrl: cred.certificateUrl,
        badgeUrl: cred.badgeUrl,
        credentialData: cred.credentialData || {},
      }))
      
      setCredentials(prev => [...prev, ...newCredentials])
      setCurrentPage(nextPage)
      
      if (pagination) {
        setTotalPages(pagination.totalPages || 1)
        setHasMore(pagination.hasNext || false)
      }
    } catch (error) {
      console.error("Error loading more credentials:", error)
    } finally {
      setLoadingMore(false)
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
        setModalMessage(error.error || "Failed to revoke credential")
        setShowErrorModal(true)
        return
      }

      await loadCredentials()
      setShowRevokeDialog(false)
      setSelectedCredential(null)
      setModalMessage("Credential revoked successfully")
      setShowSuccessModal(true)
    } catch (error) {
      console.error("Error revoking credential:", error)
      setModalMessage("An error occurred while revoking credential")
      setShowErrorModal(true)
    } finally {
      setRevoking(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleVerifyBlockchain = async (credential: Credential) => {
    if (!credential.isOnBlockchain || !credential.vaultFid) {
      setModalMessage("This credential is not registered on blockchain")
      setShowErrorModal(true)
      return
    }

    if (credential.blockchainVerified) {
      setModalMessage("This credential is already verified on blockchain")
      setShowSuccessModal(true)
      return
    }

    setVerifying(true)
    try {
      // Call POST endpoint to trigger blockchain verification
      const res = await fetch(`/api/v1/credentials/${credential.id}/verify`, {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) {
        const errorData = await res.json()
        setModalMessage(errorData.error || errorData.details || "Failed to verify credential on blockchain")
        setShowErrorModal(true)
        return
      }

      const data = await res.json()

      if (data.verified && data.blockchainVerified) {
        // Reload credentials to show updated verification status
        await loadCredentials()
        setModalMessage("✓ Credential successfully verified on blockchain!")
        setShowSuccessModal(true)
      } else if (data.message?.includes("already verified")) {
        // Already verified - just confirm
        await loadCredentials()
        setModalMessage("✓ Credential is verified on blockchain!")
        setShowSuccessModal(true)
      } else {
        setModalMessage("Blockchain verification is still pending. Please try again later.")
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error("Error verifying credential:", error)
      setModalMessage("An error occurred while verifying credential on blockchain")
      setShowErrorModal(true)
    } finally {
      setVerifying(false)
    }
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

          <main className="flex-1 md:ml-80 p-4 md:p-8 max-w-full overflow-x-hidden">
            <div className="space-y-8 max-w-full">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2 min-w-0">
                  <h1 className="text-3xl font-bold text-foreground">Manage Credentials</h1>
                  <p className="text-muted-foreground">View, manage, and revoke issued credentials</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-4 flex-col md:flex-row w-full">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by recipient email or template name..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="bg-card/50 border-border/50 pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
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
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur w-full">
                <Table className="min-w-[800px]">
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
                              <Badge variant="outline" className="text-xs capitalize">
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
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                    Yes
                                  </Badge>
                                  <VaultIcon verified={credential.blockchainVerified} size={20} />
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  No
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {credential.isOnBlockchain && !credential.blockchainVerified && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerifyBlockchain(credential)}
                                    disabled={verifying}
                                    className="bg-transparent gap-2"
                                    title="Verify on blockchain"
                                  >
                                    {verifying ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <VaultIcon verified={false} size={20} />
                                        <span className="text-xs">Verify</span>
                                      </div>
                                    )}
                                  </Button>
                                )}
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
                
                {/* Load More Button */}
                {hasMore && !loading && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={loadMoreCredentials}
                      disabled={loadingMore}
                      variant="outline"
                      className="gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <span className="text-xs text-muted-foreground">
                            (Page {currentPage} of {totalPages})
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
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
        <DialogContent className="bg-card border-border/50 max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] p-0">
          {selectedCredential && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-border/50 shrink-0">
                <DialogTitle className="text-2xl">{selectedCredential.templateName}</DialogTitle>
                <DialogDescription className="mt-1">
                  Credential for {selectedCredential.recipientName} ({selectedCredential.recipientEmail})
                </DialogDescription>
              </div>

              {/* Content - Full Width Certificate Preview */}
              <div className="flex-1 overflow-hidden p-6 flex flex-col">
                <div className="flex-1 bg-background/30 rounded-lg border border-border/30 overflow-auto flex items-center justify-center mb-6">
                  {selectedCredential.certificateUrl ? (
                    selectedCredential.certificateUrl.endsWith('.pdf') ? (
                      <iframe
                        src={selectedCredential.certificateUrl}
                        className="w-full h-full"
                        title="Certificate Preview"
                      />
                    ) : (
                      <img
                        src={selectedCredential.certificateUrl}
                        alt={selectedCredential.templateName}
                        className="w-full h-auto max-w-full"
                      />
                    )
                  ) : selectedCredential.badgeUrl ? (
                    <img
                      src={selectedCredential.badgeUrl}
                      alt={selectedCredential.templateName}
                      className="w-full h-auto max-w-full"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                      <p className="text-muted-foreground">No preview available</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 shrink-0">
                  {(selectedCredential.certificateUrl || selectedCredential.badgeUrl) && (
                    <>
                      {selectedCredential.certificateUrl && (
                        <PrimaryButton
                          className="gap-2"
                          onClick={() => {
                            const filename = `${selectedCredential.templateName.replace(
                              /\s+/g,
                              "_"
                            )}_certificate.png`
                            handleDownload(selectedCredential.certificateUrl!, filename)
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download Certificate
                        </PrimaryButton>
                      )}
                      {selectedCredential.badgeUrl && (
                        <PrimaryButton
                          className="gap-2"
                          onClick={() => {
                            const filename = `${selectedCredential.templateName.replace(
                              /\s+/g,
                              "_"
                            )}_badge.png`
                            handleDownload(selectedCredential.badgeUrl!, filename)
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download Badge
                        </PrimaryButton>
                      )}
                    </>
                  )}
                  {selectedCredential.status !== "revoked" && (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        setShowViewDialog(false)
                        setShowRevokeDialog(true)
                      }}
                    >
                      <Ban className="h-4 w-4" />
                      Revoke Credential
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

