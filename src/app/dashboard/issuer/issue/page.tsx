"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, CheckCircle, AlertCircle } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Template {
  id: string
  name: string
  fields: Array<{ name: string; type: string }>
}

export default function IssuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [templates, setTemplates] = useState<Template[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [useBlockchain, setUseBlockchain] = useState(false)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")

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
      const res = await fetch("/api/v1/issuer/templates", {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        console.error("Failed to fetch templates")
      } else {
        const data = await res.json()
        const templatesList = data.data || data || []
        setTemplates(
          templatesList.map((t: any) => ({
            id: t.id || t._id?.toString() || "",
            name: t.name || "Unnamed Template",
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

  const currentTemplate = templates.find((t) => t.id === selectedTemplate)

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData({ ...formData, [fieldName]: value })
  }

  const handleIssue = async () => {
    if (!selectedTemplate || !currentTemplate) {
      setDialogMessage("Please select a template")
      setShowErrorDialog(true)
      return
    }

    // Validate required fields (email)
    const emailFields = currentTemplate.fields.filter((f) => f.type === "email")
    const hasEmail = emailFields.some((f) => formData[f.name] && formData[f.name].trim())
    if (!hasEmail) {
      setDialogMessage("Please fill in at least one email field")
      setShowErrorDialog(true)
      return
    }

    setIssuing(true)

    try {
      const res = await fetch("/api/v1/issuer/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: formData,
          useBlockchain,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        setDialogMessage(error.error || "Failed to issue credential")
        setShowErrorDialog(true)
        return
      }

      setDialogMessage("Credential issued successfully!")
      setShowSuccessDialog(true)
      setFormData({})
      setSelectedTemplate("")
      setUseBlockchain(false)
    } catch (error) {
      console.error("Error issuing credential:", error)
      setDialogMessage("An error occurred while issuing the credential")
      setShowErrorDialog(true)
    } finally {
      setIssuing(false)
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
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Issue Credential</h1>
                <p className="text-muted-foreground">Fill in the details to issue a single credential</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-6">
                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="template" className="font-semibold">
                        Select Template *
                      </Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger id="template" className="bg-background/50">
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {loading ? (
                            <SelectItem value="loading" disabled>
                              Loading templates...
                            </SelectItem>
                          ) : templates.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No templates available
                            </SelectItem>
                          ) : (
                            templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic Fields */}
                    {currentTemplate && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="font-semibold text-foreground">Fill Credential Details</h3>
                        {currentTemplate.fields.map((field) => (
                          <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name} className="text-sm">
                              {field.name} {field.type === "email" && "*"}
                            </Label>
                            <Input
                              id={field.name}
                              type={field.type === "email" ? "email" : field.type === "date" ? "date" : "text"}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              value={formData[field.name] || ""}
                              onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              className="bg-background/50 border-border/50"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Options */}
                    {currentTemplate && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                          <Checkbox checked={useBlockchain} onCheckedChange={setUseBlockchain} id="blockchain" />
                          <Label htmlFor="blockchain" className="font-normal cursor-pointer flex-1">
                            Register on Blockchain
                          </Label>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {currentTemplate && (
                      <div className="flex gap-2 justify-end pt-4 border-t border-border/50">
                        <Button variant="outline" onClick={() => setFormData({})}>
                          Clear Form
                        </Button>
                        <PrimaryButton onClick={handleIssue} disabled={issuing} className="gap-2">
                          <Send className="h-4 w-4" />
                          {issuing ? "Issuing..." : "Issue Credential"}
                        </PrimaryButton>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-4">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="font-semibold text-foreground mb-4">Quick Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-3">
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Select a template to get started</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Email field is required for recipient</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Enable blockchain for permanent verification</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Recipient will receive credential via email</span>
                      </li>
                    </ul>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <DialogTitle>Success</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="text-base py-4">
            {dialogMessage}
          </DialogDescription>
          <div className="flex justify-end">
            <PrimaryButton onClick={() => setShowSuccessDialog(false)}>
              OK
            </PrimaryButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle>Error</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="text-base py-4">
            {dialogMessage}
          </DialogDescription>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

