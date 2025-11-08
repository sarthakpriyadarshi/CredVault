"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingScreen } from "@/components/loading-screen"

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    checkSetupStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkSetupStatus = async () => {
    try {
      // Use direct=true to bypass cache and get fresh data
      const res = await fetch("/api/v1/admin/setup?direct=true")
      const data = await res.json()

      if (!data.setupNeeded) {
        // Setup already complete, redirect to home
        router.push("/")
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error checking setup status:", error)
      // On error, redirect to home for safety
      router.push("/")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setCreating(true)

    try {
      const res = await fetch("/api/v1/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create admin user")
        return
      }

      // Success! Show modal then redirect to admin login
      setShowSuccessModal(true)
      
      // Close modal and redirect to admin login after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false)
        // Allow modal to close before navigation
        setTimeout(() => {
          router.push("/auth/admin/login")
        }, 100)
      }, 2000)
    } catch (error) {
      console.error("Error creating admin:", error)
      setError("An error occurred while creating admin user")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-x-hidden">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="container mx-auto px-4 w-full flex items-center justify-center py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-2">
                <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to CredVault</h1>
            <p className="text-zinc-400">Let&apos;s set up your admin account to get started</p>
          </div>

          {/* Setup Form */}
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
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20"
                  required
                />
              </div>

              <PrimaryButton
                type="submit"
                disabled={creating}
                className="w-full"
              >
                {creating ? "Creating Admin Account..." : "Create Admin Account"}
              </PrimaryButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                This is a one-time setup. You&apos;ll be redirected to login after completion.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Admin Account Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2">
              Your admin account has been created successfully. Please sign in to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm text-zinc-400 mt-2">Redirecting to login page...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
