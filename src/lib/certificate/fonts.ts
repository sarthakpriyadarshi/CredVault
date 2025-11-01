/**
 * Font loader for certificate generation (server-side)
 * Downloads and registers Google Fonts for use with node-canvas
 * 
 * Vercel-compatible: Uses in-memory caching for serverless functions
 * Fonts are fetched on-demand and cached in memory for the function execution
 */

import { registerFont } from "canvas"
import { join } from "path"
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { normalizeFontName } from "../fonts/google-fonts"

// Cache for registered fonts (in-memory for serverless compatibility)
const registeredFonts = new Set<string>()

// In-memory font buffer cache for serverless functions
const fontBufferCache = new Map<string, Buffer>()

/**
 * Font file cache directory (fallback for persistent storage)
 * On Vercel, this won't persist, but we'll try to use it if available
 */
const FONT_CACHE_DIR = join(process.cwd(), "public", "fonts", "cache")

/**
 * Ensure font cache directory exists (only if filesystem is writable)
 */
function ensureFontCacheDir() {
  try {
    if (!existsSync(FONT_CACHE_DIR)) {
      mkdirSync(FONT_CACHE_DIR, { recursive: true })
    }
  } catch {
    // On Vercel or read-only filesystem, this will fail - that's okay
    // We'll use in-memory caching instead
    console.warn("Font cache directory not writable, using in-memory cache only")
  }
}

/**
 * Download a font file from Google Fonts
 * Uses Google Fonts CSS API to get font URLs and downloads TTF files
 * Caches in memory for serverless compatibility
 */
async function downloadFontFile(fontFamily: string, weight: number = 400): Promise<Buffer | null> {
  try {
    const normalizedName = normalizeFontName(fontFamily)
    const cacheKey = `${normalizedName}-${weight}`
    
    // Check in-memory cache first (serverless-friendly)
    if (fontBufferCache.has(cacheKey)) {
      return fontBufferCache.get(cacheKey) || null
    }

    // Try to load from filesystem cache if available
    try {
      ensureFontCacheDir()
      const cachePath = join(FONT_CACHE_DIR, `${cacheKey}.ttf`)
      if (existsSync(cachePath)) {
        const buffer = readFileSync(cachePath)
        fontBufferCache.set(cacheKey, buffer) // Cache in memory too
        return buffer
      }
    } catch {
      // Filesystem not available, continue to download
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
    
    // Cache in memory (works in serverless)
    fontBufferCache.set(cacheKey, fontBuffer)
    
    // Try to save to filesystem cache if available (for local development)
    try {
      ensureFontCacheDir()
      const cachePath = join(FONT_CACHE_DIR, `${cacheKey}.ttf`)
      writeFileSync(cachePath, fontBuffer)
    } catch {
      // Filesystem not writable (e.g., on Vercel), that's okay - we have in-memory cache
    }

    return fontBuffer
  } catch (error) {
    console.error(`Error downloading font ${fontFamily}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Register a font for use with node-canvas
 * Uses in-memory caching for serverless compatibility
 * Tries to load from cache first, then downloads if needed
 */
export async function loadFont(fontFamily: string, weight: number = 400): Promise<boolean> {
  // Check if already registered
  const registerKey = `${fontFamily}-${weight}`
  if (registeredFonts.has(registerKey)) {
    return true
  }

  try {
    const normalizedName = normalizeFontName(fontFamily)
    const cacheKey = `${normalizedName}-${weight}`
    
    // Try to get font buffer (from cache or download)
    let fontBuffer: Buffer | null = null
    
    // Check in-memory cache
    if (fontBufferCache.has(cacheKey)) {
      fontBuffer = fontBufferCache.get(cacheKey) || null
    } else {
      // Try filesystem cache
      try {
        const cachePath = join(FONT_CACHE_DIR, `${cacheKey}.ttf`)
        if (existsSync(cachePath)) {
          fontBuffer = readFileSync(cachePath)
          fontBufferCache.set(cacheKey, fontBuffer) // Cache in memory
        }
      } catch {
        // Filesystem not available
      }
      
      // Download if not cached
      if (!fontBuffer) {
        fontBuffer = await downloadFontFile(fontFamily, weight)
      }
    }

    if (!fontBuffer) {
      return false
    }

    // Register font using a temporary file path or in-memory buffer
    // node-canvas registerFont requires a file path, so we need to write to temp
    // For Vercel, we can use /tmp which is writable in serverless functions
    const tempDir = process.env.TMPDIR || process.env.TMP || "/tmp"
    const tempPath = join(tempDir, `${cacheKey}.ttf`)
    
    try {
      writeFileSync(tempPath, fontBuffer)
      registerFont(tempPath, { family: fontFamily })
      registeredFonts.add(registerKey)
      return true
    } catch {
      // If temp directory not writable, try current directory fallback
      try {
        const fallbackPath = join(process.cwd(), `${cacheKey}.ttf`)
        writeFileSync(fallbackPath, fontBuffer)
        registerFont(fallbackPath, { family: fontFamily })
        registeredFonts.add(registerKey)
        return true
      } catch {
        console.error(`Could not register font ${fontFamily}`)
        return false
      }
    }
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

