/**
 * Certificate and badge generator
 * Uses sharp and canvas to generate certificates from templates
 */

import sharp from "sharp"
import { createCanvas, loadImage } from "canvas"
import { IPlaceholder } from "@/models/Template"
import { loadFont, getActualFontName } from "./fonts"

interface GenerateCertificateOptions {
  templateImageBase64: string // Base64 data URL of the template certificate image (e.g., data:image/png;base64,...)
  placeholders: IPlaceholder[]
  data: Record<string, string> // Field name -> value mapping
}

/**
 * Generate a certificate image by overlaying text on the template image
 * Returns a base64 data URL
 */
export async function generateCertificate(options: GenerateCertificateOptions): Promise<string> {
  const { templateImageBase64, placeholders, data } = options

  try {
    // Validate that templateImageBase64 is a data URL
    if (!templateImageBase64.startsWith("data:")) {
      throw new Error("Template image must be a base64 data URL")
    }

    // Extract MIME type and base64 data from data URL
    const matches = templateImageBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches || matches.length < 3) {
      throw new Error("Invalid base64 data URL format")
    }

    const mimeType = matches[1]
    const base64Data = matches[2]

    // Check if it's a PDF (not yet supported)
    if (mimeType === "application/pdf") {
      throw new Error("PDF templates are not yet supported. Please use PNG, JPG, or JPEG images.")
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, "base64")

    // Get image dimensions using sharp
    const imageMetadata = await sharp(imageBuffer).metadata()
    const width = imageMetadata.width || 0
    const height = imageMetadata.height || 0

    if (width === 0 || height === 0) {
      throw new Error("Could not determine image dimensions")
    }

    // Convert image to PNG buffer for canvas compatibility (if needed)
    const processedBuffer = mimeType.startsWith("image/")
      ? await sharp(imageBuffer).png().toBuffer()
      : imageBuffer
    
    const image = await loadImage(processedBuffer)

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
      // Get the original font name from placeholder
      const originalFontFamily = placeholder.fontFamily || "Arial"
      
      // Get the actual font name to use (handles Arial -> Roboto mapping)
      const actualFontFamily = getActualFontName(originalFontFamily)
      
      // Check if font was loaded successfully
      const fontWasLoaded = fontLoadResults.find(r => r.fontFamily === originalFontFamily)?.loaded || false
      
      // Use the actual mapped font family name (e.g., "Roboto" instead of "Arial")
      const fontString = fontWasLoaded 
        ? `${fontSize}px "${actualFontFamily}", sans-serif`
        : `${fontSize}px "${actualFontFamily}", Roboto, sans-serif`
      
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
      console.log(`[Certificate Generator] Font: ${fontString}, Color: ${ctx.fillStyle}, Original: ${originalFontFamily}, Actual: ${actualFontFamily}, Loaded: ${fontWasLoaded}`)
      console.log(`[Certificate Generator] Text metrics - width: ${ctx.measureText(String(value)).width}`)

      // Draw the text centered at the specified coordinates
      // textBaseline: "middle" centers vertically
      // textAlign: "center" centers horizontally
      ctx.fillText(String(value), x, y)
    }

    // Convert canvas to buffer
    const certificateBuffer = canvas.toBuffer("image/png")

    // Convert buffer to base64 data URL
    const base64 = certificateBuffer.toString("base64")
    const dataUrl = `data:image/png;base64,${base64}`

    // Return the base64 data URL
    return dataUrl
  } catch (error) {
    console.error("Error generating certificate:", error)
    throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Generate a badge image (similar to certificate but for badges)
 * Returns a base64 data URL
 */
export async function generateBadge(options: GenerateCertificateOptions): Promise<string> {
  // Badge generation is similar to certificate
  return generateCertificate(options)
}

