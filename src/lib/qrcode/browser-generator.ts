/**
 * Browser-compatible QR code generator for preview
 * Uses canvas API available in browsers
 */

/**
 * Generate a simple QR code pattern using canvas (for preview only)
 * This is a simplified version that creates a basic QR-like pattern
 * @param url - The URL to encode
 * @param size - The size of the QR code
 * @returns Base64 data URL
 */
export async function generateDummyQRCodeBrowser(url: string, size: number): Promise<string> {
  // Create a canvas element
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not get canvas context")
  }

  // Fill white background
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, size, size)

  // Draw black squares in a pattern (simplified QR code pattern)
  ctx.fillStyle = "#000000"
  const cellSize = size / 25 // 25x25 grid
  
  // Draw corner markers (top-left, top-right, bottom-left)
  const drawCornerMarker = (x: number, y: number) => {
    const markerSize = cellSize * 7
    ctx.fillRect(x, y, markerSize, markerSize)
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3)
    ctx.fillStyle = "#000000"
    ctx.fillRect(x + cellSize * 3, y + cellSize * 3, cellSize, cellSize)
  }

  drawCornerMarker(0, 0)
  drawCornerMarker(size - cellSize * 7, 0)
  drawCornerMarker(0, size - cellSize * 7)

  // Draw random pattern for data (simplified)
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      // Skip corner markers
      if (
        (i < 9 && j < 9) || // top-left
        (i < 9 && j > 15) || // top-right
        (i > 15 && j < 9) // bottom-left
      ) {
        continue
      }
      
      // Random pattern based on position and URL hash
      const hash = (i * 25 + j + url.length) % 3
      if (hash === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
      }
    }
  }

  // Draw logo in center
  const logoSize = size * 0.15
  const logoX = (size - logoSize) / 2
  const logoY = (size - logoSize) / 2
  const logoBgSize = logoSize + cellSize * 2
  const logoBgX = logoX - cellSize
  const logoBgY = logoY - cellSize
  const centerX = size / 2
  const centerY = size / 2
  
  // Create radial gradient: black center to black with pink tint at edges
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0, // Start at center, radius 0
    centerX, centerY, logoBgSize / 2 // End at logo background size
  )
  gradient.addColorStop(0, "#000000") // Black center
  gradient.addColorStop(0.7, "#1a0a0f") // Dark black with slight pink tint
  gradient.addColorStop(1, "#2d0f1a") // Black with more pink tint at edges
  
  // Draw rounded square gradient background for logo
  const cornerRadius = logoBgSize * 0.15 // 15% of size for rounded corners
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(logoBgX + cornerRadius, logoBgY)
  ctx.lineTo(logoBgX + logoBgSize - cornerRadius, logoBgY)
  ctx.quadraticCurveTo(logoBgX + logoBgSize, logoBgY, logoBgX + logoBgSize, logoBgY + cornerRadius)
  ctx.lineTo(logoBgX + logoBgSize, logoBgY + logoBgSize - cornerRadius)
  ctx.quadraticCurveTo(logoBgX + logoBgSize, logoBgY + logoBgSize, logoBgX + logoBgSize - cornerRadius, logoBgY + logoBgSize)
  ctx.lineTo(logoBgX + cornerRadius, logoBgY + logoBgSize)
  ctx.quadraticCurveTo(logoBgX, logoBgY + logoBgSize, logoBgX, logoBgY + logoBgSize - cornerRadius)
  ctx.lineTo(logoBgX, logoBgY + cornerRadius)
  ctx.quadraticCurveTo(logoBgX, logoBgY, logoBgX + cornerRadius, logoBgY)
  ctx.closePath()
  ctx.fill()
  
  // Load and draw actual logo
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = "anonymous"
    
    // Load logo from public folder
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve()
      logoImg.onerror = () => {
        // Fallback to "CV" text if logo fails to load
        ctx.fillStyle = "#000000"
        ctx.font = `bold ${logoSize * 0.4}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("CV", size / 2, size / 2)
        resolve()
      }
      logoImg.src = "/logo.svg"
    })
    
    // Draw logo if it loaded successfully
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
    }
  } catch (error) {
    // Fallback to "CV" text if logo loading fails
    console.warn("Failed to load logo for QR code:", error)
    ctx.fillStyle = "#000000"
    ctx.font = `bold ${logoSize * 0.4}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("CV", size / 2, size / 2)
  }

  return canvas.toDataURL("image/png")
}

