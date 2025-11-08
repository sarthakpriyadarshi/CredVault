"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // Try to get error message from API
    // OAuth errors are stored with the user's email when signIn callback fails
    const fetchError = async () => {
      if (error !== "AccessDenied") {
        return;
      }

      // Try to get email from session (may be available even on error)
      let email: string | null = null;

      if (session?.user?.email) {
        email = session.user.email;
      }

      // If we have an email, try to fetch the specific error message
      if (email) {
        try {
          const response = await fetch(
            `/api/auth/oauth-error?email=${encodeURIComponent(email)}`
          );
          const data = await response.json();
          if (data.error) {
            setErrorMessage(data.error);
            return;
          }
        } catch (err) {
          console.error("Failed to fetch OAuth error:", err);
        }
      }

      // If no specific error found, show default AccessDenied message
      // The error page will show the default message
    };

    fetchError();
  }, [error, session]);

  const getErrorMessage = () => {
    // If we have a custom error message from OAuth, check if it's about email verification
    if (errorMessage) {
      if (
        errorMessage.includes("verify") ||
        errorMessage.includes("EMAIL_NOT_VERIFIED") ||
        (errorMessage.includes("email") && errorMessage.includes("verify"))
      ) {
        return errorMessage;
      }
      // If it's a different error, still return it but continue to check for email verification in switch
    }

    // Otherwise use default messages based on error type
    switch (error) {
      case "Configuration":
        return "Please verify your email address before signing in. Check your inbox for the verification link. If you don't see it, check your spam folder or request a new verification email.";
      case "AccessDenied":
        // If we have a custom error message, use it, otherwise show default
        if (
          errorMessage &&
          (errorMessage.includes("verify") || errorMessage.includes("email"))
        ) {
          return errorMessage;
        }
        return "You do not have permission to sign in. This may happen if you're trying to sign in with an account that has a different role, or if your organization is pending verification. Please make sure you're using the correct login page for your account type. If this is about email verification, check your inbox and spam folder for the verification link.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      default:
        // Check if error message contains email verification hints
        if (
          errorMessage &&
          (errorMessage.includes("verify") ||
            errorMessage.includes("EMAIL_NOT_VERIFIED"))
        ) {
          return errorMessage;
        }
        return errorMessage || "An error occurred during authentication.";
    }
  };

  // Determine which login page(s) to show based on error message
  const showBothLoginOptions = error === "AccessDenied" && !errorMessage;

  const getLoginUrl = () => {
    if (errorMessage?.includes("recipient")) {
      return "/auth/login";
    } else if (errorMessage?.includes("issuer")) {
      return "/auth/issuer/login";
    }
    return "/auth/login";
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            Authentication Error
          </h1>
          <p className="text-zinc-400 whitespace-pre-wrap">
            {getErrorMessage()}
          </p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          {showBothLoginOptions ? (
            <>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 text-white"
                >
                  Recipient Login
                </Button>
              </Link>
              <Link href="/auth/issuer/login">
                <Button
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 text-white"
                >
                  Organization Login
                </Button>
              </Link>
            </>
          ) : (
            <Link href={getLoginUrl()}>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Return to Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
