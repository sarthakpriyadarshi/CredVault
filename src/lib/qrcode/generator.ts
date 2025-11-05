/**
 * QR Code generator with logo support
 * Custom implementation that replicates qr-code-styling behavior without jsdom
 * Uses qrcode library for matrix generation and canvas for styled rendering
 * 
 * SERVER-ONLY: This file uses Node.js modules and cannot run in the browser
 */

// Mark as server-only to prevent bundling in client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side")
}

import QRCode from "qrcode"
import { createCanvas, loadImage, CanvasRenderingContext2D } from "canvas"
import path from "path"
import fs from "fs"
import { IQRCodeStyling } from "@/models/Template"

/**
 * Generate a QR code image with logo and styling
 * @param url - The URL to encode in the QR code
 * @param size - The size of the QR code (width and height, in pixels)
 * @param styling - Optional QR code styling options
 * @param logoPath - Optional path to logo file (defaults to public/qrcode-logo.svg)
 * @returns Base64 data URL of the QR code image
 */
/**
 * Draw a rounded rectangle manually
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (radius <= 0) {
    ctx.rect(x, y, width, height)
    return
  }

  const clampedRadius = Math.min(radius, width / 2, height / 2)
  ctx.moveTo(x + clampedRadius, y)
  ctx.lineTo(x + width - clampedRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + clampedRadius)
  ctx.lineTo(x + width, y + height - clampedRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height)
  ctx.lineTo(x + clampedRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - clampedRadius)
  ctx.lineTo(x, y + clampedRadius)
  ctx.quadraticCurveTo(x, y, x + clampedRadius, y)
}

/**
 * Draw a styled dot on the canvas
 */
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number,
  type: "square" | "rounded" | "dots" | "classy" | "classy-rounded" | "extra-rounded",
  color: string | CanvasGradient
) {
  const halfSize = moduleSize / 2
  const radius = {
    square: moduleSize * 0.25,
    rounded: moduleSize * 0.45,
    dots: moduleSize * 0.5,
    classy: moduleSize * 0.25,
    "classy-rounded": moduleSize * 0.45,
    "extra-rounded": moduleSize * 0.5,
  }[type] || moduleSize * 0.45

  ctx.fillStyle = color
  ctx.beginPath()

  if (type === "dots") {
    ctx.arc(x, y, radius, 0, Math.PI * 2)
  } else {
    // square, rounded, classy, classy-rounded, extra-rounded
    drawRoundedRect(ctx, x - halfSize, y - halfSize, moduleSize, moduleSize, radius)
  }
  ctx.fill()
}


/**
 * Create gradient from options
 */
function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradient: {
    type: "linear" | "radial"
    rotation?: number
    colorStops: Array<{ offset: number; color: string }>
  }
): CanvasGradient {
  let grad: CanvasGradient

  if (gradient.type === "linear") {
    const rotation = (gradient.rotation || 0) * (Math.PI / 180)
    const cx = width / 2
    const cy = height / 2
    const length = Math.sqrt(width * width + height * height)
    grad = ctx.createLinearGradient(
      cx - (length / 2) * Math.cos(rotation),
      cy - (length / 2) * Math.sin(rotation),
      cx + (length / 2) * Math.cos(rotation),
      cy + (length / 2) * Math.sin(rotation)
    )
  } else {
    // radial
    grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
  }

  for (const stop of gradient.colorStops) {
    grad.addColorStop(stop.offset, stop.color)
  }

  return grad
}

export async function generateQRCodeWithLogo(
  url: string,
  size: number,
  styling?: IQRCodeStyling,
  logoPath?: string
): Promise<string> {
  try {
    console.log("[QR Generator] Starting custom QR code generation:", {
      url,
      size,
      hasStyling: !!styling,
    })

    // Generate QR code matrix using qrcode library
    const errorCorrectionLevel = styling?.qrOptions?.errorCorrectionLevel || "H"
    const qrMatrix = await QRCode.create(url, {
      errorCorrectionLevel: errorCorrectionLevel as "L" | "M" | "Q" | "H",
    })

    const modules = qrMatrix.modules
    const moduleCount = modules.size
    const moduleSize = size / moduleCount

    // Create canvas
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext("2d")

    // Draw background
    const bgColor = styling?.backgroundOptions?.color || "#FFFFFF"
    if (styling?.backgroundOptions?.gradient) {
      const bgGradient = createGradient(ctx, size, size, styling.backgroundOptions.gradient)
      ctx.fillStyle = bgGradient
    } else {
      ctx.fillStyle = bgColor
    }
    ctx.fillRect(0, 0, size, size)

    // Prepare dots color/gradient
    const dotsColor = styling?.dotsColor || "#000000"
    let dotsFill: string | CanvasGradient = dotsColor
    if (styling?.dotsColorType === "gradient" && styling?.gradient) {
      dotsFill = createGradient(ctx, size, size, styling.gradient)
    }

    // Prepare corner colors
    const cornersSquareColor = styling?.cornersSquareOptions?.color || styling?.dotsColor || "#000000"
    const cornersDotColor = styling?.cornersDotOptions?.color || styling?.dotsColor || "#000000"

    const dotsType = styling?.dotsType || "rounded"
    const cornersSquareType = styling?.cornersSquareOptions?.type || "extra-rounded"
    const cornersDotType = styling?.cornersDotOptions?.type || "dot"

    // Draw QR code modules
    const finderPatternSize = 7 // Standard QR code finder pattern size

    // Helper to check if a module is part of a finder pattern
    const isInFinderPattern = (row: number, col: number): boolean => {
      return (
        (row < finderPatternSize && col < finderPatternSize) ||
        (row < finderPatternSize && col >= moduleCount - finderPatternSize) ||
        (row >= moduleCount - finderPatternSize && col < finderPatternSize)
      )
    }

    // Helper to draw a rounded rectangle frame (hollow, with border)
    const drawRoundedRectFrame = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      borderWidth: number
    ) => {
      // Draw outer rounded rect
      ctx.beginPath()
      drawRoundedRect(ctx, x, y, width, height, radius)
      ctx.fill()
      
      // Cut out inner area to create frame
      const innerX = x + borderWidth
      const innerY = y + borderWidth
      const innerWidth = width - 2 * borderWidth
      const innerHeight = height - 2 * borderWidth
      const innerRadius = Math.max(0, radius - borderWidth)
      
      ctx.globalCompositeOperation = "destination-out"
      ctx.beginPath()
      drawRoundedRect(ctx, innerX, innerY, innerWidth, innerHeight, innerRadius)
      ctx.fill()
      ctx.globalCompositeOperation = "source-over"
    }

    // Helper to draw finder pattern with rounded corner squares as unified shapes
    // Outer square leaves space for inner square, inner square leaves space for center dot
    const drawFinderPattern = (startRow: number, startCol: number) => {
      const x = startCol * moduleSize
      const y = startRow * moduleSize
      const patternSize = finderPatternSize * moduleSize

      // Calculate radii based on corner square type
      const outerRadius = cornersSquareType === "extra-rounded" ? patternSize * 0.6 : 
                            cornersSquareType === "square" ? patternSize * 0.05 : 
                            patternSize * 0.3

      const innerX = (startCol + 2) * moduleSize
      const innerY = (startRow + 2) * moduleSize
      const innerSize = 3 * moduleSize
      const innerRadius = cornersSquareType === "extra-rounded" ? innerSize * 0.6 : 
                         cornersSquareType === "square" ? innerSize * 0.05 : 
                         innerSize * 0.3

      // Draw outer square as a frame (border only, leaving space for inner square)
      // The border is 1 module wide on each side
      ctx.fillStyle = cornersSquareColor as string | CanvasGradient
      drawRoundedRectFrame(ctx, x, y, patternSize, patternSize, outerRadius, moduleSize)

      // Draw inner square (3x3 modules) as a frame, leaving space for center dot
      // The border is approximately 1 module wide
      drawRoundedRectFrame(ctx, innerX, innerY, innerSize, innerSize, innerRadius, moduleSize * 0.8)

      // Draw center dot (1x1 module)
      const centerX = (startCol + 3) * moduleSize + moduleSize / 2
      const centerY = (startRow + 3) * moduleSize + moduleSize / 2
      const dotRadius = cornersDotType === "dot" ? moduleSize * 0.5 : moduleSize * 0.3
      
      ctx.fillStyle = cornersDotColor as string | CanvasGradient
      ctx.beginPath()
      if (cornersDotType === "dot") {
        ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2)
      } else {
        drawRoundedRect(ctx, centerX - moduleSize / 2, centerY - moduleSize / 2, moduleSize, moduleSize, dotRadius)
      }
      ctx.fill()
    }

    // Draw all modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules.get(row, col)) {
          const x = col * moduleSize + moduleSize / 2
          const y = row * moduleSize + moduleSize / 2

          if (isInFinderPattern(row, col)) {
            // Skip finder patterns - will draw them separately
            continue
          } else {
            // Regular data module
            drawDot(ctx, x, y, moduleSize, dotsType, dotsFill)
          }
        }
      }
    }

    // Draw three finder patterns at the corners with rounded corner squares
    drawFinderPattern(0, 0)
    drawFinderPattern(0, moduleCount - finderPatternSize)
    drawFinderPattern(moduleCount - finderPatternSize, 0)

    // Draw logo in center if provided
    const defaultLogoPath = path.join(process.cwd(), "public", "qrcode-logo.svg")
    const finalLogoPath = logoPath || defaultLogoPath

    if (fs.existsSync(finalLogoPath)) {
      try {
        const logoImage = await loadImage(finalLogoPath)
        const logoSize = size * 0.3 // 30% of QR code size
        const logoX = (size - logoSize) / 2
        const logoY = (size - logoSize) / 2

        // Draw logo background (transparent/white circle)
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, logoSize / 2 + 5, 0, Math.PI * 2)
        ctx.fill()

        // Draw logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
      } catch (logoError) {
        console.warn("[QR Generator] Failed to load logo:", logoError)
      }
    }

    console.log("[QR Generator] QR code generation completed successfully")

    // Convert to base64 data URL
    const buffer = canvas.toBuffer("image/png")
    const base64 = buffer.toString("base64")
    return `data:image/png;base64,${base64}`
  } catch (error: unknown) {
    console.error("[QR Generator] Error generating QR code:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

/**
 * Generate a dummy QR code for preview (uses credvault.app)
 * @param size - The size of the QR code
 * @param styling - Optional QR code styling options
 * @returns Base64 data URL
 */
export async function generateDummyQRCode(size: number, styling?: IQRCodeStyling): Promise<string> {
  return generateQRCodeWithLogo("https://credvault.app", size, styling)
}
