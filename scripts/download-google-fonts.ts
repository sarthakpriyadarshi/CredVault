/**
 * Script to pre-download all Google Fonts used in templates
 * Run this script to cache all fonts locally for faster certificate generation
 * 
 * Usage: npm run download-fonts
 * or: tsx scripts/download-google-fonts.ts
 */

import { GOOGLE_FONTS, normalizeFontName } from "../src/lib/google-fonts"
import { join } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"

const FONT_CACHE_DIR = join(process.cwd(), "public", "fonts", "cache")

async function downloadFont(fontFamily: string, weight: number = 400): Promise<boolean> {
  try {
    const normalizedName = normalizeFontName(fontFamily)
    const cachePath = join(FONT_CACHE_DIR, `${normalizedName}-${weight}.ttf`)

    // Skip if already cached
    if (existsSync(cachePath)) {
      console.log(`✓ ${fontFamily} (weight ${weight}) already cached`)
      return true
    }

    const fontName = fontFamily.replace(/\s+/g, "+")
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}&display=swap`
    
    console.log(`Downloading ${fontFamily}...`)
    
    const response = await fetch(cssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    
    if (!response.ok) {
      console.error(`✗ Failed to fetch CSS for ${fontFamily}`)
      return false
    }

    const css = await response.text()
    const urlMatches = Array.from(css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g))
    
    if (!urlMatches || urlMatches.length === 0) {
      console.error(`✗ No font URLs found for ${fontFamily}`)
      return false
    }

    // Find TTF URL
    let fontUrl: string | null = null
    for (const match of urlMatches) {
      const url = match[1]
      if (url.includes(".ttf")) {
        fontUrl = url
        break
      } else if (url.includes(".woff2") && !fontUrl) {
        fontUrl = url.replace(".woff2", ".ttf")
      }
    }

    if (!fontUrl) {
      const woff2Match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/)
      if (woff2Match) {
        fontUrl = woff2Match[1].replace(".woff2", ".ttf")
      }
    }

    if (!fontUrl) {
      console.error(`✗ Could not determine TTF URL for ${fontFamily}`)
      return false
    }

    const fontResponse = await fetch(fontUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    
    if (!fontResponse.ok) {
      console.error(`✗ Failed to download font file for ${fontFamily}`)
      return false
    }

    const fontBuffer = Buffer.from(await fontResponse.arrayBuffer())
    writeFileSync(cachePath, fontBuffer)
    
    console.log(`✓ ${fontFamily} downloaded and cached`)
    return true
  } catch (error) {
    console.error(`✗ Error downloading ${fontFamily}:`, error)
    return false
  }
}

async function main() {
  console.log("Starting Google Fonts download...")
  console.log(`Total fonts to download: ${GOOGLE_FONTS.length}`)
  console.log(`Cache directory: ${FONT_CACHE_DIR}\n`)

  // Ensure cache directory exists
  if (!existsSync(FONT_CACHE_DIR)) {
    mkdirSync(FONT_CACHE_DIR, { recursive: true })
  }

  let successCount = 0
  let failCount = 0

  // Download all fonts
  for (const font of GOOGLE_FONTS) {
    const success = await downloadFont(font, 400)
    if (success) {
      successCount++
    } else {
      failCount++
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`\n=== Download Summary ===`)
  console.log(`✓ Success: ${successCount}`)
  console.log(`✗ Failed: ${failCount}`)
  console.log(`Total: ${GOOGLE_FONTS.length}`)
}

main().catch(console.error)

