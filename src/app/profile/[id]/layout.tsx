import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Public Profile - CredVault",
  description: "View public profile and credentials on CredVault. Discover verified credentials, badges, and achievements from trusted organizations.",
  keywords: ["public profile", "credentials profile", "badges profile", "verified credentials", "credential portfolio"],
  robots: "index, follow",
  openGraph: {
    title: "Public Profile - CredVault",
    description: "View public profile and credentials on CredVault. Discover verified credentials and badges.",
    type: "profile",
    images: [
      {
        url: "/meta-image.png",
        width: 1200,
        height: 630,
        alt: "CredVault - Public Profile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Public Profile - CredVault",
    description: "View public profile and credentials on CredVault. Discover verified credentials and badges.",
    images: ["/meta-image.png"],
  },
}

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}

