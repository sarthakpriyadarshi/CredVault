"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
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
    <div className="min-h-screen w-full bg-black relative flex items-center justify-center">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
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

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {status === "loading" && "Verifying Email..."}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            {/* Action buttons */}
            {status === "success" && (
              <div className="space-y-3 pt-4">
                <PrimaryButton
                  onClick={() => router.push("/login")}
                  className="w-full"
                >
                  Sign In to Your Account
                </PrimaryButton>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3 pt-4">
                <PrimaryButton
                  onClick={() => router.push("/signup")}
                  className="w-full"
                >
                  Sign Up Again
                </PrimaryButton>
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="mailto:support@credvault.app" className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
