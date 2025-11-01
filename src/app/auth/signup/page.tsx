"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, User } from "lucide-react"
export default function RecipientSignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      // Create user account via API route
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "recipient",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific API errors
        let errorMessage = data.error || "Failed to create account"
        
        if (data.error === "User already exists" || data.error === "An account with this email already exists") {
          errorMessage = "An account with this email already exists. Please sign in instead."
        } else if (data.error === "Invalid email format") {
          errorMessage = "Please enter a valid email address."
        } else if (data.error === "Password must be at least 8 characters") {
          errorMessage = "Password must be at least 8 characters long."
        } else if (data.error === "Missing required fields") {
          errorMessage = "Please fill in all required fields."
        }
        
        setError(errorMessage)
        return
      }

      // Auto sign in with NextAuth
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        role: "recipient",
        redirect: false,
      })

      if (result?.error) {
        let errorMessage = "Account created but sign in failed. Please try logging in."
        
        if (result.error.includes("Invalid email or password")) {
          errorMessage = "Account created successfully! Please sign in with your credentials."
        } else if (result.error) {
          errorMessage = `Account created but sign in failed: ${result.error}. Please try logging in.`
        }
        
        setError(errorMessage)
      } else if (result?.ok) {
        router.push("/dashboard/recipient")
      } else {
        setError("Account created but sign in failed. Please try logging in.")
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "An error occurred. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = (provider: "google" | "github") => {
    // Store role in cookie before OAuth
    document.cookie = `oauth_role=recipient; path=/; max-age=900; SameSite=Lax`
    signIn(provider, { callbackUrl: "/dashboard/recipient?role=recipient" })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-x-hidden">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="container mx-auto px-4 w-full flex items-center justify-center py-8 relative z-10">
        <div className="flex gap-6 w-full max-w-4xl">
          {/* Vertical Tabs */}
          <div className="shrink-0 w-64">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 sticky top-24">
              <Link
                href="/auth/signup"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-primary/20 border border-primary/50 text-white"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Recipient</span>
              </Link>
              <Link
                href="/auth/issuer/signup"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mt-2 transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Organization</span>
              </Link>
            </div>
          </div>

          {/* Signup Form */}
          <div className="flex-1">
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
              <img src="/logo.svg" alt="Logo" className="rounded-full size-8 w-8 h-8 object-contain" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-zinc-400">Join CredVault to receive your credentials</p>
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={formData.password}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="flex items-start space-x-2">
              <label htmlFor="terms" className="flex items-start space-x-2 text-sm cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    id="terms"
                    className="peer sr-only"
                    required
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
                <span className="text-zinc-300">
                  I agree to the{" "}
                  <Link href="#" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <PrimaryButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </PrimaryButton>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-zinc-400">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-xs text-zinc-500">
              Are you an admin?{" "}
              <Link href="/auth/admin/login" className="text-primary/80 hover:text-primary transition-colors underline-offset-4 hover:underline">
                Admin Login
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Social Signup */}
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

