import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Providers } from "@/components/providers"
import { SetupChecker } from "@/components/setup-checker"
import "./globals.css"

export const metadata: Metadata = {
  title: "CredVault - Credential & Badge Issuance Platform",
  description: "Issue credentials and badges seamlessly. Create custom templates, issue certificates in bulk, and verify credentials with blockchain integration. Trusted by organizations worldwide.",
  keywords: ["credentials", "badges", "certificates", "blockchain verification", "digital credentials", "badge issuance", "certificate platform"],
  authors: [{ name: "CredVault" }],
  creator: "CredVault",
  publisher: "CredVault",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:4300"),
  openGraph: {
    title: "CredVault - Credential & Badge Issuance Platform",
    description: "Issue credentials and badges seamlessly. Create custom templates, issue certificates in bulk, and verify credentials with blockchain integration.",
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
    description: "Issue credentials and badges seamlessly. Trusted by organizations worldwide.",
    creator: "@credvault",
    images: ["/meta-image.png"],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=Open+Sans:wght@300;400;600;700;800&family=Lato:wght@100;300;400;700;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Raleway:wght@100;200;300;400;500;600;700;800;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Oswald:wght@200;300;400;500;600;700&family=Lora:wght@400;500;600;700&family=Source+Sans+Pro:wght@200;300;400;600;700;900&family=Ubuntu:wght@300;400;500;700&family=Nunito:wght@200;300;400;500;600;700;800;900&family=PT+Sans:wght@400;700&family=Noto+Sans:wght@400;500;600;700&family=Crimson+Text:wght@400;600;700&family=Libre+Baskerville:wght@400;700&family=Playfair+Display+SC:wght@400;700;900&family=Cormorant+Garamond:wght@300;400;500;600;700&family=EB+Garamond:wght@400;500;600;700;800&family=Alfa+Slab+One&family=Bebas+Neue&family=Righteous&family=Abril+Fatface&family=Anton&family=Archivo+Black&family=Bangers&family=Courgette&family=Croissant+One&family=Dancing+Script:wght@400;500;600;700&family=Fredoka+One&family=Great+Vibes&family=Lobster&family=Pacifico&family=Permanent+Marker&family=Quicksand:wght@300;400;500;600;700&family=Satisfy&family=Shadows+Into+Light&family=Yellowtail&display=swap"
          rel="stylesheet"
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="dark">
        <Providers>
          <SetupChecker>{children}</SetupChecker>
        </Providers>
      </body>
    </html>
  )
}
