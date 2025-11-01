/**
 * Google Fonts configuration and utilities
 * Lists all available fonts used in template creation
 */

export const GOOGLE_FONTS = [
  "Arial",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Raleway",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Oswald",
  "Lora",
  "Source Sans Pro",
  "Ubuntu",
  "Nunito",
  "PT Sans",
  "Noto Sans",
  "Crimson Text",
  "Libre Baskerville",
  "Playfair Display SC",
  "Cormorant Garamond",
  "EB Garamond",
  "Dancing Script",
  "Quicksand",
  "Great Vibes",
  "Pacifico",
  "Lobster",
  "Permanent Marker",
  "Satisfy",
  "Shadows Into Light",
  "Yellowtail",
] as const

export type GoogleFontName = (typeof GOOGLE_FONTS)[number]

/**
 * Get Google Fonts API URL for loading fonts
 * This is used in the layout.tsx to load fonts via CSS
 */
export function getGoogleFontsUrl(): string {
  // Convert font names to URL format (replace spaces with +)
  const fontNames = GOOGLE_FONTS.map((font) => font.replace(/\s+/g, "+")).join("&family=")
  return `https://fonts.googleapis.com/css2?family=${fontNames}:wght@100;200;300;400;500;600;700;800;900&display=swap`
}

/**
 * Font family name normalization
 * Removes spaces and special characters for file naming
 */
export function normalizeFontName(fontName: string): string {
  return fontName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")
}

/**
 * Google Fonts API endpoint for downloading font files
 */
export function getGoogleFontDownloadUrl(fontFamily: string, weight: number = 400): string {
  const normalizedName = fontFamily.replace(/\s+/g, "+")
  // Google Fonts API v2 endpoint
  return `https://fonts.googleapis.com/css2?family=${normalizedName}:wght@${weight}&display=swap`
}

/**
 * Get font file URL from Google Fonts
 * Note: This requires parsing the CSS to get actual font file URLs
 */
export async function getFontFileUrl(fontFamily: string, weight: number = 400): Promise<string | null> {
  try {
    const cssUrl = getGoogleFontDownloadUrl(fontFamily, weight)
    const response = await fetch(cssUrl)
    const css = await response.text()
    
    // Extract font file URL from CSS
    // Google Fonts CSS format: url(https://fonts.gstatic.com/...)
    const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)
    return urlMatch ? urlMatch[1] : null
  } catch (error) {
    console.error(`Failed to get font file URL for ${fontFamily}:`, error)
    return null
  }
}

