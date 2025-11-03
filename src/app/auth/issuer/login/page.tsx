"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthSidebar } from "@/components/auth-sidebar"
import { LoadingScreen } from "@/components/loading-screen"

function IssuerLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [pendingMessage, setPendingMessage] = useState(false)
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("pending") === "true") {
      setPendingMessage(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setPendingMessage(false)

    try {
      // First, check if the user's role matches via API (for better error handling)
      const checkResponse = await fetch("/api/v1/auth/check-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "issuer" }),
      })

      if (!checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.error) {
          if (checkData.error.includes("verification") || checkData.error.includes("pending")) {
            setPendingMessage(true)
          }
          setError(checkData.error)
          // Check if it's an email verification error
          if (checkData.error.includes("verify") && checkData.error.includes("email") && !checkData.error.includes("organization")) {
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
        role: "issuer",
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
        } else if (errorStr.includes("VERIFICATION_PENDING") || errorStr.includes("VERIFICATION_REJECTED") || (errorStr.includes("verification") && errorStr.includes("organization"))) {
          if (errorStr.includes("VERIFICATION_REJECTED")) {
            errorMessage = "Your organization verification was rejected. Please contact support."
          } else {
            errorMessage = "Your organization is pending verification. Please wait for admin approval."
          }
          setPendingMessage(true)
          setShowResendButton(false)
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
        } else {
          setShowResendButton(false)
        }
        
        setError(errorMessage)
        setResendSuccess(false)
        return
      }

      if (result?.ok) {
        router.push("/dashboard/issuer")
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

  const handleOAuth = (provider: "google" | "github") => {
    // Store role in cookie before OAuth (for backward compatibility)
    document.cookie = `oauth_role=issuer; path=/; max-age=900; SameSite=Lax`
    signIn(provider, { callbackUrl: "/dashboard/issuer?role=issuer" })
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
    } catch {
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
          <h1 className="text-3xl font-bold text-white mb-2">Organization Login</h1>
          <p className="text-zinc-400">Sign in to issue credentials and badges</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          {pendingMessage && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
              Your organization registration is pending admin verification. You&apos;ll be able to sign in once your organization is verified.
            </div>
          )}
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
                placeholder="Enter your organization email"
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
              <label htmlFor="remember-issuer" className="flex items-center space-x-2 text-sm cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="remember-issuer"
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
              <Link href="/forgot-password?from=issuer" className="text-sm text-primary hover:text-primary/80">
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
            <p className="text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link href="/auth/issuer/signup" className="text-primary hover:text-primary/80 font-medium">
                Register your organization
              </Link>
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

        {/* Social Login */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <PrimaryButton
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              className="w-full"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </PrimaryButton>
            <PrimaryButton
              type="button"
              variant="outline"
              onClick={() => handleOAuth("github")}
              className="w-full"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#ffffff"
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
              GitHub
            </PrimaryButton>
          </div>
        </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IssuerLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <IssuerLoginForm />
    </Suspense>
  )
}
