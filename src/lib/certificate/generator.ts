/**
 * Certificate and badge generator
 * Uses sharp and canvas to generate certificates from templates
 * 
 * SERVER-ONLY: This file uses Node.js modules and cannot run in the browser
 */

// Mark as server-only to prevent bundling in client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side")
}

import sharp from "sharp"
import { createCanvas, loadImage } from "canvas"
import { IPlaceholder } from "@/models/Template"
import { loadFont, getActualFontName, getWeightedFontName } from "./fonts"
import { generateQRCodeWithLogo } from "@/lib/qrcode/generator"

interface GenerateCertificateOptions {
  templateImageBase64: string // Base64 data URL of the template certificate image (e.g., data:image/png;base64,...)
  placeholders: IPlaceholder[]
  data: Record<string, string> // Field name -> value mapping
  qrCodeData?: Record<string, string> // QR code field name -> URL mapping
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

    // Collect unique font families and their required variants from placeholders
    // We need to track which fonts need bold (700) and italic variants
    const fontVariants = new Map<string, { needsBold: boolean; needsItalic: boolean }>()
    for (const placeholder of placeholders) {
      if (placeholder.fontFamily) {
        const fontFamily = placeholder.fontFamily
        const existing = fontVariants.get(fontFamily) || { needsBold: false, needsItalic: false }
        fontVariants.set(fontFamily, {
          needsBold: existing.needsBold || (placeholder.bold === true),
          needsItalic: existing.needsItalic || (placeholder.italic === true),
        })
      }
    }

    // Preload all required font variants
    const fontLoadResults = new Map<string, { loaded: boolean; weight: number; italic: boolean }>()
    for (const [fontFamily, variants] of fontVariants.entries()) {
      // Always load normal weight (400)
      try {
        const loaded = await loadFont(fontFamily, 400, false)
        fontLoadResults.set(`${fontFamily}-400`, { loaded, weight: 400, italic: false })
      } catch (error) {
        console.warn(`Failed to load font ${fontFamily} (400):`, error)
        fontLoadResults.set(`${fontFamily}-400`, { loaded: false, weight: 400, italic: false })
      }

      // Load bold variant (700) if needed
      if (variants.needsBold) {
        try {
          const loaded = await loadFont(fontFamily, 700, false)
          fontLoadResults.set(`${fontFamily}-700`, { loaded, weight: 700, italic: false })
        } catch (error) {
          console.warn(`Failed to load font ${fontFamily} (700):`, error)
          fontLoadResults.set(`${fontFamily}-700`, { loaded: false, weight: 700, italic: false })
        }
      }

      // Load italic variant (400 italic) if needed
      if (variants.needsItalic) {
        try {
          const loaded = await loadFont(fontFamily, 400, true)
          fontLoadResults.set(`${fontFamily}-400-italic`, { loaded, weight: 400, italic: true })
        } catch (error) {
          console.warn(`Failed to load font ${fontFamily} (400 italic):`, error)
          fontLoadResults.set(`${fontFamily}-400-italic`, { loaded: false, weight: 400, italic: true })
        }
      }

      // Load bold italic variant (700 italic) if both bold and italic are needed
      if (variants.needsBold && variants.needsItalic) {
        try {
          const loaded = await loadFont(fontFamily, 700, true)
          fontLoadResults.set(`${fontFamily}-700-italic`, { loaded, weight: 700, italic: true })
        } catch (error) {
          console.warn(`Failed to load font ${fontFamily} (700 italic):`, error)
          fontLoadResults.set(`${fontFamily}-700-italic`, { loaded: false, weight: 700, italic: true })
        }
      }
    }

    // Log font loading results
    console.log(`[Certificate Generator] Font loading results:`, Array.from(fontLoadResults.entries()).map(([key, value]) => `${key}: ${value.loaded ? "loaded" : "failed"}`))

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

      // Handle QR code fields differently
      if (placeholder.type === "qr") {
        // QR codes are handled separately during credential issuance
        // Skip here as QR code URL is generated at issuance time
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
      
      // Determine font weight and style
      const isBold = placeholder.bold || false
      const isItalic = placeholder.italic || false
      const fontWeight = isBold ? 700 : 400
      
      // Check if the specific font variant was loaded successfully
      const fontKey = `${originalFontFamily}-${fontWeight}${isItalic ? "-italic" : ""}`
      const fontVariant = fontLoadResults.get(fontKey)
      const fontWasLoaded = fontVariant?.loaded || false
      
      // Get the weight and style-specific font family name (e.g., "Roboto Bold Italic" for weight 700 + italic)
      const weightedFontFamily = fontWasLoaded 
        ? getWeightedFontName(actualFontFamily, fontWeight, isItalic)
        : actualFontFamily
      
      // Build font string - use the registered font family name directly (no CSS keywords needed)
      // The family name already includes the weight and style (e.g., "Roboto Bold Italic")
      const fontString = fontWasLoaded
        ? `${fontSize}px "${weightedFontFamily}", sans-serif`
        : `${fontSize}px "${actualFontFamily}", sans-serif`
      
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
      console.log(`[Certificate Generator] Font: ${fontString}, Color: ${ctx.fillStyle}, Original: ${originalFontFamily}, Actual: ${actualFontFamily}, Bold: ${isBold}, Italic: ${isItalic}, Weight: ${fontWeight}, Loaded: ${fontWasLoaded}`)
      console.log(`[Certificate Generator] Text metrics - width: ${ctx.measureText(String(value)).width}`)

      // Draw the text centered at the specified coordinates
      // textBaseline: "middle" centers vertically
      // textAlign: "center" centers horizontally
      ctx.fillText(String(value), x, y)
    }

    // Convert canvas to buffer temporarily for QR code processing
    let certificateBuffer = canvas.toBuffer("image/png")
    
    // Handle QR code placeholders - add them after text is drawn
    const qrPlaceholders = placeholders.filter((p) => p.type === "qr" && p.x !== undefined && p.y !== undefined && p.width && p.height)
    if (qrPlaceholders.length > 0 && options.qrCodeData) {
      // Reload the canvas with current image
      const currentImage = await loadImage(certificateBuffer)
      const qrCanvas = createCanvas(width, height)
      const qrCtx = qrCanvas.getContext("2d")
      qrCtx.drawImage(currentImage, 0, 0, width, height)
      
      for (const qrPlaceholder of qrPlaceholders) {
        const qrUrl = options.qrCodeData[qrPlaceholder.fieldName]
        if (qrUrl && qrPlaceholder.width && qrPlaceholder.height) {
          // Generate QR code with logo and styling (uses default logo from public/qrcode-logo.svg)
          const qrSize = Math.max(qrPlaceholder.width, qrPlaceholder.height)
          const qrCodeDataUrl = await generateQRCodeWithLogo(
            qrUrl, 
            qrSize,
            qrPlaceholder.qrCodeStyling // Pass styling options from template
          )
          
          // Load QR code image
          const qrImage = await loadImage(qrCodeDataUrl)
          
          // Draw QR code at specified position (top-left corner)
          qrCtx.drawImage(qrImage, qrPlaceholder.x!, qrPlaceholder.y!, qrSize, qrSize)
        }
      }
      
      certificateBuffer = qrCanvas.toBuffer("image/png")
    }

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
  // Badge generation is similar to certificate (supports QR codes too)
  return generateCertificate(options)
}

