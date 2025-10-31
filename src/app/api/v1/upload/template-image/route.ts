import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "templates")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()?.toLowerCase() || "png"
    const filename = `${timestamp}-${randomString}.${extension}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Return file URL
    const fileUrl = `/uploads/templates/${filename}`

    return NextResponse.json({
      url: fileUrl,
      filename,
    })
  } catch (error) {
    console.error("Error uploading template image:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

export const POST = withIssuer(handler)

