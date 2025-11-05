"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Download, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface IssuanceRecord {
  recipientName: string
  email: string
  status: "pending" | "success" | "error"
  message?: string
  [key: string]: any // For additional CSV fields
}

interface CSVRow {
  [key: string]: string
}

export default function BulkIssuancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; fields?: any[] }>>([])
  const [templateFields, setTemplateFields] = useState<Array<{ name: string; type: string }>>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [useBlockchain, setUseBlockchain] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [issuanceRecords, setIssuanceRecords] = useState<IssuanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
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

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateDetails(selectedTemplate)
    } else {
      setTemplateFields([])
    }
  }, [selectedTemplate])

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
        setTemplates(templatesList.map((t: any) => ({
          id: t.id || t._id?.toString() || "",
          name: t.name || "Unnamed Template",
          fields: t.fields || [],
        })))
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplateDetails = async (templateId: string) => {
    try {
      const res = await fetch(`/api/v1/issuer/templates/${templateId}`, {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        const template = data.template || data
        const fields = template.placeholders || template.fields || []
        
        if (fields.length === 0) {
          console.warn("Template has no fields/placeholders")
          setTemplateFields([])
          return
        }
        
        const mappedFields = fields.map((f: any) => ({
          name: f.fieldName || f.name || "",
          type: f.type || "text",
        })).filter((f: any) => f.name) // Filter out any fields without names
        
        setTemplateFields(mappedFields)
      } else {
        console.error("Failed to fetch template details:", res.status, res.statusText)
        setTemplateFields([])
      }
    } catch (error) {
      console.error("Error loading template details:", error)
      setTemplateFields([])
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setCsvPreview([])
    setCsvHeaders([])
    setShowPreview(false)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      
      if (lines.length < 2) {
        setDialogMessage("CSV must have header and at least one data row")
        setShowErrorDialog(true)
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim())
      const rows: CSVRow[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        const row: CSVRow = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] || ""
        })
        rows.push(row)
      }

      setCsvHeaders(headers)
      setCsvPreview(rows)
      setShowPreview(true)
    } catch (error) {
      console.error("Error parsing CSV:", error)
      setDialogMessage("Failed to parse CSV file")
      setShowErrorDialog(true)
    }
  }

  const handleProcessBulkIssuance = async () => {
    if (!csvFile || !selectedTemplate) {
      setDialogMessage("Please select template and upload CSV file")
      setShowErrorDialog(true)
      return
    }

    if (csvPreview.length === 0) {
      setDialogMessage("CSV file is empty")
      setShowErrorDialog(true)
      return
    }

    setIsProcessing(true)
    setIssuanceRecords([])

    try {
      const formData = new FormData()
      formData.append("file", csvFile)
      formData.append("templateId", selectedTemplate)
      formData.append("useBlockchain", String(useBlockchain))

      const res = await fetch("/api/v1/issuer/credentials/bulk", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        setDialogMessage(error.error || "Failed to process bulk issuance")
        setShowErrorDialog(true)
        return
      }

      const data = await res.json()
      const records = data.records || []
      setIssuanceRecords(records)
      
      // Calculate success count from the received data
      const actualSuccessCount = records.filter((r: IssuanceRecord) => r.status === "success").length
      setDialogMessage(`Bulk issuance completed! Successfully issued ${actualSuccessCount} credentials`)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error processing bulk issuance:", error)
      setDialogMessage("An error occurred while processing bulk issuance")
      setShowErrorDialog(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = async () => {
    if (!selectedTemplate) {
      setDialogMessage("Please select a template first")
      setShowErrorDialog(true)
      return
    }

    try {
      // Get field names from selected template, excluding QR Code and Issue Date
      const headers = templateFields
        .filter((f) => {
          // Exclude QR Code fields
          if (f.type === "qr") return false
          // Exclude Issue Date fields (auto-filled)
          if (f.type === "date" && f.name.toLowerCase().trim() === "issue date") return false
          return true
        })
        .map((f) => f.name)
      
      if (headers.length === 0) {
        setDialogMessage("Template has no fields defined")
        setShowErrorDialog(true)
        return
      }

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
      const templateName = templates.find((t) => t.id === selectedTemplate)?.name || "template"
      element.setAttribute("download", `${templateName.replace(/[^a-z0-9]/gi, "_")}_template.csv`)
      element.style.display = "none"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error("Error downloading CSV template:", error)
      setDialogMessage("Failed to download CSV template")
      setShowErrorDialog(true)
    }
  }

  const successCount = issuanceRecords.filter((r) => r.status === "success").length
  const errorCount = issuanceRecords.filter((r) => r.status === "error").length

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
                <h1 className="text-3xl font-bold text-foreground">Bulk Issuance</h1>
                <p className="text-muted-foreground">Issue credentials to multiple recipients using CSV file</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upload Section */}
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-6">
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

                    {/* CSV Upload */}
                    <div className="space-y-2">
                      <Label className="font-semibold">Upload CSV File *</Label>
                      <label className="flex items-center justify-center p-8 border-2 border-dashed border-border/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-medium text-foreground mb-1">Drop CSV file here or click to upload</p>
                          <p className="text-sm text-muted-foreground">Format: Recipient Name, Email, [Additional Fields]</p>
                        </div>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                      </label>
                      {csvFile && (
                        <p className="text-sm text-emerald-500 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {csvFile.name}
                        </p>
                      )}
                    </div>

                    {/* CSV Preview Table */}
                    {showPreview && csvPreview.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">CSV Preview ({csvPreview.length} rows)</h3>
                        </div>
                        <div className="border border-border/50 rounded-lg">
                          <div className="max-h-96 overflow-y-auto">
                            <Table className="min-w-[600px]">
                              <TableHeader>
                                <TableRow className="bg-background/50">
                                  {csvHeaders.map((header) => (
                                    <TableHead key={header} className="font-semibold">
                                      {header}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {csvPreview.slice(0, 10).map((row, idx) => (
                                  <TableRow key={idx}>
                                    {csvHeaders.map((header) => (
                                      <TableCell key={header} className="text-sm">
                                        {row[header] || "-"}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {csvPreview.length > 10 && (
                            <div className="p-2 text-xs text-muted-foreground text-center bg-background/30">
                              Showing first 10 rows of {csvPreview.length} total rows
                            </div>
                          )}
                        </div>

                        {/* Blockchain Option and Issue Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <label 
                            htmlFor="blockchain" 
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Checkbox checked={useBlockchain} onCheckedChange={setUseBlockchain} id="blockchain" />
                            <span className="font-normal flex-1">
                              Issue with Blockchain
                            </span>
                          </label>
                          <PrimaryButton
                            onClick={handleProcessBulkIssuance}
                            disabled={isProcessing}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {isProcessing ? "Processing..." : "Issue Credentials"}
                          </PrimaryButton>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons (if no preview shown) */}
                    {!showPreview && (
                      <div className="flex gap-2 justify-end pt-4 border-t border-border/50">
                        <Button variant="outline" onClick={() => { setCsvFile(null); setSelectedTemplate(""); setShowPreview(false); setCsvPreview([]); setCsvHeaders([]) }}>
                          Reset
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* Results */}
                  {issuanceRecords.length > 0 && (
                    <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Issuance Results</h3>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Download className="h-4 w-4" />
                          Export Report
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-background/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Processed</p>
                          <p className="text-2xl font-bold text-foreground">{issuanceRecords.length}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">Successful</p>
                          <p className="text-2xl font-bold text-emerald-500">{successCount}</p>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">Failed</p>
                          <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {issuanceRecords.map((record, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                              record.status === "success"
                                ? "bg-emerald-500/10 border border-emerald-500/20"
                                : "bg-red-500/10 border border-red-500/20"
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{record.recipientName}</p>
                              <p className="text-sm text-muted-foreground">{record.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {record.status === "success" ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              )}
                              <p className="text-sm text-muted-foreground">{record.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="font-semibold text-foreground mb-4">CSV Format Guide</h3>
                    <div className="text-sm text-muted-foreground space-y-3">
                      {selectedTemplate && templateFields.length > 0 ? (
                        <>
                          <div className="p-3 bg-background/50 rounded-lg font-mono text-xs space-y-1">
                            <p className="text-foreground font-semibold mb-2">Required Fields:</p>
                            {templateFields
                              .filter((field) => {
                                // Exclude QR code fields (auto-filled)
                                if (field.type === "qr") return false
                                // Exclude Issue Date fields (auto-filled)
                                if (field.type === "date" && field.name.toLowerCase().trim() === "issue date") return false
                                return true
                              })
                              .map((field, idx) => {
                                const isEmail = field.type === "email"
                                const isName = field.name.toLowerCase().trim() === "name"
                                const isExpiryDate = field.name.toLowerCase().trim() === "expiry date" && field.type === "date"
                                const isRequired = isEmail || isName
                                
                                return (
                                  <p key={idx}>
                                    {field.name} {isRequired && <span className="text-primary">(Required)</span>}
                                    {isExpiryDate && <span className="text-muted-foreground text-[10px] ml-1">(Optional)</span>}
                                  </p>
                                )
                              })}
                          </div>
                          <div className="p-3 bg-background/50 rounded-lg font-mono text-xs">
                            <p className="text-foreground font-semibold mb-2">Example:</p>
                            <p>{templateFields
                              .filter((f) => {
                                if (f.type === "qr") return false
                                if (f.type === "date" && f.name.toLowerCase().trim() === "issue date") return false
                                return true
                              })
                              .map((f) => f.name).join(",")}</p>
                            <p>{templateFields
                              .filter((f) => {
                                if (f.type === "qr") return false
                                if (f.type === "date" && f.name.toLowerCase().trim() === "issue date") return false
                                return true
                              })
                              .map(() => "Sample Value").join(",")}</p>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 bg-background/50 rounded-lg font-mono text-xs">
                          <p>Recipient Name,Email</p>
                          <p>John Doe,john@example.com</p>
                          <p>Jane Smith,jane@example.com</p>
                        </div>
                      )}
                      <ul className="space-y-2">
                        <li className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>First row: headers</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>Email and Name are required</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>Issue Date and QR Code are auto-filled automatically</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>Additional columns match template fields</span>
                        </li>
                      </ul>
                    </div>
                  </Card>

                  <Button onClick={downloadTemplate} variant="outline" className="w-full gap-2 bg-transparent" disabled={!selectedTemplate}>
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>

                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="font-semibold text-foreground mb-4">Quick Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-3">
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Max 1000 credentials per batch</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Processing takes ~5 minutes</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>All recipients notified via email</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>Review CSV preview before issuing</span>
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
