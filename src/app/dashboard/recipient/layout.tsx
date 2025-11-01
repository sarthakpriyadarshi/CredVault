import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recipient Dashboard - CredVault",
  description: "Manage your digital credentials and badges in one place. View, verify, and share your credentials with blockchain verification support.",
  keywords: ["recipient dashboard", "credentials dashboard", "my credentials", "digital badges", "certificate management"],
}

export default function RecipientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

