"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Shield, Download } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"

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

export default function PublicVerifyCredentialPage() {
  const params = useParams()
  const credentialId = params?.id as string

  const [credential, setCredential] = useState<Credential | null>(null)
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (credentialId) {
      loadVerification()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialId])

  const loadVerification = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/credentials/${credentialId}/verify`)

      if (!res.ok) {
        if (res.status === 404) {
          setError("Credential not found")
          return
        }
        const errorData = await res.json()
        setError(errorData.error || "Failed to verify credential")
        return
      }

      const data = await res.json()
      setCredential(data.credential)
      setVerification(data.verification)
    } catch (error) {
      console.error("Error loading verification:", error)
      setError("An error occurred while verifying the credential")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !credential || !verification) {
    return (
      <div className="min-h-screen w-full bg-black relative">
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements - fixed to viewport */}
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 overflow-x-hidden pt-20">
          <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <XCircle className="h-16 w-16 mx-auto text-red-400" />
                <h1 className="text-3xl font-bold text-foreground">Credential Not Found</h1>
                <p className="text-muted-foreground">{error || "The credential you are looking for does not exist."}</p>
              </div>
            </div>
          </main>
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

      {/* Header */}
      <header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 md:px-6 py-3">
        <a
          className="flex items-center justify-center gap-2"
          href="/"
        >
          <img
            src="/logo.svg"
            alt="CredVault Logo"
            className="rounded-full size-8 w-8 h-8 object-contain"
          />
          <span className="text-lg font-bold text-foreground">CredVault</span>
        </a>

        <div className="flex items-center gap-4">
          <a
            href="/auth/login"
            className="font-medium transition-colors hover:text-foreground text-muted-foreground text-sm cursor-pointer"
          >
            Log In
          </a>

          <a
            href="/auth/signup"
            className="rounded-md font-bold cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm"
          >
            Sign Up
          </a>
        </div>
      </header>

      <div className="relative z-10 overflow-x-hidden pt-8">
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto">
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-foreground">Credential Verification</h1>
              <p className="text-muted-foreground">Verify the authenticity of a credential</p>
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
  )
}

