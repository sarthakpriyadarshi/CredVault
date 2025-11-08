"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Shield,
  Download,
  ExternalLink,
  Share2,
  Blocks,
  Loader2,
} from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingScreen } from "@/components/loading-screen";

interface VerificationResult {
  verified: boolean;
  method: "blockchain" | "database";
  message: string;
  details?: {
    vaultFid?: string | null;
    vaultCid?: string | null;
    vaultUrl?: string | null;
    transactionId?: string | null;
    network?: string | null;
    blockchainVerified?: boolean;
    blockchainVerifiedAt?: string | null;
    vaultIssuer?: string | null;
  };
}

interface Credential {
  id: string;
  title: string;
  issuer: string;
  recipientEmail: string;
  credentialData: Record<string, string | number | boolean | null>;
  type: "certificate" | "badge" | "both";
  issuedAt: string;
  expiresAt: string | null;
  certificateUrl: string | null;
  badgeUrl: string | null;
}

export default function PublicVerifyCredentialPage() {
  const params = useParams();
  const credentialId = params?.id as string;

  const [credential, setCredential] = useState<Credential | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"certificate" | "badge">(
    "certificate"
  );

  const blockscoutUrl =
    process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || "http://localhost:26000";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  // Determine which tab to show initially
  useEffect(() => {
    if (credential) {
      if (credential.type === "both") {
        // Default to certificate if both are available
        setActiveTab(credential.certificateUrl ? "certificate" : "badge");
      } else if (credential.type === "badge") {
        setActiveTab("badge");
      } else {
        setActiveTab("certificate");
      }
    }
  }, [credential]);

  useEffect(() => {
    if (credentialId) {
      loadVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialId]);

  const loadVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/credentials/${credentialId}/verify`);

      if (!res.ok) {
        if (res.status === 404) {
          setError("Credential not found");
          return;
        }
        const errorData = await res.json();
        setError(errorData.error || "Failed to verify credential");
        return;
      }

      const data = await res.json();
      setCredential(data.credential);
      setVerification(data.verification);
    } catch (error) {
      console.error("Error loading verification:", error);
      setError("An error occurred while verifying the credential");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBlockchain = async () => {
    if (!credentialId) return;

    setVerifying(true);
    try {
      // Call POST endpoint to trigger blockchain verification
      const res = await fetch(`/api/v1/credentials/${credentialId}/verify`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        setDialogTitle("Verification Failed");
        setDialogMessage(errorData.error || "Failed to verify on blockchain");
        setDialogOpen(true);
        return;
      }

      const data = await res.json();

      if (data.verified && data.blockchainVerified) {
        // Update local state without reload
        if (verification) {
          setVerification({
            ...verification,
            details: {
              ...verification.details,
              blockchainVerified: true,
              blockchainVerifiedAt:
                data.blockchainVerifiedAt || new Date().toISOString(),
            },
          });
        }
        setDialogTitle("Verification Successful");
        setDialogMessage("✓ Credential successfully verified on blockchain!");
        setDialogOpen(true);
      } else if (data.message?.includes("already verified")) {
        // Already verified - just confirm
        setDialogTitle("Already Verified");
        setDialogMessage("✓ Credential is verified on blockchain!");
        setDialogOpen(true);
      } else {
        setDialogTitle("Verification Pending");
        setDialogMessage(
          "Blockchain verification is still pending. Please try again later."
        );
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Error verifying blockchain:", error);
      setDialogTitle("Error");
      setDialogMessage("An error occurred while verifying on blockchain");
      setDialogOpen(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleShare = (platform: string) => {
    const shareText = `Check out my verified credential: ${
      credential?.title || "Credential"
    } from ${credential?.issuer || "CredVault"}`;
    const shareUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${shareUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${shareUrl}`,
      telegram: `https://t.me/share/url?url=${shareUrl}&text=${encodedText}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
    setShareDialogOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setDialogTitle("Link Copied!");
      setDialogMessage(
        "The credential link has been copied to your clipboard."
      );
      setDialogOpen(true);
      setShareDialogOpen(false);
    } catch (error) {
      console.error("Failed to copy link:", error);
      setDialogTitle("Error");
      setDialogMessage("Failed to copy link to clipboard");
      setDialogOpen(true);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !credential || !verification) {
    return (
      <div className="min-h-screen w-full bg-black relative">
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements - fixed to viewport */}
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 overflow-x-hidden pt-20">
          <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <XCircle className="h-16 w-16 mx-auto text-red-400" />
                <h1 className="text-3xl font-bold text-foreground">
                  Credential Not Found
                </h1>
                <p className="text-muted-foreground">
                  {error ||
                    "The credential you are looking for does not exist."}
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      {/* Header */}
      <header className="sticky top-4 z-9999 mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 md:px-6 py-3">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Image
            src="/logo.svg"
            alt="CredVault Logo"
            width={32}
            height={32}
            className="rounded-full object-contain"
          />
          <span className="text-lg font-bold text-foreground">CredVault</span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="/auth/login"
            className="font-medium transition-colors hover:text-foreground text-muted-foreground text-sm cursor-pointer"
          >
            Log In
          </a>

          <a
            href="/auth/signup"
            className="rounded-md font-bold cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-linear-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm"
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
              <h1 className="text-3xl font-bold text-foreground">
                Credential Verification
              </h1>
              <p className="text-muted-foreground">
                Verify the authenticity of a credential
              </p>
            </div>

            {/* Two Column Layout: Certificate/Badge (70%) + Verification Card (30%) */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column - Certificate/Badge Preview (70%) */}
              <div className="flex-1 lg:w-[70%]">
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur flex flex-col h-full">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    {credential.type === "badge"
                      ? "Badge Preview"
                      : credential.type === "both"
                      ? "Preview"
                      : "Certificate Preview"}
                  </h2>
                  <div className="flex-1 bg-background/30 rounded-lg border border-border/30 overflow-auto flex items-center justify-center min-h-[400px] mb-4 p-4">
                    {activeTab === "certificate" &&
                    credential.certificateUrl ? (
                      credential.certificateUrl.endsWith(".pdf") ? (
                        <iframe
                          src={credential.certificateUrl}
                          className="w-full h-full"
                          title="Certificate Preview"
                        />
                      ) : (
                        <Image
                          src={credential.certificateUrl}
                          alt={credential.title}
                          width={800}
                          height={600}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          unoptimized
                        />
                      )
                    ) : activeTab === "badge" && credential.badgeUrl ? (
                      <Image
                        src={credential.badgeUrl}
                        alt={credential.title}
                        width={256}
                        height={256}
                        className="max-w-[256px] max-h-[256px] w-auto h-auto object-contain"
                        unoptimized
                      />
                    ) : credential.certificateUrl ? (
                      credential.certificateUrl.endsWith(".pdf") ? (
                        <iframe
                          src={credential.certificateUrl}
                          className="w-full h-full"
                          title="Certificate Preview"
                        />
                      ) : (
                        <Image
                          src={credential.certificateUrl}
                          alt={credential.title}
                          width={800}
                          height={600}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          unoptimized
                        />
                      )
                    ) : credential.badgeUrl ? (
                      <Image
                        src={credential.badgeUrl}
                        alt={credential.title}
                        width={256}
                        height={256}
                        className="max-w-[256px] max-h-[256px] w-auto h-auto object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <Shield className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No preview available
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Tab Switcher - Only show if both certificate and badge are available, positioned below preview */}
                  {credential.type === "both" &&
                  credential.certificateUrl &&
                  credential.badgeUrl ? (
                    <div className="flex gap-3 justify-center border-t border-border/50 pt-4">
                      <button
                        onClick={() => setActiveTab("certificate")}
                        className={`relative overflow-hidden rounded-lg transition-all ${
                          activeTab === "certificate"
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title="Certificate"
                      >
                        {credential.certificateUrl.endsWith(".pdf") ? (
                          <div className="w-16 h-16 bg-background/50 border-2 border-border flex items-center justify-center rounded-lg">
                            <span className="text-xs text-muted-foreground">
                              PDF
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={credential.certificateUrl}
                            alt="Certificate preview"
                            width={64}
                            height={64}
                            className="object-cover rounded-lg aspect-square"
                            unoptimized
                          />
                        )}
                        {activeTab === "certificate" && (
                          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("badge")}
                        className={`relative overflow-hidden rounded-lg transition-all ${
                          activeTab === "badge"
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title="Badge"
                      >
                        <Image
                          src={credential.badgeUrl}
                          alt="Badge preview"
                          width={64}
                          height={64}
                          className="object-cover rounded-lg aspect-square"
                          unoptimized
                        />
                        {activeTab === "badge" && (
                          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
                        )}
                      </button>
                    </div>
                  ) : null}
                </Card>
              </div>

              {/* Right Column - Verification Status & Blockchain Button (30%) */}
              <div className="lg:w-[30%]">
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur h-full">
                  <div className="space-y-6">
                    {/* Verification Status */}
                    <div>
                      <h2 className="text-lg font-semibold text-foreground mb-3">
                        {credential.title}
                      </h2>
                      <div
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                          verification.verified ||
                          (verification.method === "blockchain" &&
                            verification.details?.blockchainVerified)
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {verification.verified ||
                        (verification.method === "blockchain" &&
                          verification.details?.blockchainVerified) ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        <span className="font-medium text-sm">
                          {verification.verified ||
                          (verification.method === "blockchain" &&
                            verification.details?.blockchainVerified)
                            ? "Verified"
                            : "Not Verified"}
                        </span>
                      </div>

                      {/* Verify Button - Always show for blockchain credentials */}
                      {verification.method === "blockchain" &&
                        (verification.details?.vaultFid ||
                          verification.details?.transactionId) && (
                          <PrimaryButton
                            onClick={handleVerifyBlockchain}
                            disabled={verifying}
                            className={`w-full mt-3 text-white shadow-[0px_2px_0px_0px_rgba(220,38,38,0.3)_inset] ${
                              verification.details?.blockchainVerified
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            {verifying ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying on Blockchain...
                              </>
                            ) : verification.details?.blockchainVerified ? (
                              <>
                                <Blocks className="h-4 w-4 mr-2" />
                                Re-Verify on Blockchain
                              </>
                            ) : (
                              <>
                                <Blocks className="h-4 w-4 mr-2" />
                                Verify Me on Blockchain
                              </>
                            )}
                          </PrimaryButton>
                        )}
                    </div>

                    {/* Transaction ID - Show only for blockchain credentials */}
                    {verification.method === "blockchain" &&
                      verification.details?.transactionId && (
                        <div className="p-3 bg-background/50 rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1.5">
                              Transaction ID
                            </p>
                            <a
                              href={`${blockscoutUrl}/tx/${verification.details.transactionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-primary hover:underline break-all inline-flex items-center gap-1"
                            >
                              {verification.details.transactionId.length > 20
                                ? `${verification.details.transactionId.slice(
                                    0,
                                    10
                                  )}...${verification.details.transactionId.slice(
                                    -10
                                  )}`
                                : verification.details.transactionId}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                        </div>
                      )}

                    {/* Credential Info - Show for non-blockchain records to fill space */}
                    {verification.method !== "blockchain" && (
                      <div className="p-3 bg-background/50 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Issuer
                          </p>
                          <p className="text-xs font-medium text-foreground">
                            {credential.issuer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Recipient
                          </p>
                          <p className="text-xs font-medium text-foreground">
                            {credential.recipientEmail}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Issued On
                          </p>
                          <p className="text-xs font-medium text-foreground">
                            {new Date(credential.issuedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        {credential.expiresAt && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Expires On
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {new Date(
                                credential.expiresAt
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verification Method */}
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="flex flex-col items-center text-center gap-2">
                        {verification.method === "blockchain" &&
                        verification.details?.blockchainVerified ? (
                          <Blocks className="h-4 w-4 text-emerald-400" />
                        ) : verification.method === "blockchain" ? (
                          <Blocks className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            <span className="capitalize">
                              {verification.method}
                            </span>{" "}
                            Verification
                            {verification.method === "blockchain" &&
                              verification.details?.blockchainVerified && (
                                <span className="text-emerald-400"> ✓</span>
                              )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {verification.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-border/50">
                      {/* Share Button */}
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setShareDialogOpen(true)}
                      >
                        <Share2 className="h-4 w-4" />
                        Share Credential
                      </Button>

                      {credential.certificateUrl && (
                        <PrimaryButton className="w-full gap-2" asChild>
                          <a href={credential.certificateUrl} download>
                            <Download className="h-4 w-4" />
                            Download Certificate
                          </a>
                        </PrimaryButton>
                      )}
                      {credential.badgeUrl && (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          asChild
                        >
                          <a href={credential.badgeUrl} download>
                            <Download className="h-4 w-4" />
                            Download Badge
                          </a>
                        </Button>
                      )}

                      {/* Powered by VAULT Protocol */}
                      {verification.method === "blockchain" &&
                        verification.details?.transactionId && (
                          <div className="pt-3 mt-3 border-t border-border/50 text-center">
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                              <svg
                                width="32"
                                height="32"
                                viewBox="15 15 70 70"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-labelledby="Vault Protocol"
                                role="img"
                                className="shrink-0"
                              >
                                <title id="Vault Protocol">
                                  Vault Protocol
                                </title>
                                <rect
                                  x="20"
                                  y="20"
                                  width="60"
                                  height="60"
                                  rx="10"
                                  ry="10"
                                  fill="oklch(0.32 0 0)"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="22"
                                  fill="oklch(0.70 0.20 15)"
                                />
                                <rect
                                  x="36"
                                  y="45"
                                  width="6"
                                  height="11"
                                  rx="1.5"
                                  ry="1.5"
                                  fill="oklch(0.1797 0.0043 308.1928)"
                                />
                                <rect
                                  x="58"
                                  y="45"
                                  width="6"
                                  height="11"
                                  rx="1.5"
                                  ry="1.5"
                                  fill="oklch(0.1797 0.0043 308.1928)"
                                />
                                <rect
                                  x="43"
                                  y="49"
                                  width="14"
                                  height="3"
                                  rx="0.5"
                                  ry="0.5"
                                  fill="oklch(0.1797 0.0043 308.1928)"
                                />
                              </svg>
                              Powered by VAULT Protocol
                            </p>
                            <a
                              href={`${blockscoutUrl}/tx/${verification.details.transactionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                            >
                              View on BlockScout
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Full Width Row Below - Credential Details & Blockchain Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Credential Details */}
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Credential Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Issuer</p>
                    <p className="text-sm font-medium text-foreground">
                      {credential.issuer}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Recipient
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {credential.recipientEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Issued On
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(credential.issuedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  {credential.expiresAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Expires On
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(credential.expiresAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Additional Details - Only for non-blockchain records */}
              {verification.method !== "blockchain" &&
                Object.keys(credential.credentialData).length > 0 && (
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Additional Details
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(credential.credentialData).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="p-2 bg-background/50 rounded-lg"
                          >
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {key}
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                )}

              {/* Blockchain Details */}
              {verification.method === "blockchain" && verification.details && (
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Blocks className="h-4 w-4" />
                    Blockchain Verification
                  </h3>
                  <div className="space-y-3">
                    {/* Verification Status */}
                    {verification.details.blockchainVerified && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <p className="text-sm font-medium text-emerald-400">
                            Verified on Blockchain
                          </p>
                        </div>
                        {verification.details.blockchainVerifiedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(
                              verification.details.blockchainVerifiedAt
                            ).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* VAULT Protocol Details */}
                    {verification.details.vaultFid && (
                      <div className="p-2 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          VAULT File ID (FID)
                        </p>
                        <p className="font-mono text-xs text-foreground break-all">
                          {verification.details.vaultFid}
                        </p>
                      </div>
                    )}

                    {verification.details.vaultCid && (
                      <div className="p-2 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          IPFS Content ID (CID)
                        </p>
                        <p className="font-mono text-xs text-foreground break-all">
                          {verification.details.vaultCid}
                        </p>
                      </div>
                    )}

                    {verification.details.vaultIssuer && (
                      <div className="p-2 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Issuer Address
                        </p>
                        <p className="font-mono text-xs text-foreground break-all">
                          {verification.details.vaultIssuer}
                        </p>
                      </div>
                    )}

                    {verification.details.transactionId && (
                      <div className="p-2 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Transaction ID
                        </p>
                        <a
                          href={`${blockscoutUrl}/tx/${verification.details.transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary hover:underline break-all flex items-center gap-1"
                        >
                          {verification.details.transactionId.length > 30
                            ? `${verification.details.transactionId.slice(
                                0,
                                15
                              )}...${verification.details.transactionId.slice(
                                -15
                              )}`
                            : verification.details.transactionId}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {verification.details.network && (
                      <div className="p-2 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Network
                        </p>
                        <p className="text-xs font-medium text-foreground">
                          {verification.details.network}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dialog for verification feedback */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Credential</DialogTitle>
            <DialogDescription>
              Share this verified credential on social media or copy the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Social Media Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleShare("twitter")}
                className="w-full gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("linkedin")}
                className="w-full gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("facebook")}
                className="w-full gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("whatsapp")}
                className="w-full gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
            </div>

            {/* Copy Link Button */}
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
