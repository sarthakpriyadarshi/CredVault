import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Login - CredVault",
  description: "Admin login for CredVault platform. Manage organizations, verify issuers, and oversee the credential issuance platform.",
  keywords: ["admin login", "credvault admin", "platform admin", "administrator login"],
  openGraph: {
    images: ["/meta-image.png"],
  },
  twitter: {
    images: ["/meta-image.png"],
  },
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

