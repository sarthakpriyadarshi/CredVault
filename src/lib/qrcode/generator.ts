/**
 * QR Code generator with logo support using qr-code-styling
 * Uses qr-code-styling to generate styled QR codes with custom logo in center
 * 
 * SERVER-ONLY: This file uses Node.js modules and cannot run in the browser
 */

// Mark as server-only to prevent bundling in client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side")
}

import QRCodeStyling from "qr-code-styling"
import sharp from "sharp"
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
export async function generateQRCodeWithLogo(
  url: string,
  size: number,
  styling?: IQRCodeStyling,
  logoPath?: string
): Promise<string> {
  try {
    // Use qrcode-logo.svg as the default logo
    const defaultLogoPath = path.join(process.cwd(), "public", "qrcode-logo.svg")
    const finalLogoPath = logoPath || defaultLogoPath
    
    // Prepare logo - for SVG generation with jsdom, we need to read the file and convert to data URL
    let logoImagePath: string | undefined
    if (fs.existsSync(finalLogoPath)) {
      // Read the SVG file and convert to data URL for jsdom compatibility
      const logoContent = fs.readFileSync(finalLogoPath, "utf-8")
      // Convert SVG to data URL
      const base64Logo = Buffer.from(logoContent).toString("base64")
      logoImagePath = `data:image/svg+xml;base64,${base64Logo}`
    }

    // Build dots options - use the styling from template
    const dotsOptions: any = {
      color: styling?.dotsColor || "#000000",
      type: styling?.dotsType || "rounded",
    }

    // Handle gradient for dots
    if (styling?.dotsColorType === "gradient" && styling?.gradient) {
      const gradient = styling.gradient
      if (gradient.type === "linear") {
        dotsOptions.gradient = {
          type: "linear",
          rotation: gradient.rotation || 0,
          colorStops: gradient.colorStops,
        }
      } else {
        dotsOptions.gradient = {
          type: "radial",
          colorStops: gradient.colorStops,
        }
      }
    }

    // Build background options
    // Use the styling from template if provided, otherwise default to white
    const backgroundOptions: any = {
      color: "#FFFFFF", // Default to white
    }

    // Check if styling has background options
    if (styling?.backgroundOptions) {
      // Use gradient if explicitly provided
      if (styling.backgroundOptions.gradient) {
        const bgGradient = styling.backgroundOptions.gradient
        if (bgGradient.type === "linear") {
          backgroundOptions.gradient = {
            type: "linear",
            rotation: bgGradient.rotation || 0,
            colorStops: bgGradient.colorStops,
          }
        } else {
          backgroundOptions.gradient = {
            type: "radial",
            colorStops: bgGradient.colorStops,
          }
        }
        // Also set the base color for gradient
        if (styling.backgroundOptions.color) {
          backgroundOptions.color = styling.backgroundOptions.color
        }
      } else if (styling.backgroundOptions.color) {
        // Use the color if provided (regardless of colorType)
        backgroundOptions.color = styling.backgroundOptions.color
      }
    }

    // Build corners options - use dotsColor if corners color not explicitly set
    const cornersSquareOptions = {
      type: styling?.cornersSquareOptions?.type || "extra-rounded",
      color: styling?.cornersSquareOptions?.color || styling?.dotsColor || "#000000",
    }

    const cornersDotOptions = {
      type: styling?.cornersDotOptions?.type || "dot",
      color: styling?.cornersDotOptions?.color || styling?.dotsColor || "#000000",
    }

    // Build QR options
    const qrOptions = {
      errorCorrectionLevel: styling?.qrOptions?.errorCorrectionLevel || "H",
    }

    // Create QR code styling instance
    // qr-code-styling requires jsdom to work in Node.js environment
    // Dynamically import jsdom to avoid ESM compatibility issues at build time
    // This is necessary because jsdom v27 uses parse5 v8 which is ESM-only
    let JSDOMClass: any
    try {
      // Use dynamic import to load jsdom at runtime
      // This avoids bundling issues and ESM/CommonJS conflicts
      const jsdomModule = await import("jsdom")
      JSDOMClass = jsdomModule.JSDOM
      
      // Verify JSDOM is available and is a constructor
      if (!JSDOMClass || typeof JSDOMClass !== "function") {
        throw new Error("JSDOM is not available or not a constructor")
      }
    } catch (jsdomError) {
      // If jsdom fails to load, fall back to basic QR code
      console.error("Failed to load jsdom, using fallback:", jsdomError)
      throw new Error("jsdom is required for QR code generation")
    }
    
    // Use SVG type and convert to PNG with sharp for better Node.js compatibility
    // Pass jsdom class (not instance) - qr-code-styling will instantiate it
    const qrCodeOptions: any = {
      width: size,
      height: size,
      type: "svg", // Use SVG type - more reliable with jsdom
      data: url,
      image: logoImagePath,
      dotsOptions,
      backgroundOptions,
      cornersSquareOptions,
      cornersDotOptions,
      qrOptions,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 0, // No margin for logo
        imageSize: 0.3, // Logo takes 30% of QR code size
      },
      jsdom: JSDOMClass, // Pass the JSDOM class - qr-code-styling will use: new JSDOM("", { resources: "usable" })
    }
    
    const qrCode = new QRCodeStyling(qrCodeOptions)

    // Get SVG string from qr-code-styling
    const svgString = await qrCode.getRawData("svg")
    
    if (!svgString) {
      throw new Error("Failed to generate QR code SVG")
    }

    // Convert SVG string to PNG buffer using sharp
    const svgBuffer = Buffer.from(typeof svgString === "string" ? svgString : svgString.toString())
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer()

    // Convert to base64 data URL
    const base64 = pngBuffer.toString("base64")
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error("Error generating QR code:", error)
    // Fallback to simple QR code if styling fails
    try {
      const QRCode = await import("qrcode")
      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: styling?.dotsColor || "#000000",
          light: styling?.backgroundOptions?.color || "#FFFFFF",
        },
      })
      return qrCodeDataURL
    } catch (fallbackError) {
      console.error("Fallback QR code generation also failed:", fallbackError)
      throw error
    }
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
