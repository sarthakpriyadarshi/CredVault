import { NextRequest, NextResponse } from "next/server"
import { withIssuer } from "@/lib/api/middleware"

async function handler(
  req: NextRequest,
  _context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const imageType = formData.get("type") as string | null // "certificate" or "badge"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (!imageType || !["certificate", "badge"].includes(imageType)) {
      return NextResponse.json({ error: "Invalid image type. Must be 'certificate' or 'badge'" }, { status: 400 })
    }

    // Validate file type (images and PDFs)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Read file and convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    
    // Create data URL with MIME type
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      base64: dataUrl,
      mimeType: file.type,
      size: file.size,
      type: imageType,
    })
  } catch (error) {
    console.error("Error uploading template image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

export const POST = withIssuer(handler)

