import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Credential - CredVault",
  description: "Verify the authenticity of your digital credentials and badges. CredVault provides secure credential verification with blockchain support for tamper-proof verification.",
  keywords: ["credential verification", "badge verification", "blockchain verification", "certificate verification", "digital credential verification"],
  robots: "index, follow",
  openGraph: {
    title: "Verify Credential - CredVault",
    description: "Verify the authenticity of your digital credentials and badges with blockchain support.",
    type: "website",
    images: [
      {
        url: "/meta-image.png",
        width: 1200,
        height: 630,
        alt: "CredVault - Verify Credential",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verify Credential - CredVault",
    description: "Verify the authenticity of your digital credentials and badges with blockchain support.",
    images: ["/meta-image.png"],
  },
}

export default function VerifyLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}

