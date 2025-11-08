import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "@/components/providers";
import { SetupChecker } from "@/components/setup-checker";
import "./globals.css";

export const metadata: Metadata = {
  title: "CredVault - Credential & Badge Issuance Platform",
  description:
    "Issue credentials and badges seamlessly. Create custom templates, issue certificates in bulk, and verify credentials with blockchain integration. Trusted by organizations worldwide.",
  keywords: [
    "credentials",
    "badges",
    "certificates",
    "blockchain verification",
    "digital credentials",
    "badge issuance",
    "certificate platform",
  ],
  authors: [{ name: "CredVault" }],
  creator: "CredVault",
  publisher: "CredVault",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:4300"),
  openGraph: {
    title: "CredVault - Credential & Badge Issuance Platform",
    description:
      "Issue credentials and badges seamlessly. Create custom templates, issue certificates in bulk, and verify credentials with blockchain integration.",
    type: "website",
    locale: "en_US",
    siteName: "CredVault",
    images: [
      {
        url: "/meta-image.png",
        width: 1200,
        height: 630,
        alt: "CredVault - Credential & Badge Issuance Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CredVault - Credential & Badge Issuance Platform",
    description:
      "Issue credentials and badges seamlessly. Trusted by organizations worldwide.",
    creator: "@credvault",
    images: ["/meta-image.png"],
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
    ],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <style>
        {`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}
        </style>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="dark">
        <Providers>
          <SetupChecker>{children}</SetupChecker>
        </Providers>
        <Analytics />
        {/* Load Google Fonts asynchronously only when needed (for template editor) */}
        {/* Fonts are loaded dynamically in template editor pages to reduce initial bundle size */}
      </body>
    </html>
  );
}
