import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "CredVault - Credential & Badge Issuance Platform",
  description: "Issue credentials and badges seamlessly. Create custom templates, issue certificates in bulk, and verify credentials with blockchain integration. Trusted by organizations worldwide.",
  keywords: ["credentials", "badges", "certificates", "blockchain verification", "digital credentials", "badge issuance", "certificate platform"],
  authors: [{ name: "CredVault" }],
  creator: "CredVault",
  publisher: "CredVault",
  metadataBase: new URL("https://credvault.com"),
  openGraph: {
    title: "CredVault - Credential & Badge Issuance Platform",
    description: "Issue credentials and badges seamlessly. Create custom templates, issue certificates in bulk, and verify credentials with blockchain integration.",
    type: "website",
    locale: "en_US",
    siteName: "CredVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "CredVault - Credential & Badge Issuance Platform",
    description: "Issue credentials and badges seamlessly. Trusted by organizations worldwide.",
    creator: "@credvault",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.ico", type: "image/x-icon", sizes: "any" },
    ],
    apple: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/logo.ico"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="dark">{children}</body>
    </html>
  )
}
