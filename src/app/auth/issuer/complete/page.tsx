"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { LoadingScreen } from "@/components/loading-screen"

export default function IssuerCompleteRegistrationPage() {
  const [formData, setFormData] = useState({
    organizationName: "",
    website: "",
  })

  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { data: session, status, update: updateSession } = useSession()

  useEffect(() => {
    // Skip redirect checks if form has been submitted (we're handling redirect manually)
    if (isSubmitted) {
      return
    }

    // Redirect if not authenticated or not an issuer
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
      return
    }

    if (status === "authenticated") {
      if (session.user?.role !== "issuer") {
        router.push("/dashboard/recipient")
        return
      }

      // Check if user already has an organization
      if (session.user?.organizationId) {
        router.push("/dashboard/issuer")
        return
      }
    }
  }, [session, status, router, isSubmitted])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        setError("Only image files (JPEG, PNG, GIF, WebP) are allowed")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }

      setProofFile(file)
      setError("")

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.organizationName) {
      setError("Organization name is required")
      return
    }

    if (!proofFile) {
      setError("Please upload a verification proof document (image)")
      return
    }

    setIsLoading(true)

    try {
      // First, upload the proof file
      let proofUrl = null
      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", proofFile)
        uploadFormData.append("type", "organization-proof")

        const uploadResponse = await fetch("/api/v1/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          setError(uploadError.error || "Failed to upload proof document")
          return
        }

        const uploadData = await uploadResponse.json()
        proofUrl = uploadData.base64
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr)
        setError("Failed to upload proof document. Please try again.")
        return
      }

      // Create organization for OAuth issuer
      const response = await fetch("/api/v1/issuer/create-organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          organizationName: formData.organizationName,
          website: formData.website || undefined,
          verificationProof: proofUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = data.error || "Failed to create organization"
        
        if (data.error === "Organization already exists") {
          errorMessage = "An organization with this name already exists. Please choose a different name."
        }
        
        setError(errorMessage)
        return
      }

      // Mark as submitted to prevent useEffect from interfering with redirect
      setIsSubmitted(true)

      // Success - use full page redirect to ensure fresh session is loaded
      // window.location.href forces a complete reload which triggers new session fetch
      // The ?setup=complete param tells dashboard to skip organizationId check temporarily
      console.log("[Complete] Organization created, redirecting with full page reload...")
      
      // Small delay to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Full page reload ensures fresh session from server
      window.location.href = "/dashboard/issuer?setup=complete"
    } catch (err: unknown) {
      const errorMessage = err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "An error occurred. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking session
  if (status === "loading") {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-x-hidden p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-2">
                <img src="/logo.svg" alt="Logo" className="rounded-full size-8 w-8 h-8 object-contain" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Complete Organization Registration</h1>
            <p className="text-zinc-400">Please provide your organization details to complete signup</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-white">
                Organization Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                placeholder="Enter your organization name"
                value={formData.organizationName}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-white">
                Website (optional)
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof" className="text-white">
                Verification Proof <span className="text-red-400">*</span>
              </Label>
              <p className="text-sm text-zinc-400 mb-2">
                Upload a document or image proving your organization's legitimacy (business license, registration certificate, etc.)
              </p>
              <input
                type="file"
                id="proof"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <label
                htmlFor="proof"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-zinc-800/30"
              >
                {proofPreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Building2 className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                    <span className="text-sm text-zinc-400">Click to upload proof document</span>
                  </div>
                )}
              </label>
              {proofFile && (
                <p className="text-xs text-zinc-400 mt-1">
                  Selected: {proofFile.name} ({(proofFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <PrimaryButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Submitting..." : "Complete Registration"}
            </PrimaryButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Your organization will be reviewed by an admin before approval.
            </p>
          </div>

          {/* Privacy & Terms Links */}
          <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">
              By submitting, you agree to our{" "}
              <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

