import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Organization Signup - CredVault",
  description: "Register your organization on CredVault to start issuing digital credentials and badges. Create custom templates and issue certificates in bulk.",
  keywords: ["issuer signup", "organization signup", "register issuer", "credential issuer signup", "badge issuer registration"],
}

export default function IssuerSignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

