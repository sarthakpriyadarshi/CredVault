import sharp from "sharp"
import { createCanvas, loadImage } from "canvas"
import { join } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { IPlaceholder } from "@/models/Template"
import { loadFont } from "./font-loader"

interface GenerateCertificateOptions {
  templateImagePath: string // Path to the template certificate image (e.g., /uploads/templates/xxx.png)
  placeholders: IPlaceholder[]
  data: Record<string, string> // Field name -> value mapping
  outputFilename?: string
}

/**
 * Generate a certificate image by overlaying text on the template image
 */
export async function generateCertificate(options: GenerateCertificateOptions): Promise<string> {
  const { templateImagePath, placeholders, data, outputFilename } = options

  try {
    // Resolve the full path to the template image
    const templateFullPath = join(process.cwd(), "public", templateImagePath.replace(/^\//, ""))

    if (!existsSync(templateFullPath)) {
      throw new Error(`Template image not found: ${templateFullPath}`)
    }

    // Load the template image
    // First check if it's an image file or PDF
    const fileExtension = templateFullPath.split(".").pop()?.toLowerCase()
    
    if (fileExtension === "pdf") {
      throw new Error("PDF templates are not yet supported. Please use PNG, JPG, or JPEG images.")
    }

    // For images, use sharp to get dimensions and convert to PNG if needed
    const imageMetadata = await sharp(templateFullPath).metadata()
    const width = imageMetadata.width || 0
    const height = imageMetadata.height || 0

    if (width === 0 || height === 0) {
      throw new Error("Could not determine image dimensions")
    }

    // Convert image to PNG buffer for canvas compatibility
    const imageBuffer = await sharp(templateFullPath).png().toBuffer()
    const image = await loadImage(imageBuffer)

    // Create canvas with the same dimensions as the image
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    // Draw the base image at full size (no scaling)
    ctx.drawImage(image, 0, 0, width, height)
    
    // Debug: Log image dimensions and placeholders
    console.log(`[Certificate Generator] Image dimensions: ${width}x${height}`)
    console.log(`[Certificate Generator] Placeholders:`, placeholders.map(p => ({
      fieldName: p.fieldName,
      x: p.x,
      y: p.y,
      fontSize: p.fontSize,
      fontFamily: p.fontFamily,
    })))
    console.log(`[Certificate Generator] Data:`, data)

    // Set default text properties
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Collect unique font families from placeholders
    // Load all fonts that are specified, not just Google Fonts
    const uniqueFontFamilies = new Set<string>()
    for (const placeholder of placeholders) {
      if (placeholder.fontFamily) {
        uniqueFontFamilies.add(placeholder.fontFamily)
      }
    }

    // Preload all required fonts
    const fontLoadResults = await Promise.all(
      Array.from(uniqueFontFamilies).map(async (fontFamily) => {
        try {
          // Try loading the font (will download if needed)
          const loaded = await loadFont(fontFamily, 400)
          return { fontFamily, loaded }
        } catch (error) {
          console.warn(`Failed to load font ${fontFamily}:`, error)
          return { fontFamily, loaded: false }
        }
      })
    )

    // Log font loading results
    console.log(`[Certificate Generator] Font loading results:`, fontLoadResults.map(r => `${r.fontFamily}: ${r.loaded ? "loaded" : "failed"}`))

    // Draw each placeholder text on the canvas
    for (const placeholder of placeholders) {
      // Skip email fields that don't have coordinates (not displayed on certificate)
      if (placeholder.type === "email" && (placeholder.x === undefined || placeholder.y === undefined)) {
        continue
      }

      // Skip placeholders without coordinates
      if (placeholder.x === undefined || placeholder.y === undefined) {
        continue
      }

      // Get the value for this field
      const value = data[placeholder.fieldName]
      if (!value) {
        continue
      }

      // Set font properties - use the exact font family from placeholder
      const fontSize = placeholder.fontSize || 16
      // Use the fontFamily directly from placeholder, not through getFontName which might map it
      const fontFamily = placeholder.fontFamily || "Arial"
      
      // Check if font was loaded successfully
      const fontWasLoaded = fontLoadResults.find(r => r.fontFamily === fontFamily)?.loaded || false
      
      // Use the exact font family name (should be registered by now if it was loadable)
      // If font wasn't loaded, node-canvas will fall back to system fonts
      const fontString = fontWasLoaded 
        ? `${fontSize}px "${fontFamily}", sans-serif`
        : `${fontSize}px "${fontFamily}", Arial, sans-serif`
      
      ctx.font = fontString
      ctx.fillStyle = placeholder.color || "#000000"

      // Handle text alignment
      const alignMap: Record<string, CanvasTextAlign> = {
        left: "left",
        center: "center",
        right: "right",
      }
      ctx.textAlign = alignMap[placeholder.align || "center"] || "center"
      ctx.textBaseline = "middle"

      // Calculate text position - coordinates should be center of the placeholder box
      // The placeholder.x and placeholder.y are stored as center coordinates (from our save logic)
      const x = placeholder.x || 0
      const y = placeholder.y || 0

      // Debug logging
      console.log(`[Certificate Generator] Drawing text "${value}" at (${x}, ${y})`)
      console.log(`[Certificate Generator] Font: ${fontString}, Color: ${ctx.fillStyle}, Family: ${fontFamily}, Loaded: ${fontWasLoaded}`)
      console.log(`[Certificate Generator] Text metrics - width: ${ctx.measureText(String(value)).width}`)

      // Draw the text centered at the specified coordinates
      // textBaseline: "middle" centers vertically
      // textAlign: "center" centers horizontally
      ctx.fillText(String(value), x, y)
    }

    // Convert canvas to buffer
    const certificateBuffer = canvas.toBuffer("image/png")

    // Save to public/uploads/credentials directory
    const credentialsDir = join(process.cwd(), "public", "uploads", "credentials")
    if (!existsSync(credentialsDir)) {
      mkdirSync(credentialsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = outputFilename || `certificate-${timestamp}-${randomString}.png`
    const outputPath = join(credentialsDir, filename)

    // Write the file
    writeFileSync(outputPath, certificateBuffer)

    // Return the public URL
    return `/uploads/credentials/${filename}`
  } catch (error) {
    console.error("Error generating certificate:", error)
    throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Generate a badge image (similar to certificate but for badges)
 */
export async function generateBadge(options: GenerateCertificateOptions): Promise<string> {
  // Badge generation is similar to certificate
  return generateCertificate(options)
}

