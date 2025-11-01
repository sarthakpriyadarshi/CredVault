import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recipient Signup - CredVault",
  description: "Create your free CredVault account to receive and manage your digital credentials and badges. Join thousands of recipients worldwide.",
  keywords: ["recipient signup", "credential signup", "create account", "register", "credvault signup"],
  openGraph: {
    images: ["/meta-image.png"],
  },
  twitter: {
    images: ["/meta-image.png"],
  },
}

export default function RecipientSignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

