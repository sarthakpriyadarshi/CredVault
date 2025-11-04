"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Linkedin, Github, Twitter, Globe, Mail, ArrowLeft, CheckCircle, Shield, Calendar, Award } from "lucide-react"
import Link from "next/link"
import { LoadingScreen } from "@/components/loading-screen"

interface Credential {
  id: string
  title: string
  issuer: string
  category: string
  issuedAt: string
  expiresAt: string | null
  type: "certificate" | "badge" | "both"
  certificateUrl: string | null
  badgeUrl: string | null
  isOnBlockchain: boolean
}

interface Profile {
  id: string
  name: string
  email: string
  image: string | null
  description: string | null
  linkedin: string | null
  github: string | null
  twitter: string | null
  website: string | null
  createdAt: string
}

export default function PublicProfilePage() {
  const params = useParams()
  const idOrEmail = params?.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "system")
    root.classList.add("dark")
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (idOrEmail) {
      loadProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOrEmail])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/profile/${encodeURIComponent(idOrEmail)}`)

      if (!res.ok) {
        if (res.status === 403) {
          setError("This profile is private")
          return
        }
        if (res.status === 404) {
          setError("Profile not found")
          return
        }
        const errorData = await res.json()
        setError(errorData.error || "Failed to load profile")
        return
      }

      const data = await res.json()
      setProfile(data.profile)
      setCredentials(data.credentials || [])
    } catch (error) {
      console.error("Error loading profile:", error)
      setError("An error occurred while loading the profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen w-full bg-black relative">
        {/* Background gradient - fixed to viewport */}
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

        {/* Decorative elements - fixed to viewport */}
        <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

        {/* Header */}
        <header
          className={`sticky top-4 z-[9999] mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 ${
            isScrolled ? "max-w-3xl px-4" : "max-w-5xl px-6"
          } py-3`}
          style={{
            willChange: "transform",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            perspective: "1000px",
          }}
        >
          <Link 
            href="/" 
            className="flex items-center gap-2 z-50"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full object-contain"
            />
          </Link>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-full hover:bg-background/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Back to Home</span>
          </Link>
        </header>

        <div className="relative z-10 overflow-x-hidden pt-4">
          <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-foreground">Profile Not Available</h1>
                <p className="text-muted-foreground">{error || "The profile you are looking for does not exist or is private."}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Calculate stats
  const totalCredentials = credentials.length
  const blockchainVerified = credentials.filter(c => c.isOnBlockchain).length
  const memberSince = new Date(profile.createdAt).getFullYear()

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      {/* Header */}
      <header
        className={`sticky top-4 z-[9999] mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 ${
          isScrolled ? "max-w-3xl px-4" : "max-w-5xl px-6"
        } py-3`}
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: "1000px",
        }}
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 z-50"
        >
          <Image
            src="/logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-full object-contain"
          />
        </Link>
        
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-full hover:bg-background/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">Back to Home</span>
        </Link>
      </header>

      <div className="relative z-10 overflow-x-hidden pt-4">
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      width={120}
                      height={120}
                      className="w-28 h-28 rounded-full object-cover border-2 border-primary/50"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50">
                      <span className="text-3xl font-bold text-primary">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{profile.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Member since {memberSince}</span>
                    </div>
                  </div>

                  {profile.description && (
                    <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
                  )}

                  {/* Social Links */}
                  {(profile.linkedin || profile.github || profile.twitter || profile.website) && (
                    <div className="flex flex-wrap gap-3">
                      {profile.linkedin && (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-foreground"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span className="text-sm">LinkedIn</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {profile.github && (
                        <a
                          href={profile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-foreground"
                        >
                          <Github className="h-4 w-4" />
                          <span className="text-sm">GitHub</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {profile.twitter && (
                        <a
                          href={profile.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-foreground"
                        >
                          <Twitter className="h-4 w-4" />
                          <span className="text-sm">Twitter</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors text-foreground"
                        >
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Website</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Credentials</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalCredentials}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Blockchain Verified</p>
                    <p className="text-2xl font-bold text-foreground">
                      {blockchainVerified}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Shield className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Verification Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalCredentials > 0 ? Math.round((blockchainVerified / totalCredentials) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Credentials Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Credentials ({credentials.length})</h2>

              {credentials.length === 0 ? (
                <Card className="p-12 border border-border/50 bg-card/50 backdrop-blur text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Award className="h-12 w-12 text-primary/50" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">No Credentials Yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        This profile doesn't have any credentials to display yet. Check back later!
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credentials.map((credential) => (
                    <Card key={credential.id} className="p-5 border border-border/50 bg-card/50 backdrop-blur hover:border-border/80 transition-colors">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground text-lg">{credential.title}</h3>
                            {credential.isOnBlockchain && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                                <Shield className="h-3 w-3" />
                                Verified
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{credential.issuer}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Issued {new Date(credential.issuedAt).toLocaleDateString()}
                            </span>
                            {credential.expiresAt && (
                              <span>
                                Expires {new Date(credential.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {credential.category && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                                {credential.category}
                              </span>
                              {credential.type && (
                                <span className="px-2 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                                  {credential.type}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <Link href={`/verify/${credential.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                              <Shield className="h-3 w-3" />
                              Verify
                            </Button>
                          </Link>
                          {credential.certificateUrl && (
                            <a href={credential.certificateUrl} download className="flex-1">
                              <Button 
                                size="sm" 
                                className="w-full bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] gap-2"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

