"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Trash2, Download, Save, Eye } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { GOOGLE_FONTS } from "@/lib/fonts"

interface TemplateField {
  id: string
  name: string
  type: "text" | "email" | "number" | "date" | "id"
  x?: number // Optional - email fields may not have coordinates if not displayed
  y?: number // Optional - email fields may not have coordinates if not displayed
  width: number
  height: number
  fontFamily?: string
  fontSize?: number
  fontColor?: string
}


export default function CreateTemplatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [templateName, setTemplateName] = useState("")
  const [category, setCategory] = useState("general")
  const [templateType, setTemplateType] = useState<"certificate" | "badge" | "both">("certificate")
  const [fields, setFields] = useState<TemplateField[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [certificateImage, setCertificateImage] = useState<string | null>(null)
  const [badgeImage, setBadgeImage] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState("")
  const [showNewField, setShowNewField] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "email" | "number" | "date" | "id">("text")
  const [previewMode, setPreviewMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  const [pendingField, setPendingField] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isMovingField, setIsMovingField] = useState(false)
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null)
  const [fieldDragOffset, setFieldDragOffset] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>("Arial")
  const [selectedFontSize, setSelectedFontSize] = useState<number>(16)
  const [selectedFontColor, setSelectedFontColor] = useState<string>("#FFFFFF")

  // Modal states for error and success messages
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")

  // Use shared Google Fonts list
  const googleFonts = GOOGLE_FONTS

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && !session.user?.isVerified) {
      router.push("/auth/issuer/login?pending=true")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  // Load image when certificateImage changes (can be URL or base64)
  useEffect(() => {
    if (certificateImage) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        imageRef.current = img
        drawCanvas()
      }
      img.onerror = () => {
        console.error("Failed to load certificate image")
        imageRef.current = null
        drawCanvas()
      }
      // Handle both URLs and base64 data URLs
      img.src = certificateImage.startsWith("/") ? `${window.location.origin}${certificateImage}` : certificateImage
    } else {
      imageRef.current = null
      drawCanvas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateImage])

  // Draw canvas when fields or state changes (but use requestAnimationFrame to prevent flickering)
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      drawCanvas()
    })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, selectedField, isDragging, dragStart, dragCurrent, isMovingField, selectedFontFamily, selectedFontSize, selectedFontColor])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || previewMode || !certificateImage) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)

    // Check if clicking on existing field (only those with coordinates)
    const clickedField = fields.find(
      (f) => f.x !== undefined && f.y !== undefined && x >= f.x && x <= f.x + f.width && y >= f.y && y <= f.y + f.height
    )

    if (clickedField && clickedField.x !== undefined && clickedField.y !== undefined) {
      setSelectedField(clickedField.id)
      // Start moving the field
      setIsMovingField(true)
      setMovingFieldId(clickedField.id)
      setFieldDragOffset({
        x: x - clickedField.x,
        y: y - clickedField.y,
      })
      setDragStart({ x, y })
      setDragCurrent({ x, y })
      return
    }

    // Start dragging to create new field (no dialog needed)
    setIsDragging(true)
    setDragStart({ x, y })
    setDragCurrent({ x, y })
    setSelectedField(null)
  }

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    // Disable interactions if no certificate image is uploaded
    if (!certificateImage) {
      canvasRef.current.style.cursor = "default"
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const currentY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)

    if (isMovingField && movingFieldId) {
      // Update the field position in real-time (only for fields with coordinates)
      setFields((prevFields) => {
        const field = prevFields.find((f) => f.id === movingFieldId)
        if (field && field.x !== undefined && field.y !== undefined) {
          const newX = Math.max(0, Math.min(currentX - fieldDragOffset.x, canvasRef.current!.width - field.width))
          const newY = Math.max(0, Math.min(currentY - fieldDragOffset.y, canvasRef.current!.height - field.height))
          
          return prevFields.map((f) => (f.id === movingFieldId ? { ...f, x: newX, y: newY } : f))
        }
        return prevFields
      })
      setDragCurrent({ x: currentX, y: currentY })
      canvasRef.current.style.cursor = "grabbing"
    } else if (isDragging) {
      setDragCurrent({ x: currentX, y: currentY })
      canvasRef.current.style.cursor = "crosshair"
    } else if (!previewMode) {
      // Check if hovering over a field (only those with coordinates)
      const hoveredField = fields.find(
        (f) => f.x !== undefined && f.y !== undefined && currentX >= f.x && currentX <= f.x + f.width && currentY >= f.y && currentY <= f.y + f.height
      )
      canvasRef.current.style.cursor = hoveredField ? "grab" : "crosshair"
    } else {
      canvasRef.current.style.cursor = "default"
    }
  }, [certificateImage, isMovingField, movingFieldId, fieldDragOffset, isDragging, previewMode, fields])

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      setIsDragging(false)
      setIsMovingField(false)
      setMovingFieldId(null)
      return
    }

    // Handle field movement
    if (isMovingField && movingFieldId) {
      setIsMovingField(false)
      setMovingFieldId(null)
      setFieldDragOffset({ x: 0, y: 0 })
      canvasRef.current.style.cursor = "grab"
      return
    }

    // Handle new field creation
    if (isDragging) {
      const rect = canvasRef.current.getBoundingClientRect()
      const endX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
      const endY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)

      // Calculate width and height from drag
      const width = Math.max(Math.abs(endX - dragStart.x), 50)
      const height = Math.max(Math.abs(endY - dragStart.y), 20)
      const x = Math.min(dragStart.x, endX)
      const y = Math.min(dragStart.y, endY)

      // Store the pending field and open dialog to name it
      setPendingField({ x, y, width, height })
      setShowNewField(true)
      setNewFieldName("")
      setNewFieldType("text")

      setIsDragging(false)
      setDragCurrent({ x: 0, y: 0 })
      canvasRef.current.style.cursor = "crosshair"
    } else {
      setIsDragging(false)
      setIsMovingField(false)
    }
  }

  // Draw canvas with fields (optimized to prevent flickering)
  const drawCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw certificate image if available (use cached image)
    if (imageRef.current) {
      const img = imageRef.current
      // Display image at full scale without compressing
      const maxWidth = canvas.width
      const maxHeight = canvas.height
      let displayWidth = img.width
      let displayHeight = img.height

      // Only scale down if image is larger than canvas
      if (displayWidth > maxWidth || displayHeight > maxHeight) {
        const scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight)
        displayWidth *= scale
        displayHeight *= scale
      }

      const x = (canvas.width - displayWidth) / 2
      const y = (canvas.height - displayHeight) / 2

      ctx.drawImage(img, x, y, displayWidth, displayHeight)
    } else {
      // Draw placeholder
      ctx.fillStyle = "#2a2a2a"
      ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20)
      ctx.fillStyle = "#666"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Certificate Preview", canvas.width / 2, canvas.height / 2 - 20)
      ctx.fillText("Upload image above to see preview", canvas.width / 2, canvas.height / 2 + 20)
    }

    // Always draw fields on top
    drawFields(ctx)
  }

  const drawFields = (ctx: CanvasRenderingContext2D) => {
    fields.forEach((field) => {
      // Skip fields without coordinates (like email fields that aren't displayed)
      if (field.x === undefined || field.y === undefined) {
        return
      }

      const isSelected = field.id === selectedField
      const borderColor = isSelected ? "#DB2777" : "#666"
      const fillColor = isSelected ? "rgba(219, 39, 119, 0.1)" : "rgba(100, 100, 100, 0.1)"

      // Draw field box
      ctx.fillStyle = fillColor
      ctx.fillRect(field.x, field.y, field.width, field.height)

      // Draw border
      ctx.strokeStyle = borderColor
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.strokeRect(field.x, field.y, field.width, field.height)

      // Draw field label centered with custom font
      const fontFamily = field.fontFamily || selectedFontFamily
      const fontSize = field.fontSize || selectedFontSize
      const fontColor = field.fontColor || selectedFontColor
      
      ctx.fillStyle = fontColor
      ctx.font = `${fontSize}px "${fontFamily}", sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      
      // Calculate center position
      const centerX = field.x + field.width / 2
      const centerY = field.y + field.height / 2
      
      ctx.fillText(field.name, centerX, centerY)
      
      // Reset text alignment for other operations
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"
    })

    // Draw dragging rectangle in real-time
    if (isDragging) {
      const width = Math.max(Math.abs(dragCurrent.x - dragStart.x), 50)
      const height = Math.max(Math.abs(dragCurrent.y - dragStart.y), 20)
      const x = Math.min(dragStart.x, dragCurrent.x)
      const y = Math.min(dragStart.y, dragCurrent.y)

      // Draw semi-transparent fill
      ctx.fillStyle = "rgba(219, 39, 119, 0.2)"
      ctx.fillRect(x, y, width, height)

      // Draw dashed border
      ctx.strokeStyle = "#DB2777"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, width, height)
      ctx.setLineDash([])

      // Draw dimensions text
      ctx.fillStyle = "#DB2777"
      ctx.font = "bold 11px Arial"
      ctx.textAlign = "left"
      const dimText = `${Math.round(width)} × ${Math.round(height)}`
      ctx.fillText(dimText, x + 5, y - 5)
    }
  }

  // Handle file upload - upload to server and get URL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "certificate" | "badge") => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "template-image")
      formData.append("imageType", type)
      const res = await fetch("/api/v1/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        setModalMessage(error.error || "Failed to upload image")
        setShowErrorModal(true)
        return
      }

      const data = await res.json()

      // Store the base64 data URL
      if (type === "certificate") {
        setCertificateImage(data.base64)
      } else {
        setBadgeImage(data.base64)
      }

      // Image will be loaded by the useEffect that watches certificateImage
    } catch (error) {
      console.error("Error uploading image:", error)
      setModalMessage("An error occurred while uploading the image")
      setShowErrorModal(true)
    }
  }

  // Update field position (only for fields with coordinates)
  const updateFieldPosition = (fieldId: string, dx: number, dy: number) => {
    setFields(fields.map((f) => {
      if (f.id === fieldId && f.x !== undefined && f.y !== undefined) {
        return { ...f, x: Math.max(0, f.x + dx), y: Math.max(0, f.y + dy) }
      }
      return f
    }))
  }

  // Delete field
  const deleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
    setSelectedField(null)
  }

  // Helper function to calculate scale factor from canvas to actual image
  const calculateImageScale = (
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ): { scaleX: number; scaleY: number; displayWidth: number; displayHeight: number } => {
    // Calculate how the image is displayed on canvas (same logic as drawCanvas)
    const maxWidth = canvasWidth
    const maxHeight = canvasHeight
    let displayWidth = imageWidth
    let displayHeight = imageHeight

    let scale = 1

    // If image is larger than canvas, it's scaled down
    if (displayWidth > maxWidth || displayHeight > maxHeight) {
      scale = Math.min(maxWidth / displayWidth, maxHeight / displayHeight)
      displayWidth *= scale
      displayHeight *= scale
    }

    // Calculate scale factors from displayed size to actual image size
    const scaleX = imageWidth / displayWidth
    const scaleY = imageHeight / displayHeight

    return {
      scaleX,
      scaleY,
      displayWidth,
      displayHeight,
    }
  }

  // Helper function to convert canvas coordinates to actual image coordinates
  const convertCanvasToImageCoords = (
    canvasX: number,
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number; scaleX: number; scaleY: number } => {
    const { scaleX, scaleY, displayWidth, displayHeight } = calculateImageScale(
      canvasWidth,
      canvasHeight,
      imageWidth,
      imageHeight
    )

    // Calculate centering offset
    const offsetX = (canvasWidth - displayWidth) / 2
    const offsetY = (canvasHeight - displayHeight) / 2

    // Convert canvas coordinates to displayed image coordinates
    let imageX = canvasX - offsetX
    let imageY = canvasY - offsetY

    // Clamp to displayed image bounds
    imageX = Math.max(0, Math.min(imageX, displayWidth))
    imageY = Math.max(0, Math.min(imageY, displayHeight))

    // Scale to actual image dimensions
    const finalX = (imageX / displayWidth) * imageWidth
    const finalY = (imageY / displayHeight) * imageHeight

    return {
      x: finalX,
      y: finalY,
      scaleX,
      scaleY,
    }
  }

  // Save template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setModalMessage("Please enter a template name")
      setShowErrorModal(true)
      return
    }

    // Check if email field exists
    const hasEmailField = fields.some((f) => f.type === "email")
    if (!hasEmailField) {
      setModalMessage("Please add at least one email field. Email is required for credential issuance.")
      setShowErrorModal(true)
      return
    }

    if (!certificateImage || !imageRef.current) {
      setModalMessage("Please upload a certificate image first")
      setShowErrorModal(true)
      return
    }

    setSaving(true)

    try {
      const canvas = canvasRef.current
      if (!canvas) {
        setModalMessage("Canvas not available")
        setShowErrorModal(true)
        setSaving(false)
        return
      }

      const canvasWidth = canvas.width // 800
      const canvasHeight = canvas.height // 600
      const actualImageWidth = imageRef.current.width
      const actualImageHeight = imageRef.current.height

      const templateData = {
        name: templateName.trim(),
        category: newCategory.trim() || category,
        type: templateType,
        fields: fields.map((f) => {
          // For email fields, coordinates are optional (they may not be displayed)
          if (f.type === "email" && f.x === undefined && f.y === undefined) {
            return {
              name: f.name,
              type: f.type,
              coordinates: undefined,
              fontFamily: f.fontFamily || selectedFontFamily,
              fontSize: f.fontSize || selectedFontSize,
              fontColor: f.fontColor || selectedFontColor,
            }
          }

          // Convert coordinates from canvas space to actual image space
          if (f.x !== undefined && f.y !== undefined) {
            // Get scale factor for this image
            const { scaleX, scaleY } = calculateImageScale(
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            )

            // Calculate center of the field box (where text is displayed)
            const centerCanvasX = f.x + f.width / 2
            const centerCanvasY = f.y + f.height / 2

            // Convert center coordinates to actual image space
            const centerImage = convertCanvasToImageCoords(
              centerCanvasX,
              centerCanvasY,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            )

            // Store center coordinates (this matches where text is drawn on canvas)
            // Note: We still store width/height for reference, but x/y will be the center
            const imageCenterX = Math.round(centerImage.x)
            const imageCenterY = Math.round(centerImage.y)

            // Also convert corners to preserve box dimensions
            const topLeft = convertCanvasToImageCoords(
              f.x,
              f.y,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            )
            const bottomRight = convertCanvasToImageCoords(
              f.x + f.width,
              f.y + f.height,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            )
            const imageWidth = Math.round(Math.abs(bottomRight.x - topLeft.x))
            const imageHeight = Math.round(Math.abs(bottomRight.y - topLeft.y))

            // Scale font size proportionally to image scale
            // Use average scale to maintain aspect ratio for font size
            const avgScale = (scaleX + scaleY) / 2
            const canvasFontSize = f.fontSize || selectedFontSize
            const scaledFontSize = Math.round(canvasFontSize * avgScale)

            return {
              name: f.name,
              type: f.type,
              coordinates: {
                x: imageCenterX, // Center X coordinate
                y: imageCenterY, // Center Y coordinate
                width: Math.max(1, imageWidth), // Box width for reference
                height: Math.max(1, imageHeight), // Box height for reference
              },
              fontFamily: f.fontFamily || selectedFontFamily,
              fontSize: scaledFontSize, // Scaled font size relative to image
              fontColor: f.fontColor || selectedFontColor,
            }
          }

          return {
            name: f.name,
            type: f.type,
            coordinates: undefined,
            fontFamily: f.fontFamily || selectedFontFamily,
            fontSize: f.fontSize || selectedFontSize,
            fontColor: f.fontColor || selectedFontColor,
          }
        }),
        certificateImage,
        badgeImage,
      }

      const res = await fetch("/api/v1/issuer/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(templateData),
      })

      if (!res.ok) {
        const error = await res.json()
        setModalMessage(error.error || "Failed to save template")
        setShowErrorModal(true)
        return
      }

      setModalMessage("Template saved successfully!")
      setShowSuccessModal(true)
      // Redirect after showing success modal
      setTimeout(() => {
        router.push("/dashboard/issuer/templates")
      }, 1500)
    } catch (error) {
      console.error("Error saving template:", error)
      setModalMessage("An error occurred while saving the template")
      setShowErrorModal(true)
    } finally {
      setSaving(false)
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
                <h1 className="text-3xl font-bold text-foreground">Create Template</h1>
                <p className="text-muted-foreground">Design your credential template with custom fields and upload images</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Configuration */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                    {/* Template Name */}
                    <div className="space-y-2">
                      <Label htmlFor="template-name" className="text-sm font-semibold">
                        Template Name
                      </Label>
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Professional Certificate"
                        className="bg-background/50"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-semibold">
                        Category
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className="bg-background/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="achievement">Achievement</SelectItem>
                        </SelectContent>
                      </Select>
                      {category !== "general" && (
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Or enter custom category"
                          className="bg-background/50 text-xs"
                        />
                      )}
                    </div>

                    {/* Template Type */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Credential Type</Label>
                      <div className="space-y-2">
                        {(["certificate", "badge", "both"] as const).map((type) => (
                          <div key={type} className="flex items-center gap-2">
                            <Checkbox
                              checked={templateType === type}
                              onCheckedChange={() => setTemplateType(type)}
                              id={type}
                            />
                            <Label htmlFor={type} className="font-normal capitalize cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Image Upload Section */}
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                    <h3 className="font-semibold text-foreground">Upload Assets</h3>

                    {/* Certificate Upload */}
                    {(templateType === "certificate" || templateType === "both") && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Certificate Image (PDF/PNG)</Label>
                        <label className="flex items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="text-center">
                            <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Click to upload</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => handleImageUpload(e, "certificate")}
                            className="hidden"
                          />
                        </label>
                        {certificateImage && <p className="text-xs text-emerald-500">✓ Certificate uploaded</p>}
                      </div>
                    )}

                    {/* Badge Upload */}
                    {(templateType === "badge" || templateType === "both") && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Badge Image (PNG)</Label>
                        <label className="flex items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="text-center">
                            <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Click to upload</p>
                          </div>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            onChange={(e) => handleImageUpload(e, "badge")}
                            className="hidden"
                          />
                        </label>
                        {badgeImage && <p className="text-xs text-emerald-500">✓ Badge uploaded</p>}
                      </div>
                    )}
                  </Card>

                  {/* Fields List */}
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Fields ({fields.length})</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Check if email field already exists
                          const hasEmailField = fields.some((f) => f.type === "email")
                          if (hasEmailField) {
                            setModalMessage("Email field already exists. Only one email field is allowed.")
                            setShowErrorModal(true)
                            return
                          }
                          // Add email field without coordinates (not displayed on certificate)
                          const emailField: TemplateField = {
                            id: Date.now().toString(),
                            name: "Email ID",
                            type: "email",
                            x: undefined,
                            y: undefined,
                            width: 0,
                            height: 0,
                            fontFamily: selectedFontFamily,
                            fontSize: selectedFontSize,
                            fontColor: selectedFontColor,
                          }
                          setFields([...fields, emailField])
                          setSelectedField(emailField.id)
                        }}
                        className="text-xs h-7"
                      >
                        + Add Email Field
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      💡 Note: Drag on canvas to add fields, or click the button above to add an email field (not displayed on certificate).
                    </p>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {fields.map((field) => (
                        <div
                          key={field.id}
                          onClick={() => setSelectedField(field.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedField === field.id
                              ? "bg-primary/20 border border-primary"
                              : "bg-background/50 border border-border/50 hover:bg-background/70"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm text-foreground">{field.name}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteField(field.id)
                              }}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {field.type} {field.x !== undefined && field.y !== undefined ? `• (${Math.round(field.x)}, ${Math.round(field.y)})` : "• (Not displayed)"}
                          </p>
                        </div>
                      ))}
                    </div>

                    {fields.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No fields added yet</p>}
                  </Card>

                  {/* Dialog for naming fields */}
                  <Dialog open={showNewField} onOpenChange={(open) => {
                    setShowNewField(open)
                    if (!open) {
                      setPendingField(null)
                    }
                  }}>
                    <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Name Your Field</DialogTitle>
                            <DialogDescription>
                              Enter a name and type for the field you just drew on the canvas
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="field-name">Field Name *</Label>
                              <Input
                                id="field-name"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="e.g., Recipient Name"
                                autoFocus
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="field-type">Field Type</Label>
                              <Select value={newFieldType} onValueChange={(v: "text" | "email" | "number" | "date" | "id") => setNewFieldType(v)}>
                                <SelectTrigger id="field-type">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="id">ID</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {pendingField && (
                              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                  Position: ({Math.round(pendingField.x)}, {Math.round(pendingField.y)}) • Size: {Math.round(pendingField.width)} × {Math.round(pendingField.height)}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground italic">* Email field is mandatory for credential issuance</p>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowNewField(false)
                                  setPendingField(null)
                                  setNewFieldName("")
                                }}
                              >
                                Cancel
                              </Button>
                              <PrimaryButton
                                onClick={() => {
                                  if (!newFieldName.trim() || !pendingField) {
                                    setModalMessage("Please enter a field name")
                                    setShowErrorModal(true)
                                    return
                                  }

                                  const newField: TemplateField = {
                                    id: Date.now().toString(),
                                    name: newFieldName.trim(),
                                    type: newFieldType,
                                    x: pendingField.x,
                                    y: pendingField.y,
                                    width: pendingField.width,
                                    height: pendingField.height,
                                    fontFamily: selectedFontFamily,
                                    fontSize: selectedFontSize,
                                    fontColor: selectedFontColor,
                                  }

                                  setFields([...fields, newField])
                                  setSelectedField(newField.id)
                                  setNewFieldName("")
                                  setNewFieldType("text")
                                  setPendingField(null)
                                  setShowNewField(false)
                                }}
                                disabled={!newFieldName.trim()}
                              >
                                Add Field
                              </PrimaryButton>
                            </div>
                          </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Canvas Area */}
                <div className="lg:col-span-3 space-y-4">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">Template Canvas</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewMode(!previewMode)
                          setIsDragging(false)
                          setSelectedField(null)
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {previewMode ? "Edit" : "Preview"}
                      </Button>
                    </div>
                    {!previewMode && (
                      <p className="text-xs text-muted-foreground italic">
                        💡 Note: Click and drag on the canvas to draw fields. Fields can be moved by clicking and dragging them.
                      </p>
                    )}

                    {/* Formatting Toolbar - Header Style */}
                    {selectedField && !previewMode && certificateImage && fields.find((f) => f.id === selectedField)?.x !== undefined && fields.find((f) => f.id === selectedField)?.y !== undefined && (
                      <div className="flex items-center gap-3 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg px-4 py-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Font:</Label>
                          <Select
                            value={fields.find((f) => f.id === selectedField)?.fontFamily || selectedFontFamily}
                            onValueChange={(value) => {
                              if (selectedField) {
                                setFields(
                                  fields.map((f) => (f.id === selectedField ? { ...f, fontFamily: value } : f))
                                )
                              } else {
                                setSelectedFontFamily(value)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs bg-transparent border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {googleFonts.map((font) => (
                                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Size:</Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min="8"
                              max="72"
                              value={fields.find((f) => f.id === selectedField)?.fontSize || selectedFontSize}
                              onChange={(e) => {
                                const size = parseInt(e.target.value) || 16
                                if (selectedField) {
                                  setFields(
                                    fields.map((f) => (f.id === selectedField ? { ...f, fontSize: size } : f))
                                  )
                                } else {
                                  setSelectedFontSize(size)
                                }
                              }}
                              className="h-8 w-16 text-xs bg-background border-2 border-border rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Color:</Label>
                          <input
                            type="color"
                            value={fields.find((f) => f.id === selectedField)?.fontColor || selectedFontColor}
                            onChange={(e) => {
                              if (selectedField) {
                                setFields(
                                  fields.map((f) => (f.id === selectedField ? { ...f, fontColor: e.target.value } : f))
                                )
                              } else {
                                setSelectedFontColor(e.target.value)
                              }
                            }}
                            className="h-8 w-12 cursor-pointer bg-background border-2 border-primary/70 rounded transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Canvas */}
                    <div
                      className={`border border-border/50 rounded-lg overflow-hidden bg-black/50 ${
                        !previewMode && certificateImage ? "cursor-crosshair" : "cursor-default"
                      } ${!certificateImage ? "opacity-50" : ""}`}
                    >
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={() => {
                          if (isDragging || isMovingField) {
                            setIsDragging(false)
                            setIsMovingField(false)
                            setMovingFieldId(null)
                            setDragCurrent({ x: 0, y: 0 })
                          }
                        }}
                        className="w-full border-b border-border/50"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>

                    {/* Real-time JSON Preview */}
                    <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-foreground">Field Data (JSON Format)</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(
                              fields.map((f) => {
                                const base: {
                                  name: string
                                  type: string
                                  coordinates?: { x: number; y: number; width: number; height: number }
                                } = { name: f.name, type: f.type }
                                if (f.x !== undefined && f.y !== undefined) {
                                  base.coordinates = { x: f.x, y: f.y, width: f.width, height: f.height }
                                }
                                return base
                              }),
                              null,
                              2
                            ))
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
                        {JSON.stringify(
                          fields.map((f) => {
                            const base: {
                              name: string
                              type: string
                              coordinates?: { x: number; y: number; width: number; height: number }
                              fontFamily: string
                              fontSize: number
                              fontColor: string
                            } = {
                              name: f.name,
                              type: f.type,
                              fontFamily: f.fontFamily || selectedFontFamily,
                              fontSize: f.fontSize || selectedFontSize,
                              fontColor: f.fontColor || selectedFontColor,
                            }
                            
                            // Only include coordinates if field has them (not email fields without display)
                            if (f.x !== undefined && f.y !== undefined) {
                              base.coordinates = {
                                x: Math.round(f.x),
                                y: Math.round(f.y),
                                width: Math.round(f.width),
                                height: Math.round(f.height),
                              }
                            }
                            
                            return base
                          }),
                          null,
                          2
                        )}
                      </pre>
                    </Card>

                    {/* Field Controls */}
                    {selectedField && !previewMode && certificateImage && fields.find((f) => f.id === selectedField)?.x !== undefined && fields.find((f) => f.id === selectedField)?.y !== undefined && (
                      <Card className="p-4 bg-background/50 border border-primary/20 space-y-3">
                        <h3 className="font-semibold text-sm text-foreground">Field Controls</h3>
                        <div className="grid grid-cols-4 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFieldPosition(selectedField, -10, 0)}
                            className="gap-1"
                          >
                            ← Move
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFieldPosition(selectedField, 10, 0)}
                            className="gap-1"
                          >
                            Move →
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFieldPosition(selectedField, 0, -10)}
                            className="gap-1"
                          >
                            ↑ Move
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFieldPosition(selectedField, 0, 10)}
                            className="gap-1"
                          >
                            Move ↓
                          </Button>
                        </div>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" className="gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        Export Template
                      </Button>
                      <PrimaryButton onClick={handleSaveTemplate} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Template"}
                      </PrimaryButton>
                    </div>
                  </Card>

                  {/* Help Section */}
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="font-semibold text-foreground mb-3">Help & Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>
                        <strong className="text-foreground">1. Draw Field:</strong> Click and drag on the canvas to draw a
                        rectangle where you want the field
                      </li>
                      <li>
                        <strong className="text-foreground">2. Name Field:</strong> After drawing, a dialog will open to
                        enter the field name and type
                      </li>
                      <li>
                        <strong className="text-foreground">3. Move Field:</strong> Click and drag an existing field to move
                        it around the canvas, or use the arrow buttons to fine-tune placement
                      </li>
                      <li>
                        <strong className="text-foreground">4. Email Required:</strong> At least one email field must be
                        added for recipient verification
                      </li>
                      <li>
                        <strong className="text-foreground">5. View JSON:</strong> Check the JSON preview below the canvas
                        to see field coordinates and data
                      </li>
                      <li>
                        <strong className="text-foreground">6. Save Template:</strong> Click save to store template and
                        start issuing credentials
                      </li>
                    </ul>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowErrorModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Success</DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
