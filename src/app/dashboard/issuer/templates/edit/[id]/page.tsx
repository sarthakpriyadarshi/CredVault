"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
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
import { Upload, Trash2, Save, Loader2 } from "lucide-react"
import { PrimaryButton } from "@/components/ui/primary-button"
import { GOOGLE_FONTS } from "@/lib/fonts"
import { LoadingScreen } from "@/components/loading-screen"
import { ColorPickerComponent } from "@/components/ui/color-picker"

interface TemplateField {
  id: string
  name: string
  type: "text" | "email" | "number" | "date" | "id"
  x?: number
  y?: number
  width: number
  height: number
  fontFamily?: string
  fontSize?: number
  fontColor?: string
}

export default function EditTemplatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const badgeImageRef = useRef<HTMLImageElement | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [templateName, setTemplateName] = useState("")
  const [category, setCategory] = useState("general")
  const [newCategory, setNewCategory] = useState("")
  const [templateType, setTemplateType] = useState<"certificate" | "badge" | "both">("certificate")
  const [fields, setFields] = useState<TemplateField[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [certificateImage, setCertificateImage] = useState<string | null>(null)
  const [badgeImage, setBadgeImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedFontFamily] = useState("Roboto")
  const [selectedFontSize] = useState(16)
  const [selectedFontColor] = useState("#000000")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  const [isMovingField, setIsMovingField] = useState(false)
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null)
  const [fieldDragOffset, setFieldDragOffset] = useState({ x: 0, y: 0 })
  
  // New field creation states
  const [showNewField, setShowNewField] = useState(false)
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState<"text" | "email" | "number" | "date" | "id">("text")
  const [pendingField, setPendingField] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Modal states for error and success messages
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")

  // Canvas dimensions
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role !== "issuer") {
      router.push("/auth/issuer/login")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && !session.user?.isVerified) {
      router.push("/auth/issuer/login?pending=true")
    } else if (status === "authenticated" && session?.user?.role === "issuer" && session.user?.isVerified) {
      loadTemplate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/v1/issuer/templates/${templateId}`, {
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/issuer/login")
          return
        }
        setModalMessage("Failed to load template")
        setShowErrorModal(true)
        setTimeout(() => {
          setShowErrorModal(false)
          // Allow modal to close before navigation
          setTimeout(() => {
            router.push("/dashboard/issuer/templates")
          }, 100)
        }, 1500)
        return
      }

      const data = await res.json()
      const template = data.template || data

      // Populate form with existing data
      setTemplateName(template.name || "")
      setCategory(template.category || "general")
      setTemplateType(template.type || "certificate")
      
      // Load certificate image first if available
      if (template.certificateImageUrl || template.certificateImage) {
        const imageUrl = template.certificateImageUrl || template.certificateImage
        setCertificateImage(imageUrl)
        
        // Load image and wait for it to complete
        const img = new Image()
        img.crossOrigin = "anonymous"
        
        const imageLoadPromise = new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn("Image load timeout")
            resolve()
          }, 10000) // 10 second timeout
          
          img.onload = () => {
            clearTimeout(timeout)
            imageRef.current = img
            resolve()
          }
          img.onerror = () => {
            clearTimeout(timeout)
            console.error("Failed to load image")
            resolve()
          }
        })
        
        img.src = imageUrl
        await imageLoadPromise
        
        // Now convert placeholders to fields with coordinate conversion
        if (template.placeholders && Array.isArray(template.placeholders) && img.complete && img.naturalWidth > 0) {
          const actualImageWidth = img.naturalWidth
          const actualImageHeight = img.naturalHeight
          
          const loadedFields = template.placeholders.map((p: { fieldName?: string; name?: string; type?: string; x?: number; y?: number; width?: number; height?: number; fontFamily?: string; fontSize?: number; color?: string; fontColor?: string }, index: number) => {
            // Convert from image coordinates to canvas coordinates if coordinates exist
            if (p.x !== undefined && p.y !== undefined) {
              const { scaleX, scaleY } = calculateImageScale(
                CANVAS_WIDTH,
                CANVAS_HEIGHT,
                actualImageWidth,
                actualImageHeight
              )
              
              // Convert center coordinates from image space to canvas space
              const canvasX = p.x / scaleX
              const canvasY = p.y / scaleY
              
              // Convert width/height if provided
              const canvasWidth = p.width ? p.width / scaleX : 200
              const canvasHeight = p.height ? p.height / scaleY : 40
              
              // Calculate top-left corner from center
              const topLeftX = canvasX - canvasWidth / 2
              const topLeftY = canvasY - canvasHeight / 2
              
              // Convert font size back to canvas scale
              const canvasFontSize = p.fontSize ? Math.round(p.fontSize / ((scaleX + scaleY) / 2)) : 16
              
              return {
                id: `field-${Date.now()}-${index}`,
                name: p.fieldName || p.name || `Field ${index + 1}`,
                type: p.type || "text",
                x: topLeftX,
                y: topLeftY,
                width: canvasWidth,
                height: canvasHeight,
                fontFamily: p.fontFamily || "Roboto",
                fontSize: canvasFontSize,
                fontColor: p.fontColor || p.color || "#000000",
              }
            } else {
              // Email field without coordinates
              return {
                id: `field-${Date.now()}-${index}`,
                name: p.fieldName || p.name || `Field ${index + 1}`,
                type: p.type || "text",
                x: undefined,
                y: undefined,
                width: 200,
                height: 40,
                fontFamily: p.fontFamily || "Roboto",
                fontSize: p.fontSize || 16,
                fontColor: p.fontColor || p.color || "#000000",
              }
            }
          })
          setFields(loadedFields)
        } else if (template.placeholders && Array.isArray(template.placeholders)) {
          // Fallback: Load placeholders without coordinate conversion
          const loadedFields = template.placeholders.map((p: { fieldName?: string; name?: string; type?: string; x?: number; y?: number; width?: number; height?: number; fontFamily?: string; fontSize?: number; color?: string; fontColor?: string }, index: number) => ({
            id: `field-${Date.now()}-${index}`,
            name: p.fieldName || p.name || `Field ${index + 1}`,
            type: p.type || "text",
            x: p.x,
            y: p.y,
            width: p.width || 200,
            height: p.height || 40,
            fontFamily: p.fontFamily || "Roboto",
            fontSize: p.fontSize || 16,
            fontColor: p.fontColor || p.color || "#000000",
          }))
          setFields(loadedFields)
        }
      } else if (template.placeholders && Array.isArray(template.placeholders)) {
        // No image, just load placeholders as-is
        const loadedFields = template.placeholders.map((p: { fieldName?: string; name?: string; type?: string; x?: number; y?: number; width?: number; height?: number; fontFamily?: string; fontSize?: number; color?: string; fontColor?: string }, index: number) => ({
          id: `field-${Date.now()}-${index}`,
          name: p.fieldName || p.name || `Field ${index + 1}`,
          type: p.type || "text",
          x: p.x,
          y: p.y,
          width: p.width || 200,
          height: p.height || 40,
          fontFamily: p.fontFamily || "Roboto",
          fontSize: p.fontSize || 16,
          fontColor: p.fontColor || p.color || "#000000",
        }))
        setFields(loadedFields)
      }
      
      if (template.badgeImageUrl || template.badgeImage) {
        const badgeUrl = template.badgeImageUrl || template.badgeImage
        setBadgeImage(badgeUrl)
        const badgeImg = new Image()
        badgeImg.crossOrigin = "anonymous"
        badgeImg.onload = () => {
          badgeImageRef.current = badgeImg
        }
        badgeImg.src = badgeUrl
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading template:", error)
      setModalMessage("Failed to load template")
      setShowErrorModal(true)
      setTimeout(() => {
        setShowErrorModal(false)
        // Allow modal to close before navigation
        setTimeout(() => {
          router.push("/dashboard/issuer/templates")
        }, 100)
      }, 1500)
    }
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas with dark background (matching create template)
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw certificate image if available
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

    // Draw fields (matching create template styling)
    fields.forEach((field) => {
      if (field.x === undefined || field.y === undefined) return

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

    // Draw dragging rectangle if creating new field
    if (isDragging && dragStart.x && dragCurrent.x) {
      const x = Math.min(dragStart.x, dragCurrent.x)
      const y = Math.min(dragStart.y, dragCurrent.y)
      const width = Math.abs(dragCurrent.x - dragStart.x)
      const height = Math.abs(dragCurrent.y - dragStart.y)

      ctx.strokeStyle = "#DB2777"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x, y, width, height)
      ctx.fillStyle = "rgba(219, 39, 119, 0.1)"
      ctx.fillRect(x, y, width, height)
      ctx.setLineDash([])
    }
  }, [certificateImage, fields, selectedField, selectedFontFamily, selectedFontSize, selectedFontColor, isDragging, dragStart, dragCurrent])

  // Effect to redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "certificate" | "badge") => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (type === "certificate") {
        setCertificateImage(dataUrl)
        const img = new Image()
        img.onload = () => {
          imageRef.current = img
          drawCanvas()
        }
        img.src = dataUrl
      } else {
        setBadgeImage(dataUrl)
        const img = new Image()
        img.onload = () => {
          badgeImageRef.current = img
        }
        img.src = dataUrl
      }
    }
    reader.readAsDataURL(file)
  }

  const addField = (type: TemplateField["type"]) => {
    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      name: type === "email" ? "Recipient Email" : `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      type,
      x: type === "email" ? undefined : 50,
      y: type === "email" ? undefined : 50,
      width: 200,
      height: 40,
      fontFamily: selectedFontFamily,
      fontSize: selectedFontSize,
      fontColor: selectedFontColor,
    }
    setFields([...fields, newField])
    setSelectedField(newField.id)
  }

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
    if (selectedField === id) {
      setSelectedField(null)
    }
  }

  // Add new field from dialog
  const handleAddNewField = () => {
    if (!newFieldName.trim() || !pendingField) {
      setModalMessage("Please enter a field name")
      setShowErrorModal(true)
      return
    }

    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      x: newFieldType === "email" ? undefined : pendingField.x,
      y: newFieldType === "email" ? undefined : pendingField.y,
      width: pendingField.width,
      height: pendingField.height,
      fontFamily: selectedFontFamily,
      fontSize: selectedFontSize,
      fontColor: selectedFontColor,
    }

    setFields([...fields, newField])
    setSelectedField(newField.id)
    setShowNewField(false)
    setPendingField(null)
    setNewFieldName("")
    setNewFieldType("text")
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !certificateImage) return

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

    // Start dragging to create new field
    setIsDragging(true)
    setDragStart({ x, y })
    setDragCurrent({ x, y })
    setSelectedField(null)
  }

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Disable interactions if no certificate image is uploaded
    if (!certificateImage) {
      canvas.style.cursor = "default"
      return
    }

    const rect = canvas.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) * (canvas.width / rect.width)
    const currentY = (e.clientY - rect.top) * (canvas.height / rect.height)

    if (isMovingField && movingFieldId) {
      // Update the field position in real-time (only for fields with coordinates)
      setFields((prevFields) => {
        const field = prevFields.find((f) => f.id === movingFieldId)
        if (field && field.x !== undefined && field.y !== undefined) {
          const newX = Math.max(0, Math.min(currentX - fieldDragOffset.x, canvas.width - field.width))
          const newY = Math.max(0, Math.min(currentY - fieldDragOffset.y, canvas.height - field.height))
          
          return prevFields.map((f) => (f.id === movingFieldId ? { ...f, x: newX, y: newY } : f))
        }
        return prevFields
      })
      setDragCurrent({ x: currentX, y: currentY })
      canvas.style.cursor = "grabbing"
    } else if (isDragging) {
      setDragCurrent({ x: currentX, y: currentY })
      canvas.style.cursor = "crosshair"
    } else {
      // Check if hovering over a field (only those with coordinates)
      const hoveredField = fields.find(
        (f) => f.x !== undefined && f.y !== undefined && currentX >= f.x && currentX <= f.x + f.width && currentY >= f.y && currentY <= f.y + f.height
      )
      canvas.style.cursor = hoveredField ? "grab" : "crosshair"
    }
  }, [certificateImage, isMovingField, movingFieldId, fieldDragOffset, isDragging, fields])

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

  const calculateImageScale = (
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    const scaleX = imageWidth / canvasWidth
    const scaleY = imageHeight / canvasHeight
    return { scaleX, scaleY }
  }

  const convertCanvasToImageCoords = (
    canvasX: number,
    canvasY: number,
    canvasWidth: number,
    canvasHeight: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    const { scaleX, scaleY } = calculateImageScale(canvasWidth, canvasHeight, imageWidth, imageHeight)
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY,
    }
  }

  const handleUpdateTemplate = async () => {
    if (!templateName.trim()) {
      setModalMessage("Please enter a template name")
      setShowErrorModal(true)
      return
    }

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

      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const actualImageWidth = imageRef.current.width
      const actualImageHeight = imageRef.current.height

      const templateData = {
        name: templateName.trim(),
        category: newCategory.trim() || category,
        type: templateType,
        fields: fields.map((f) => {
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

          if (f.x !== undefined && f.y !== undefined) {
            const { scaleX, scaleY } = calculateImageScale(
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            )

            const centerCanvasX = f.x + f.width / 2
            const centerCanvasY = f.y + f.height / 2

            const centerImage = convertCanvasToImageCoords(
              centerCanvasX,
              centerCanvasY,
              canvasWidth,
              canvasHeight,
              actualImageWidth,
              actualImageHeight
            )

            const imageCenterX = Math.round(centerImage.x)
            const imageCenterY = Math.round(centerImage.y)

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

            const avgScale = (scaleX + scaleY) / 2
            const canvasFontSize = f.fontSize || selectedFontSize
            const scaledFontSize = Math.round(canvasFontSize * avgScale)

            return {
              name: f.name,
              type: f.type,
              coordinates: {
                x: imageCenterX,
                y: imageCenterY,
                width: Math.max(1, imageWidth),
                height: Math.max(1, imageHeight),
              },
              fontFamily: f.fontFamily || selectedFontFamily,
              fontSize: scaledFontSize,
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

      const res = await fetch(`/api/v1/issuer/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(templateData),
      })

      if (!res.ok) {
        const error = await res.json()
        setModalMessage(error.error || "Failed to update template")
        setShowErrorModal(true)
        return
      }

      setModalMessage("Template updated successfully!")
      setShowSuccessModal(true)
      // Close modal and redirect after short delay
      setTimeout(() => {
        setShowSuccessModal(false)
        // Allow modal to close before navigation
        setTimeout(() => {
          router.push("/dashboard/issuer/templates")
        }, 100)
      }, 1500)
    } catch (error) {
      console.error("Error updating template:", error)
      setModalMessage("An error occurred while updating the template")
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return <LoadingScreen message={loading ? "Loading template..." : "Loading session..."} />
  }

  if (status === "unauthenticated" || (status === "authenticated" && (!session || session.user?.role !== "issuer"))) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-black relative">
      <div className="fixed inset-0 bg-linear-to-br from-zinc-900 via-black to-zinc-900 z-0" />
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
                <h1 className="text-3xl font-bold text-foreground">Edit Template</h1>
                <p className="text-muted-foreground">Modify your credential template with custom fields and images</p>
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
                        <Label htmlFor="certificate-upload" className="text-sm">
                          Certificate Image
                        </Label>
                        <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-primary/50 transition-colors bg-background/30 cursor-pointer">
                          <input
                            type="file"
                            id="certificate-upload"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "certificate")}
                            className="hidden"
                          />
                          <label htmlFor="certificate-upload" className="cursor-pointer">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {certificateImage ? "Change image" : "Upload certificate"}
                            </p>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Badge Upload */}
                    {(templateType === "badge" || templateType === "both") && (
                      <div className="space-y-2">
                        <Label htmlFor="badge-upload" className="text-sm">
                          Badge Image
                        </Label>
                        <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-primary/50 transition-colors bg-background/30 cursor-pointer">
                          <input
                            type="file"
                            id="badge-upload"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "badge")}
                            className="hidden"
                          />
                          <label htmlFor="badge-upload" className="cursor-pointer">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {badgeImage ? "Change image" : "Upload badge"}
                            </p>
                          </label>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Field Management Card */}
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Fields</h3>
                      <span className="text-xs text-muted-foreground">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => addField("text")}
                        variant="outline"
                        className="w-full justify-start text-xs h-7"
                      >
                        + Add Text Field
                      </Button>
                      <Button
                        onClick={() => addField("email")}
                        variant="outline"
                        className="w-full justify-start text-xs h-7"
                      >
                        + Add Email Field
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      💡 Click on fields in the canvas to move them
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

                  {/* Save Button */}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/dashboard/issuer/templates")} className="flex-1">
                      Cancel
                    </Button>
                    <PrimaryButton onClick={handleUpdateTemplate} disabled={saving} className="flex-1 gap-2">
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                </div>

                {/* Right Side - Canvas */}
                <div className="lg:col-span-3 space-y-4">
                  <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">Template Canvas</h2>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      💡 Note: Click on fields in the canvas to move them
                    </p>

                    {/* Formatting Toolbar - Header Style */}
                    {selectedField && certificateImage && fields.find((f) => f.id === selectedField)?.x !== undefined && fields.find((f) => f.id === selectedField)?.y !== undefined && (
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
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs bg-transparent border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {GOOGLE_FONTS.map((font) => (
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
                                }
                              }}
                              className="h-8 w-16 text-xs bg-background border-2 border-border rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-muted-foreground">px</span>
                          </div>
                        </div>

                        <ColorPickerComponent
                          label="Color:"
                          value={fields.find((f) => f.id === selectedField)?.fontColor || selectedFontColor}
                          onChange={(color) => {
                            if (selectedField) {
                              setFields(
                                fields.map((f) => (f.id === selectedField ? { ...f, fontColor: color } : f))
                              )
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Canvas */}
                    <div
                      className={`border border-border/50 rounded-lg overflow-hidden bg-black/50 ${
                        certificateImage ? "cursor-crosshair" : "cursor-default"
                      } ${!certificateImage ? "opacity-50" : ""}`}
                    >
                      <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={() => {
                          if (isMovingField) {
                            setIsMovingField(false)
                            setMovingFieldId(null)
                          }
                        }}
                        className="w-full border-b border-border/50"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Hidden images for loading */}
      {certificateImage && (
        <img
          ref={imageRef}
          src={certificateImage}
          alt="Certificate"
          className="hidden"
          onLoad={drawCanvas}
          crossOrigin="anonymous"
        />
      )}

      {/* Add New Field Dialog */}
      <Dialog open={showNewField} onOpenChange={setShowNewField}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
            <DialogDescription>Enter a name and type for the new field you created.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-field-name">Field Name</Label>
              <Input
                id="new-field-name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g., Recipient Name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-field-type">Field Type</Label>
              <Select value={newFieldType} onValueChange={(value: "text" | "email" | "number" | "date" | "id") => setNewFieldType(value)}>
                <SelectTrigger id="new-field-type">
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
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowNewField(false)
              setPendingField(null)
              setNewFieldName("")
              setNewFieldType("text")
            }}>
              Cancel
            </Button>
            <PrimaryButton onClick={handleAddNewField}>
              Add Field
            </PrimaryButton>
          </div>
        </DialogContent>
      </Dialog>

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
