"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthSidebar } from "@/components/auth-sidebar"

export default function ForgotPasswordPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || "Failed to send reset email")
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-x-hidden">
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements - fixed to viewport */}
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        <div className="container mx-auto px-4 w-full flex items-center justify-center py-8 md:py-8 pt-24 relative z-10">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 w-full"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full object-contain" />
                  </div>
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
                <p className="text-zinc-400">
                  If an account with email <span className="font-semibold text-white">{email}</span> exists, we&apos;ve sent password reset instructions.
                </p>
              </div>

              {/* Success Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
              >
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-zinc-300 text-left space-y-2">
                      <p className="font-semibold text-white">What&apos;s next?</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Check your inbox for the password reset email</li>
                        <li>The link will expire in 1 hour</li>
                        <li>Check your spam folder if you don&apos;t see it</li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={() => router.back()}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-zinc-400">
                <p>
                  Didn&apos;t receive the email?{" "}
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-primary hover:underline"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-x-hidden">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="container mx-auto px-4 w-full flex items-center justify-center min-h-screen relative z-10">
        <div className="flex gap-8 w-full max-w-xl items-center">
          {/* Auth Sidebar */}
          <AuthSidebar
            recipientLink="/auth/login"
            organizationLink="/auth/issuer/login"
            adminLink="/auth/admin/login"
          />
          
          {/* Spacer for fixed sidebar on desktop only */}
          <div className="hidden md:block w-16 shrink-0" aria-hidden="true" />

          {/* Form - full width on mobile, remaining width on desktop */}
          <div className="flex-1 w-full md:-mt-30">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 w-full"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full object-contain" />
                  </div>
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-zinc-400">
                  No worries! Enter your email and we&apos;ll send you reset instructions.
                </p>
              </div>

              {/* Form Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 px-4 py-3 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                      required
                      maxLength={80}
                    />
                  </div>

                  <PrimaryButton type="submit" disabled={loading} className="w-full">
                    {loading ? "Sending..." : "Send Reset Link"}
                  </PrimaryButton>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </form>
              </motion.div>

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-zinc-400">
                <p>
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
