import type { Metadata } from "next"
import { NotFoundPage } from "./not-found-client"

export const metadata: Metadata = {
  title: "404 - Page Not Found | CredVault",
  description: "The page you're looking for doesn't exist. Return to CredVault home or sign in to your account.",
  robots: "noindex, nofollow",
}

export default function NotFound() {
  return <NotFoundPage />
}
