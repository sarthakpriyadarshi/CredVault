import { NextRequest, NextResponse } from "next/server"

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Validate file type (only images)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Read file and convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    
    // Create data URL with MIME type
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      message: "File uploaded successfully",
      base64: dataUrl,
      mimeType: file.type,
      size: file.size,
    })
  } catch (error: unknown) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: error && typeof error === "object" && "message" in error ? String(error.message) : "Failed to upload file" },
      { status: 500 }
    )
  }
}

export const POST = handler

