"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
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
      <div className="min-h-screen w-full bg-black relative flex items-center justify-center">
        {/* Background gradient */}
        <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements */}
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 w-full max-w-md px-4">
          {/* Header outside card */}
          <div className="text-center mb-8 mt-8 md:mt-0">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-2">
                <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full object-contain" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Check Your Email</h1>
            <p className="text-muted-foreground">
              If an account with email <span className="font-semibold text-foreground">{email}</span> exists, we&apos;ve sent password reset instructions.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground text-left space-y-2">
                  <p className="font-semibold text-foreground">What&apos;s next?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Check your inbox for the password reset email</li>
                    <li>The link will expire in 1 hour</li>
                    <li>Check your spam folder if you don&apos;t see it</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black relative flex items-center justify-center">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Header outside card */}
        <div className="text-center mb-8 mt-8 md:mt-0">
          <Link href="/" className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-2">
                <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full object-contain" />
              </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
          <p className="text-muted-foreground">
            No worries! Enter your email and we&apos;ll send you reset instructions.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                required
                maxLength={80}
              />
            </div>

            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </PrimaryButton>

            <Link href="/login">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
