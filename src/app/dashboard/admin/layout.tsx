import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard - CredVault",
  description: "Admin dashboard for CredVault platform. Manage organizations, verify issuers, view analytics, and oversee platform operations.",
  keywords: ["admin dashboard", "platform admin", "credvault admin", "organization management", "platform analytics"],
  openGraph: {
    images: ["/meta-image.png"],
  },
  twitter: {
    images: ["/meta-image.png"],
  },
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

