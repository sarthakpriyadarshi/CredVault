"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Edit, Trash2, Plus, Eye, Archive, Download } from "lucide-react"
import Link from "next/link"
import { PrimaryButton } from "@/components/ui/primary-button"

interface Template {
  id: string
  name: string
  category?: string
  credentialsIssued: number
  createdAt: string
  archived?: boolean
  fields?: Array<{ name: string; type: string }>
}

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterArchived, setFilterArchived] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && !session.user?.isVerified) {
      router.push("/auth/issuer/login?pending=true")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && session.user?.isVerified) {
      loadTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const fetchOptions: RequestInit = {
        credentials: "include",
      }

      const res = await fetch("/api/v1/issuer/templates", fetchOptions)
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        console.error("Failed to fetch templates:", res.statusText)
      } else {
        const data = await res.json()
        const templatesList = data.data || data || []
        setTemplates(
          templatesList.map((t: any) => ({
            id: t.id || t._id?.toString() || "",
            name: t.name || "Unnamed Template",
            category: t.category || "General",
            credentialsIssued: t.credentialsIssued || 0,
            createdAt: t.createdAt
              ? new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            archived: t.archived || t.isArchived || false,
            fields: t.fields || [],
          }))
        )
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesArchived = filterArchived ? template.archived : !template.archived
    return matchesSearch && matchesArchived
  })

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/issuer/templates/${id}/archive`, {
        method: "PUT",
        credentials: "include",
      })

      if (res.ok) {
        await loadTemplates()
      } else {
        alert("Failed to archive template")
      }
    } catch (error) {
      console.error("Error archiving template:", error)
      alert("An error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/v1/issuer/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (res.ok) {
        await loadTemplates()
      } else {
        alert("Failed to delete template")
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("An error occurred")
    }
  }

  const downloadCSVTemplate = async (template: Template) => {
    try {
      // Fetch full template details to get all fields
      const res = await fetch(`/api/v1/issuer/templates/${template.id}`, {
        credentials: "include",
      })

      if (!res.ok) {
        alert("Failed to fetch template details")
        return
      }

      const templateData = await res.json()
      const templateDetails = templateData.template || templateData

      // Get all field names from placeholders
      const fields = templateDetails.placeholders || templateDetails.fields || template.fields || []
      
      // Create CSV header row
      const headers = fields.map((f: any) => f.fieldName || f.name || "Field")
      
      // Create CSV content with sample data
      const csvRows = [
        headers.join(","), // Header row
        headers.map(() => "Sample Value").join(","), // Sample row 1
        headers.map(() => "Sample Value").join(","), // Sample row 2
      ]

      const csv = csvRows.join("\n")

      // Download CSV
      const element = document.createElement("a")
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv))
      element.setAttribute("download", `${template.name.replace(/[^a-z0-9]/gi, "_")}_template.csv`)
      element.style.display = "none"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error("Error downloading CSV template:", error)
      alert("Failed to download CSV template")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading session...</div>
      </div>
    )
  }

  if (status === "unauthenticated" || (status === "authenticated" && (!session || session.user?.role !== "issuer"))) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Background gradient - fixed to viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />

      {/* Decorative elements - fixed to viewport */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <div className="relative z-10 overflow-x-hidden pt-20">
        <DashboardHeader userRole="issuer" userName={session?.user?.name || undefined} />

        <div className="flex mt-4">
          <DashboardSidebar userRole="issuer" />

          <main className="flex-1 md:ml-80 p-4 md:p-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Templates</h1>
                  <p className="text-muted-foreground">Manage all your credential templates</p>
                </div>
                <Link href="/dashboard/issuer/templates/create">
                  <PrimaryButton className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Template
                  </PrimaryButton>
                </Link>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-4 flex-col md:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFilterArchived(!filterArchived)}
                  className="bg-transparent"
                >
                  {filterArchived ? "Show Active" : "Show Archived"}
                </Button>
              </div>

              {/* Templates Grid */}
              {loading ? (
                <div className="text-center text-muted-foreground py-12">Loading templates...</div>
              ) : filteredTemplates.length === 0 ? (
                <Card className="p-12 border border-border/50 bg-card/50 backdrop-blur text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm ? "Try adjusting your search" : "Create your first template to get started"}
                  </p>
                  {!searchTerm && (
                    <Link href="/dashboard/issuer/templates/create">
                      <PrimaryButton className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Template
                      </PrimaryButton>
                    </Link>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="p-6 border border-border/50 bg-card/50 backdrop-blur hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                            <p className="text-xs text-muted-foreground">{template.category || "General"}</p>
                          </div>
                        </div>
                        {template.archived && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Issued</span>
                          <span className="font-semibold text-foreground">{template.credentialsIssued}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Created: {template.createdAt}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1 bg-transparent">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCSVTemplate(template)}
                          className="bg-transparent"
                          title="Download CSV Template"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(template.id)}
                          className="bg-transparent"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="bg-transparent text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

