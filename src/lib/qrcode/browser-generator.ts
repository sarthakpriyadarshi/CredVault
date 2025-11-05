/**
 * Browser-compatible QR code generator for preview using qr-code-styling
 * Uses qr-code-styling library for styled QR codes
 */

import QRCodeStyling from "qr-code-styling"
import { IQRCodeStyling } from "@/models/Template"

/**
 * Generate a styled QR code using qr-code-styling
 * @param url - The URL to encode
 * @param size - The size of the QR code
 * @param styling - Optional QR code styling options
 * @returns Base64 data URL
 */
export async function generateDummyQRCodeBrowser(
  url: string, 
  size: number,
  styling?: IQRCodeStyling
): Promise<string> {
  // Build dots options
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
  // Default to white background
  const backgroundOptions: any = {
    color: styling?.backgroundOptions?.color || "#FFFFFF", // Default to white
  }

  // Use gradient if explicitly provided
  if (styling?.backgroundOptions?.gradient) {
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
  } else if (styling?.backgroundOptions?.colorType === "single") {
    // Explicitly single color, use the provided color or default to white
    backgroundOptions.color = styling?.backgroundOptions?.color || "#FFFFFF"
  }
  // If no explicit styling, default to white (already set above)

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
  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    type: "canvas",
    data: url,
    image: "/qrcode-logo.svg", // Use qrcode-logo.svg
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
  })

  // Get canvas data URL
  return new Promise<string>((resolve, reject) => {
    try {
      // Create a temporary container
      const container = document.createElement("div")
      container.style.display = "none"
      document.body.appendChild(container)

      // Append QR code to container
      qrCode.append(container)

      // Wait a bit for rendering
      setTimeout(() => {
        const canvas = container.querySelector("canvas") as HTMLCanvasElement
        if (canvas) {
          const dataUrl = canvas.toDataURL("image/png")
          document.body.removeChild(container)
          resolve(dataUrl)
        } else {
          document.body.removeChild(container)
          reject(new Error("Failed to generate QR code canvas"))
        }
      }, 100)
    } catch (error) {
      reject(error)
    }
  })
}
