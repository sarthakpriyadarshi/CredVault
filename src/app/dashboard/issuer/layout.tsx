import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Issuer Dashboard - CredVault",
  description: "Issue and manage digital credentials and badges. Create templates, issue certificates in bulk, and track your credential issuance.",
  keywords: ["issuer dashboard", "credential issuer", "badge issuer", "issue credentials", "certificate template"],
  openGraph: {
    images: ["/meta-image.png"],
  },
  twitter: {
    images: ["/meta-image.png"],
  },
}

export default function IssuerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

