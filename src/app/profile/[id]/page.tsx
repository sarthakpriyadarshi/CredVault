"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Linkedin, Github, Twitter, Globe, Mail } from "lucide-react"
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

        <div className="relative z-10 overflow-x-hidden pt-20">
          <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
            <div className="space-y-8">
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

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Profile Header */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profile.image ? (
                    <Image
                      src={profile.image}
                      alt={profile.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary/50"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50">
                      <span className="text-2xl font-bold text-primary">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                  </div>

                  {profile.description && (
                    <p className="text-muted-foreground">{profile.description}</p>
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

            {/* Credentials Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Credentials ({credentials.length})</h2>

              {credentials.length === 0 ? (
                <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur text-center">
                  <p className="text-muted-foreground">No credentials to display</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credentials.map((credential) => (
                    <Card key={credential.id} className="p-4 border border-border/50 bg-card/50 backdrop-blur">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{credential.title}</h3>
                          <p className="text-sm text-muted-foreground">{credential.issuer}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Issued {new Date(credential.issuedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/verify/${credential.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              Verify
                            </Button>
                          </Link>
                          {credential.certificateUrl && (
                            <a href={credential.certificateUrl} download>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-3 w-3" />
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

