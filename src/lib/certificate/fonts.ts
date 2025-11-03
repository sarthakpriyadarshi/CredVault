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

// Map to track system font to Google Font mappings
const fontMappings = new Map<string, string>()

// Map common system fonts to Google Fonts alternatives
// These Google Fonts are visually similar to system fonts
const systemFontMapping: Record<string, string> = {
  "Arial": "Roboto",
  "Arial Black": "Roboto",
  "Helvetica": "Roboto",
  "Helvetica Neue": "Roboto",
  "Times New Roman": "Merriweather",
  "Times": "Merriweather",
  "Courier New": "Courier Prime",
  "Courier": "Courier Prime",
  "Verdana": "Open Sans",
  "Georgia": "Crimson Text",
  "Palatino": "Crimson Text",
  "Garamond": "EB Garamond",
  "Bookman": "Merriweather",
  "Comic Sans MS": "Comic Neue",
  "Trebuchet MS": "Ubuntu",
  "Impact": "Anton",
  "Tahoma": "Noto Sans",
  "Century Gothic": "Montserrat",
}

/**
 * Get the actual font name to use (handles system font mapping)
 */
export function getActualFontName(fontFamily: string): string {
  // Check if this font has been mapped
  if (fontMappings.has(fontFamily)) {
    return fontMappings.get(fontFamily) || fontFamily
  }
  
  // Check if it's a system font that needs mapping
  const mappedFont = Object.keys(systemFontMapping).find(
    sf => sf.toLowerCase() === fontFamily.toLowerCase()
  )
  
  if (mappedFont) {
    return systemFontMapping[mappedFont]
  }
  
  return fontFamily
}

/**
 * Font file cache directory (fallback for persistent storage)
 * On Vercel/serverless, this won't persist and won't be writable
 * Only used for local development
 */
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
const FONT_CACHE_DIR = isServerless ? "/tmp/fonts" : join(process.cwd(), "public", "fonts", "cache")

/**
 * Ensure font cache directory exists (only if filesystem is writable)
 */
function ensureFontCacheDir() {
  // Skip on serverless - use in-memory cache only
  if (isServerless) {
    try {
      if (!existsSync(FONT_CACHE_DIR)) {
        mkdirSync(FONT_CACHE_DIR, { recursive: true })
      }
    } catch {
      // /tmp might not allow directory creation, that's okay
    }
    return
  }
  
  try {
    if (!existsSync(FONT_CACHE_DIR)) {
      mkdirSync(FONT_CACHE_DIR, { recursive: true })
    }
  } catch {
    // Filesystem not writable, use in-memory cache only
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
    
    // Save to filesystem cache only in local development (not on serverless)
    if (!isServerless) {
      try {
        ensureFontCacheDir()
        const cachePath = join(FONT_CACHE_DIR, `${cacheKey}.ttf`)
        writeFileSync(cachePath, fontBuffer)
        console.log(`Cached font to filesystem: ${cachePath}`)
      } catch (error) {
        // Filesystem not writable, that's okay - we have in-memory cache
        console.warn(`Could not write font to filesystem cache: ${error instanceof Error ? error.message : String(error)}`)
      }
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
 * For system fonts (like Arial), maps to Google Fonts alternatives
 */
export async function loadFont(fontFamily: string, weight: number = 400): Promise<boolean> {
  // Check if already registered
  const registerKey = `${fontFamily}-${weight}`
  if (registeredFonts.has(registerKey)) {
    return true
  }
  
  // Check if it's a system font that needs mapping (case-insensitive)
  const mappedFont = Object.keys(systemFontMapping).find(
    sf => sf.toLowerCase() === fontFamily.toLowerCase()
  )
  
  if (mappedFont) {
    const googleFontAlternative = systemFontMapping[mappedFont]
    console.log(`Mapping system font "${fontFamily}" to Google Font "${googleFontAlternative}"`)
    
    // Download and register the Google Font alternative
    const success = await loadFontFromGoogle(googleFontAlternative, weight)
    
    if (success) {
      // Track the mapping so we know which font to actually use
      fontMappings.set(fontFamily, googleFontAlternative)
      // Register the original font name as loaded
      registeredFonts.add(registerKey)
      console.log(`Successfully mapped ${fontFamily} to ${googleFontAlternative}`)
      return true
    } else {
      console.warn(`Failed to load Google Font alternative for ${fontFamily}`)
      return false
    }
  }

  // For non-system fonts, download from Google Fonts
  return await loadFontFromGoogle(fontFamily, weight)
}

/**
 * Load a font from Google Fonts (internal helper)
 */
async function loadFontFromGoogle(fontFamily: string, weight: number = 400): Promise<boolean> {
  const registerKey = `${fontFamily}-${weight}`
  
  // Check if already registered
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

    // Register font using temp file path
    // For serverless environments (Vercel), use /tmp which is writable
    // For local development, use TMPDIR or system temp directory
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    const tempDir = isServerless ? "/tmp" : (process.env.TMPDIR || process.env.TMP || "/tmp")
    const tempPath = join(tempDir, `font-${cacheKey}-${Date.now()}.ttf`)
    
    try {
      writeFileSync(tempPath, fontBuffer)
      registerFont(tempPath, { family: fontFamily })
      registeredFonts.add(registerKey)
      console.log(`Successfully registered font ${fontFamily} from ${tempPath}`)
      return true
    } catch (error) {
      console.error(`Failed to register font ${fontFamily}:`, error instanceof Error ? error.message : String(error))
      return false
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

