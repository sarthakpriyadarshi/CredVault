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
  type?: string
  fields: Array<{ name: string; type: string }>
}

export default function IssuePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [templates, setTemplates] = useState<Template[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [blockchainEnabled, setBlockchainEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")
  const [templateDetails, setTemplateDetails] = useState<Template | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && !session.user?.isVerified) {
      router.push("/auth/issuer/login?pending=true")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && session.user?.isVerified) {
      loadOrganization()
      loadTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const loadOrganization = async () => {
    try {
      const res = await fetch("/api/v1/issuer/organization", {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        const enabled = data.blockchainEnabled || false
        setBlockchainEnabled(enabled)
      }
    } catch (error) {
      console.error("Error loading organization:", error)
    }
  }

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
            type: t.type,
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

  // Fetch full template details when selected
  useEffect(() => {
    if (selectedTemplate && currentTemplate) {
      const fetchTemplateDetails = async () => {
        try {
          const res = await fetch(`/api/v1/issuer/templates/${selectedTemplate}`, {
            credentials: "include",
          })
          
          if (res.ok) {
            const data = await res.json()
            const template = data.template || data
            // Map placeholders to fields format
            const fields = (template.placeholders || template.fields || []).map((f: any) => ({
              name: f.fieldName || f.name || "",
              type: f.type || "text",
            }))
            setTemplateDetails({
              ...currentTemplate,
              type: template.type,
              fields,
            })
          } else {
            // Fallback to currentTemplate if fetch fails
            setTemplateDetails(currentTemplate)
          }
        } catch (error) {
          console.error("Error loading template details:", error)
          // Fallback to currentTemplate if fetch fails
          setTemplateDetails(currentTemplate)
        }
      }
      
      fetchTemplateDetails()
    } else {
      setTemplateDetails(null)
    }
  }, [selectedTemplate, currentTemplate])

  // Use templateDetails if available, otherwise fallback to currentTemplate
  const activeTemplate = templateDetails || currentTemplate

  // Auto-fill Issue Date when template is selected
  useEffect(() => {
    if (activeTemplate && activeTemplate.fields && activeTemplate.fields.length > 0) {
      const issueDateField = activeTemplate.fields.find(
        (f) => f.name.toLowerCase().trim() === "issue date" && f.type === "date"
      )
      
      if (issueDateField) {
        // Auto-fill with current date in DD-MM-YYYY format
        const today = new Date()
        const day = String(today.getDate()).padStart(2, '0')
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const year = today.getFullYear()
        const todayFormatted = `${day}-${month}-${year}`
        setFormData((prev) => ({
          ...prev,
          [issueDateField.name]: todayFormatted,
        }))
      }
    }
  }, [activeTemplate])

  const handleFieldChange = (fieldName: string, value: string) => {
    // Prevent modification of Issue Date field
    const issueDateField = activeTemplate?.fields?.find(
      (f) => f.name.toLowerCase().trim() === "issue date" && f.type === "date"
    )
    if (issueDateField && fieldName === issueDateField.name) {
      return // Don't allow changes to Issue Date
    }
    setFormData({ ...formData, [fieldName]: value })
  }

  const handleIssue = async () => {
    if (!selectedTemplate || !activeTemplate || !activeTemplate.fields || activeTemplate.fields.length === 0) {
      setDialogMessage("Please select a template")
      setShowErrorDialog(true)
      return
    }

    // Validate required fields (email)
    const emailFields = activeTemplate.fields.filter((f) => f.type === "email")
    const hasEmail = emailFields.some((f) => formData[f.name] && formData[f.name].trim())
    if (!hasEmail) {
      setDialogMessage("Please fill in at least one email field")
      setShowErrorDialog(true)
      return
    }

    // Validate Name field (case-insensitive) - Not required for badge templates
    const nameField = activeTemplate.fields.find((f) => f.name.toLowerCase().trim() === "name")
    if (nameField && activeTemplate.type !== "badge" && (!formData[nameField.name] || !formData[nameField.name].trim())) {
      setDialogMessage("Please fill in the Name field")
      setShowErrorDialog(true)
      return
    }

    // Validate Issue Date field (case-insensitive, must be type "date")
    const issueDateField = activeTemplate.fields.find(
      (f) => f.name.toLowerCase().trim() === "issue date" && f.type === "date"
    )
    if (issueDateField && (!formData[issueDateField.name] || !formData[issueDateField.name].trim())) {
      setDialogMessage("Issue Date is required")
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
          useBlockchain: blockchainEnabled, // Always use organization setting
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
      // Reset form but preserve auto-filled Issue Date if template is still selected
      const resetFormData: Record<string, string> = {}
      if (activeTemplate && activeTemplate.fields) {
        const issueDateField = activeTemplate.fields.find(
          (f) => f.name.toLowerCase().trim() === "issue date" && f.type === "date"
        )
        if (issueDateField) {
          const today = new Date()
          const day = String(today.getDate()).padStart(2, '0')
          const month = String(today.getMonth() + 1).padStart(2, '0')
          const year = today.getFullYear()
          const todayFormatted = `${day}-${month}-${year}`
          resetFormData[issueDateField.name] = todayFormatted
        }
      }
      setFormData(resetFormData)
      setSelectedTemplate("")
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
                    {activeTemplate && activeTemplate.fields && activeTemplate.fields.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="font-semibold text-foreground">Fill Credential Details</h3>
                        {activeTemplate.fields
                          .filter((field) => field.type !== "qr") // Exclude QR code fields from form
                          .map((field) => {
                            const isIssueDate = field.name.toLowerCase().trim() === "issue date" && field.type === "date"
                            const isExpiryDate = field.name.toLowerCase().trim() === "expiry date" && field.type === "date"
                            const isName = field.name.toLowerCase().trim() === "name"
                            const isEmail = field.type === "email"
                            const isRequired = isEmail || isName || isIssueDate
                            
                            return (
                            <div key={field.name} className="space-y-2">
                              <Label htmlFor={field.name} className="text-sm">
                                {field.name} {isRequired && "*"}
                              </Label>
                              <Input
                                id={field.name}
                                type={field.type === "email" ? "email" : isIssueDate ? "text" : field.type === "date" ? "date" : "text"}
                                placeholder={isIssueDate ? "Auto-filled with today's date" : `Enter ${field.name.toLowerCase()}`}
                                value={formData[field.name] || ""}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                className="bg-background/50 border-border/50"
                                readOnly={isIssueDate}
                                disabled={isIssueDate}
                              />
                              {isIssueDate && (
                                <p className="text-xs text-muted-foreground">Issue Date is automatically set to today&apos;s date and cannot be modified</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Blockchain Status (Read-only) */}
                    {activeTemplate && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Blockchain Status</p>
                            <p className={`text-sm ${blockchainEnabled ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                              {blockchainEnabled ? "Enabled - Credentials will be stored on blockchain" : "Disabled"}
                            </p>
                            {!blockchainEnabled && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Contact your admin to enable blockchain for your organization
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {activeTemplate && (
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

