/**
 * QR Code generator with logo support
 * Uses qrcode library to generate QR codes with custom logo in center
 * 
 * SERVER-ONLY: This file uses Node.js modules and cannot run in the browser
 */

// Mark as server-only to prevent bundling in client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side")
}

import QRCode from "qrcode"
import { createCanvas, loadImage } from "canvas"
import sharp from "sharp"
import path from "path"
import fs from "fs"

/**
 * Generate a QR code image with logo in the center
 * @param url - The URL to encode in the QR code
 * @param size - The size of the QR code (width and height, in pixels)
 * @param logoPath - Optional path to logo file (defaults to public/logo.svg)
 * @returns Base64 data URL of the QR code image
 */
export async function generateQRCodeWithLogo(
  url: string,
  size: number,
  logoPath?: string
): Promise<string> {
  try {
    // Generate QR code without logo first
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    // Extract base64 data from data URL
    const matches = qrCodeDataURL.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches || matches.length < 3) {
      throw new Error("Invalid QR code data URL format")
    }

    const base64Data = matches[2]
    const qrCodeBuffer = Buffer.from(base64Data, "base64")

    // Load QR code image
    const qrCodeImage = await loadImage(qrCodeBuffer)

    // Create canvas
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext("2d")

    // Draw QR code
    ctx.drawImage(qrCodeImage, 0, 0, size, size)

    // Load and draw logo in center if provided
    const defaultLogoPath = path.join(process.cwd(), "public", "logo.svg")
    const finalLogoPath = logoPath || defaultLogoPath
    
    if (finalLogoPath) {
      try {
        const logoPathResolved = path.resolve(finalLogoPath)
        if (fs.existsSync(logoPathResolved)) {
          // Check if it's SVG or image
          const isSVG = logoPathResolved.endsWith(".svg")
          
          let logoBuffer: Buffer
          if (isSVG) {
            // Convert SVG to PNG using sharp
            logoBuffer = await sharp(logoPathResolved)
              .resize(Math.floor(size * 0.2), Math.floor(size * 0.2), {
                fit: "inside",
                withoutEnlargement: true,
              })
              .png()
              .toBuffer()
          } else {
            // Load and resize image
            logoBuffer = await sharp(logoPathResolved)
              .resize(Math.floor(size * 0.2), Math.floor(size * 0.2), {
                fit: "inside",
                withoutEnlargement: true,
              })
              .png()
              .toBuffer()
          }

          const logoImage = await loadImage(logoBuffer)
          const logoSize = Math.floor(size * 0.2)
          const logoX = (size - logoSize) / 2
          const logoY = (size - logoSize) / 2

          // Draw white background for logo
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(
            logoX - 4,
            logoY - 4,
            logoSize + 8,
            logoSize + 8
          )

          // Draw logo
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
        }
      } catch (logoError) {
        console.warn("Failed to load logo for QR code:", logoError)
        // Continue without logo if it fails
      }
    }

    // Convert canvas to base64
    const buffer = canvas.toBuffer("image/png")
    const base64 = buffer.toString("base64")
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

/**
 * Generate a dummy QR code for preview (uses credvault.app)
 * @param size - The size of the QR code
 * @returns Base64 data URL
 */
export async function generateDummyQRCode(size: number): Promise<string> {
  return generateQRCodeWithLogo("https://credvault.app", size)
}

