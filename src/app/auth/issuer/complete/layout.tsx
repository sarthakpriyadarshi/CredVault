import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Complete Organization Registration - CredVault",
  description: "Complete your organization registration on CredVault to start issuing credentials and badges.",
  keywords: ["organization registration", "complete registration", "issuer setup", "organization setup"],
  openGraph: {
    images: ["/meta-image.png"],
  },
  twitter: {
    images: ["/meta-image.png"],
  },
}

export default function IssuerCompleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

