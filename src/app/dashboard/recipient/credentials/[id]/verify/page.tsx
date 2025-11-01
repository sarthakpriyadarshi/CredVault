"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Shield, Download, ArrowLeft } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import Link from "next/link"

interface VerificationResult {
  verified: boolean
  method: "blockchain" | "database"
  message: string
  details?: any
}

interface Credential {
  id: string
  title: string
  issuer: string
  recipientEmail: string
  credentialData: Record<string, any>
  type: "certificate" | "badge" | "both"
  issuedAt: string
  expiresAt: string | null
  certificateUrl: string | null
  badgeUrl: string | null
}

export default function VerifyCredentialPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const credentialId = params?.id as string

  const [credential, setCredential] = useState<Credential | null>(null)
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role !== "recipient") {
      router.push("/auth/login")
    } else if (status === "authenticated" && session?.user?.role === "recipient" && credentialId) {
      loadVerification()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, credentialId])

  const loadVerification = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/credentials/${credentialId}/verify`, {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        if (res.status === 404) {
          alert("Credential not found")
          router.push("/dashboard/recipient")
          return
        }
        const error = await res.json()
        alert(error.error || "Failed to verify credential")
        return
      }

      const data = await res.json()
      setCredential(data.credential)
      setVerification(data.verification)
    } catch (error) {
      console.error("Error loading verification:", error)
      alert("An error occurred while verifying the credential")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated" || (status === "authenticated" && (!session || session.user?.role !== "recipient"))) {
    return null
  }

  if (!credential || !verification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-foreground">Credential not found</p>
          <Link href="/dashboard/recipient">
            <Button>Go Back</Button>
          </Link>
        </div>
      </div>
    )
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
              {/* Back Button */}
              <Link href="/dashboard/recipient/all">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Credentials
                </Button>
              </Link>

              {/* Header */}
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-foreground">Credential Verification</h1>
                <p className="text-muted-foreground">Verify the authenticity of your credential</p>
              </div>

              {/* Two Column Layout: Certificate (70%) + Info (30%) */}
              <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-16rem)]">
                {/* Left Column - Certificate Preview (70%) */}
                <div className="flex-1 lg:w-[70%]">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur flex flex-col h-full">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Certificate Preview</h2>
                    <div className="flex-1 bg-background/30 rounded-lg border border-border/30 overflow-auto flex items-center justify-center">
                      {credential.certificateUrl ? (
                        credential.certificateUrl.endsWith('.pdf') ? (
                          <iframe
                            src={credential.certificateUrl}
                            className="w-full h-full"
                            title="Certificate Preview"
                          />
                        ) : (
                          <img
                            src={credential.certificateUrl}
                            alt={credential.title}
                            className="w-full h-auto max-w-full"
                          />
                        )
                      ) : credential.badgeUrl ? (
                        <img
                          src={credential.badgeUrl}
                          alt={credential.title}
                          className="w-full h-auto max-w-full"
                        />
                      ) : (
                        <div className="text-center space-y-2">
                          <Shield className="h-16 w-16 mx-auto text-muted-foreground/50" />
                          <p className="text-muted-foreground">No preview available</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column - Verification Info (30%) */}
                <div className="lg:w-[30%]">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur h-full">
                    <div className="space-y-6">
                      {/* Verification Status */}
                      <div>
                        <h2 className="text-lg font-semibold text-foreground mb-3">{credential.title}</h2>
                        <div
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                            verification.verified
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {verification.verified ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                          <span className="font-medium text-sm">
                            {verification.verified ? "Verified" : "Not Verified"}
                          </span>
                        </div>
                      </div>

                      {/* Verification Method */}
                      <div className="p-3 bg-background/50 rounded-lg">
                        <div className="flex flex-col items-center text-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              <span className="capitalize">{verification.method}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{verification.message}</p>
                          </div>
                        </div>
                      </div>

                      {/* Credential Details */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issuer</p>
                          <p className="text-sm font-medium text-foreground">{credential.issuer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Recipient</p>
                          <p className="text-sm font-medium text-foreground">{credential.recipientEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issued On</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(credential.issuedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        {credential.expiresAt && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Expires On</p>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(credential.expiresAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Credential Data */}
                      {Object.keys(credential.credentialData).length > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <h3 className="text-xs font-semibold text-foreground mb-2">Additional Details</h3>
                          <div className="space-y-2">
                            {Object.entries(credential.credentialData).map(([key, value]) => (
                              <div key={key} className="p-2 bg-background/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-0.5">{key}</p>
                                <p className="text-xs font-medium text-foreground">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blockchain Details */}
                      {verification.method === "blockchain" && verification.details && (
                        <div className="pt-3 border-t border-border/50">
                          <h3 className="text-xs font-semibold text-foreground mb-2">Blockchain Info</h3>
                          <div className="space-y-2">
                            {verification.details.hash && (
                              <div className="p-2 bg-background/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-0.5">Transaction Hash</p>
                                <p className="font-mono text-xs text-foreground break-all">
                                  {verification.details.hash.slice(0, 20)}...
                                </p>
                              </div>
                            )}
                            {verification.details.network && (
                              <div className="p-2 bg-background/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-0.5">Network</p>
                                <p className="text-xs font-medium text-foreground">{verification.details.network}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-3 border-t border-border/50">
                        {credential.certificateUrl && (
                          <PrimaryButton className="w-full gap-2" asChild>
                            <a href={credential.certificateUrl} download>
                              <Download className="h-4 w-4" />
                              Download Certificate
                            </a>
                          </PrimaryButton>
                        )}
                        {credential.badgeUrl && (
                          <Button variant="outline" className="w-full gap-2" asChild>
                            <a href={credential.badgeUrl} download>
                              <Download className="h-4 w-4" />
                              Download Badge
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

