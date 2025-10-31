/**
 * Font loader utility for certificate generation
 * Downloads and registers Google Fonts for use with node-canvas
 */

import { registerFont } from "canvas"
import { join } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { GOOGLE_FONTS, normalizeFontName } from "./google-fonts"

// Cache for registered fonts
const registeredFonts = new Set<string>()

/**
 * Font file cache directory
 */
const FONT_CACHE_DIR = join(process.cwd(), "public", "fonts", "cache")

/**
 * Ensure font cache directory exists
 */
function ensureFontCacheDir() {
  if (!existsSync(FONT_CACHE_DIR)) {
    mkdirSync(FONT_CACHE_DIR, { recursive: true })
  }
}

/**
 * Download a font file from Google Fonts
 * Uses Google Fonts CSS API to get font URLs and downloads TTF files
 */
async function downloadFontFile(fontFamily: string, weight: number = 400): Promise<string | null> {
  try {
    ensureFontCacheDir()

    const normalizedName = normalizeFontName(fontFamily)
    const cachePath = join(FONT_CACHE_DIR, `${normalizedName}-${weight}.ttf`)

    // Check if font is already cached
    if (existsSync(cachePath)) {
      return cachePath
    }

    // Fetch font CSS from Google Fonts
    const fontName = fontFamily.replace(/\s+/g, "+")
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}&display=swap`
    
    // Use fetch API (available in Node.js 18+)
    const response = await fetch(cssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch font CSS: ${response.statusText}`)
    }

    const css = await response.text()
    
    // Extract all font file URLs from CSS
    // Format: url(https://fonts.gstatic.com/...)
    const urlMatches = Array.from(css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g))
    
    if (!urlMatches || urlMatches.length === 0) {
      console.warn(`No font file URL found in CSS for ${fontFamily}`)
      return null
    }

    // Find TTF format URL (node-canvas requires TTF)
    let fontUrl: string | null = null
    
    for (const match of urlMatches) {
      const url = match[1]
      // Prefer TTF format, but also check for woff2 which we might convert
      if (url.includes(".ttf")) {
        fontUrl = url
        break
      } else if (url.includes(".woff2") && !fontUrl) {
        // Fallback to woff2 if no TTF found
        // Note: We'll need to handle this differently as node-canvas requires TTF
        fontUrl = url.replace(".woff2", ".ttf") // Try to construct TTF URL
      }
    }

    // If still no TTF URL, try to construct it from woff2 URL pattern
    if (!fontUrl || !fontUrl.includes(".ttf")) {
      // Google Fonts TTF files usually follow a pattern
      // Try to convert woff2 URL to TTF URL
      const woff2Match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)
      if (woff2Match) {
        // Replace .woff2 with .ttf in the URL
        fontUrl = woff2Match[1].replace(".woff2", ".ttf")
      }
    }

    if (!fontUrl) {
      console.warn(`Could not determine TTF URL for ${fontFamily}`)
      return null
    }

    // Download the font file
    const fontResponse = await fetch(fontUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    
    if (!fontResponse.ok) {
      // If TTF fails, try alternative methods
      console.warn(`Failed to download TTF from ${fontUrl}, trying alternative...`)
      return null
    }

    const fontBuffer = Buffer.from(await fontResponse.arrayBuffer())
    
    // Verify it's a valid font file (basic check - TTF files start with specific bytes)
    if (fontBuffer.length > 4) {
      // TTF files start with certain magic bytes
      const magicBytes = fontBuffer.slice(0, 4)
      if (magicBytes.toString("ascii") !== "OTTO" && magicBytes[0] !== 0 && magicBytes[1] !== 1) {
        console.warn(`Downloaded file for ${fontFamily} may not be a valid TTF font`)
        // Still try to use it - node-canvas will fail gracefully if invalid
      }
    }
    
    // Save to cache
    writeFileSync(cachePath, fontBuffer)

    return cachePath
  } catch (error) {
    console.error(`Error downloading font ${fontFamily}:`, error)
    return null
  }
}

/**
 * Register a font for use with node-canvas
 * Tries to load from cache first, then downloads if needed
 */
export async function loadFont(fontFamily: string, weight: number = 400): Promise<boolean> {
  // Check if already registered
  if (registeredFonts.has(`${fontFamily}-${weight}`)) {
    return true
  }

  try {
    ensureFontCacheDir()

    const normalizedName = normalizeFontName(fontFamily)
    const cachePath = join(FONT_CACHE_DIR, `${normalizedName}-${weight}.ttf`)

    // Try to load from cache first
    if (existsSync(cachePath)) {
      registerFont(cachePath, { family: fontFamily })
      registeredFonts.add(`${fontFamily}-${weight}`)
      return true
    }

    // Try to download if not cached
    const downloadedPath = await downloadFontFile(fontFamily, weight)
    if (downloadedPath && existsSync(downloadedPath)) {
      registerFont(downloadedPath, { family: fontFamily })
      registeredFonts.add(`${fontFamily}-${weight}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`Error loading font ${fontFamily}:`, error)
    return false
  }
}

/**
 * Preload commonly used fonts
 */
export async function preloadCommonFonts(): Promise<void> {
  const commonFonts = ["Roboto", "Open Sans", "Poppins", "Inter", "Montserrat"]
  await Promise.all(commonFonts.map((font) => loadFont(font, 400)))
}

/**
 * Get font name with fallback mapping
 * Maps Google Font names to system fonts or registered fonts
 */
export function getFontName(fontFamily: string): string {
  // If font is already registered, use it directly
  if (registeredFonts.has(`${fontFamily}-400`)) {
    return fontFamily
  }

  // System font mappings (fallback)
  const systemFontMap: Record<string, string> = {
    Arial: "Arial",
    Helvetica: "Helvetica",
    "Times New Roman": "Times New Roman",
    "Courier New": "Courier New",
  }

  // Return mapped font or original font name
  // node-canvas will try to use the font name, and if not available, fall back
  return systemFontMap[fontFamily] || fontFamily
}

