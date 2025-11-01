import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Organization Login - CredVault",
  description: "Sign in to your CredVault organization account to issue credentials and badges. Access your issuer dashboard and manage your credentials.",
  keywords: ["issuer login", "organization login", "issuer sign in", "credential issuer", "badge issuer login"],
}

export default function IssuerLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

