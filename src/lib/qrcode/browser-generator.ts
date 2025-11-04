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

  // Draw logo placeholder in center
  const logoSize = size * 0.15
  const logoX = (size - logoSize) / 2
  const logoY = (size - logoSize) / 2
  
  // White background for logo
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(logoX - cellSize, logoY - cellSize, logoSize + cellSize * 2, logoSize + cellSize * 2)
  
  // Draw "CV" text as placeholder
  ctx.fillStyle = "#000000"
  ctx.font = `bold ${logoSize * 0.4}px Arial`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("CV", size / 2, size / 2)

  return canvas.toDataURL("image/png")
}

