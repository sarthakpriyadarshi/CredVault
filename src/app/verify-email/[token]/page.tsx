"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { PrimaryButton } from "@/components/ui/primary-button"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    params.then((resolvedParams) => {
      setToken(resolvedParams.token)
    })
  }, [params])

  useEffect(() => {
    if (!token) return

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (res.ok) {
          setStatus("success")
          setMessage("Your email has been verified successfully!")
        } else {
          setStatus("error")
          setMessage(data.error || "Failed to verify email")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setMessage("An error occurred while verifying your email")
      }
    }

    verifyEmail()
  }, [token])

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
              <h1 className="text-3xl font-bold text-white mb-2">
                {status === "loading" && "Verifying Email..."}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </h1>
              <p className="text-zinc-400">
                {status === "loading" && "Please wait while we verify your email address"}
                {status === "success" && "You can now sign in to your account"}
                {status === "error" && "We couldn't verify your email address"}
              </p>
            </div>

            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
            >
              <div className="text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  {status === "loading" && (
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  )}
                  {status === "success" && (
                    <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  )}
                  {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
                </div>

                {/* Message */}
                <div>
                  <p className="text-zinc-300">{message}</p>
                </div>

                {/* Action buttons */}
                {status === "success" && (
                  <div className="space-y-3 pt-4">
                    <PrimaryButton
                      onClick={() => router.push("/auth/login")}
                      className="w-full"
                    >
                      Sign In to Your Account
                    </PrimaryButton>
                  </div>
                )}

                {status === "error" && (
                  <div className="space-y-3 pt-4">
                    <PrimaryButton
                      onClick={() => router.push("/auth/signup")}
                      className="w-full"
                    >
                      Sign Up Again
                    </PrimaryButton>
                    <Link href="/auth/login" className="block">
                      <Button variant="outline" className="w-full bg-transparent border-zinc-700 text-white hover:bg-zinc-800">
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-zinc-400">
              <p>
                Need help?{" "}
                <a href="mailto:support@credvault.app" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
