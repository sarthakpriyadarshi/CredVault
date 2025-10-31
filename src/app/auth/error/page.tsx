"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "You do not have permission to sign in."
      case "Verification":
        return "The verification token has expired or has already been used."
      default:
        return "An error occurred during authentication."
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <img src="/logo.svg" alt="Logo" className="mx-auto w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-zinc-400">{getErrorMessage()}</p>
        </div>
        <Link href="/auth/login">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            Return to Login
          </Button>
        </Link>
      </div>
    </div>
  )
}

