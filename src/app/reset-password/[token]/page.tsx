"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setToken(resolvedParams.token);
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black relative overflow-x-hidden">
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements - fixed to viewport */}
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        {/* Desktop Header */}
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 hidden md:flex w-full max-w-5xl flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 py-2">
          <Link
            href="/"
            className="z-50 flex items-center justify-center gap-2"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full size-8 w-8 h-8 object-contain"
            />
          </Link>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Link
              href="/"
              className="text-lg font-semibold text-foreground pointer-events-auto hover:text-primary transition-colors"
            >
              CredVault
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="font-medium transition-colors hover:text-foreground text-muted-foreground text-sm cursor-pointer"
            >
              Log In
            </Link>

            <Link
              href="/auth/signup"
              className="rounded-md font-bold cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-linear-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="fixed top-4 left-4 right-4 z-9999 flex w-auto flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg md:hidden px-4 py-3">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={28}
              height={28}
              className="rounded-full size-7 w-7 h-7 object-contain"
            />
          </Link>
        </header>

        <div className="container mx-auto px-4 w-full flex items-center justify-center min-h-screen pt-20 md:pt-16 relative z-10">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 w-full"
            >
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Password Reset!
                </h1>
                <p className="text-zinc-400">
                  Your password has been reset successfully. Redirecting you to
                  sign in...
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
                    <div className="bg-emerald-500/10 p-4 rounded-full">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <p className="text-zinc-300">
                      Your password has been reset successfully!
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-zinc-400">
                <p>Redirecting to sign in page...</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      {/* Desktop Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 hidden md:flex w-full max-w-5xl flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 py-2">
        <Link href="/" className="z-50 flex items-center justify-center gap-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full size-8 w-8 h-8 object-contain"
          />
        </Link>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Link
            href="/"
            className="text-lg font-semibold text-foreground pointer-events-auto hover:text-primary transition-colors"
          >
            CredVault
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="font-medium transition-colors hover:text-foreground text-muted-foreground text-sm cursor-pointer"
          >
            Log In
          </Link>

          <Link
            href="/auth/signup"
            className="rounded-md font-bold cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-linear-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-4 left-4 right-4 z-9999 flex w-auto flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg md:hidden px-4 py-3">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-full size-7 w-7 h-7 object-contain"
          />
        </Link>
      </header>

      <div className="container mx-auto px-4 w-full flex items-center justify-center min-h-screen pt-20 md:pt-16 relative z-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full"
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Reset Password
              </h1>
              <p className="text-zinc-400">Enter your new password below</p>
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
                  <Label htmlFor="new-password" className="text-white">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20 pr-12"
                      required
                      minLength={6}
                      maxLength={80}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-primary focus:ring-primary/20 pr-12"
                      required
                      minLength={6}
                      maxLength={80}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <PrimaryButton
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </PrimaryButton>
              </form>
            </motion.div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-zinc-400">
              <p>
                Need help?{" "}
                <a
                  href="mailto:support@credvault.app"
                  className="text-primary hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
