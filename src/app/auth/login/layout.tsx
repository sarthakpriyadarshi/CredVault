import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recipient Login - CredVault",
  description: "Sign in to your CredVault account to access your digital credentials and badges. Secure login for credential recipients.",
  keywords: ["recipient login", "credential login", "sign in", "credvault login"],
}

export default function RecipientLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

