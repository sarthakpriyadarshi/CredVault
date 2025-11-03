"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthSidebar } from "@/components/auth-sidebar"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // First, check if the user's role matches via API (for better error handling)
      const checkResponse = await fetch("/api/v1/auth/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      })

      if (!checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.error) {
          setError(checkData.error)
          // Check if it's an email verification error
          if (checkData.error.includes("verify") && checkData.error.includes("email")) {
            setShowResendButton(true)
          } else {
            setShowResendButton(false)
          }
          setResendSuccess(false)
          return
        }
      }

      // Role check passed, now sign in with NextAuth
      const result = await signIn("credentials", {
        email,
        password,
        role: "admin",
        redirect: false,
      })

      if (result?.error) {
        // Fallback error handling if check-role didn't catch it
        const errorStr = String(result.error)
        let errorMessage = "Invalid email or password"
        
        // Check for email verification error first (most common after signup)
        if (errorStr.includes("EMAIL_NOT_VERIFIED") || 
            errorStr.includes("verify your email") || 
            errorStr.includes("verify") && errorStr.includes("email") ||
            errorStr.includes("Configuration") && errorStr.includes("sign")) {
          errorMessage = "Please verify your email address before signing in. Check your inbox for the verification link. If you don't see it, check your spam folder."
          setShowResendButton(true)
        } else if (errorStr.includes("Invalid role") || errorStr.includes("registered as")) {
          setShowResendButton(false)
          const parts = errorStr.match(/registered as (\w+), not (\w+)/i)
          if (parts) {
            errorMessage = `This account is registered as ${parts[1]}, not ${parts[2]}. Please use the ${parts[1]} login page.`
          } else {
            errorMessage = "Invalid role for this login page. Please use the correct login page."
          }
        } else if (errorStr) {
          const cleaned = errorStr
            .replace("CredentialsSignin: ", "")
            .replace("CallbackRouteError: ", "")
            .replace("CredentialsSignin", "")
            .trim()
          
          if (cleaned && cleaned.length > 0 && cleaned !== "CallbackRouteError") {
            // If it's a generic error that might be email verification, check it
            if (cleaned.includes("Configuration") || cleaned.includes("CallbackRouteError")) {
              errorMessage = "Please verify your email address before signing in. Check your inbox for the verification link. If you don't see it, check your spam folder."
              setShowResendButton(true)
            } else {
              setShowResendButton(false)
              errorMessage = cleaned
            }
          }
        }
        
        setError(errorMessage)
        setResendSuccess(false)
        return
      }

      if (result?.ok) {
        router.push("/dashboard/admin")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === "object" && "message" in err && typeof err.message === "string"
        ? err.message
        : "An error occurred. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter your email address first")
      return
    }

    setIsResending(true)
    setResendSuccess(false)
    setError("")

    try {
      const response = await fetch("/api/v1/auth/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send verification email. Please try again.")
        setResendSuccess(false)
      } else {
        setResendSuccess(true)
        setError("")
      }
    } catch (err) {
      setError("An error occurred while sending the verification email. Please try again.")
      setResendSuccess(false)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-x-hidden">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="container mx-auto px-4 w-full flex items-start justify-center py-8 md:py-8 pt-24 relative z-10">
        <div className="flex gap-8 w-full max-w-xl items-start">
          {/* Auth Sidebar */}
          <AuthSidebar
            recipientLink="/auth/login"
            organizationLink="/auth/issuer/login"
            adminLink="/auth/admin/login"
          />
          
          {/* Spacer for fixed sidebar on desktop only */}
          <div className="hidden md:block w-16 shrink-0" aria-hidden="true" />

          {/* Login Form - full width on mobile, remaining width on desktop */}
          <div className="flex-1 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 w-full"
            >
        {/* Header */}
        <div className="text-center mb-8 mt-8 md:mt-0">
          <Link href="/" className="inline-block mb-6">
            <div className="flex items-center justify-center space-x-2">
              <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full object-contain" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-zinc-400">Sign in to access the admin panel</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm space-y-2">
              <p>{error}</p>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  {isResending ? "Sending..." : "Resend Email"}
                </button>
              )}
            </div>
          )}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              Verification email sent successfully! Please check your inbox and spam folder.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="remember-admin" className="flex items-center space-x-2 text-sm cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="remember-admin"
                    className="peer sr-only"
                  />
                  <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 border-zinc-700 bg-zinc-800/50 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-transparent">
                    <svg
                      className="h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-zinc-300">Remember me</span>
              </label>
              <Link href="/forgot-password?from=admin" className="text-sm text-primary hover:text-primary/80">
                Forgot password?
              </Link>
            </div>

            <PrimaryButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </PrimaryButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Admin access only. Contact system administrator if you need access.
            </p>
          </div>

          {/* Privacy & Terms Links */}
          <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">
              By continuing, you agree to our{" "}
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

