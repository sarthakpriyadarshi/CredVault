// In-memory store for OAuth error messages
// Keyed by user email, expires after 5 minutes
const errorStore = new Map<string, { message: string; timestamp: number }>()

const EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes

export function setOAuthError(email: string, message: string) {
  errorStore.set(email.toLowerCase(), {
    message,
    timestamp: Date.now(),
  })

  // Clean up expired entries periodically
  if (errorStore.size > 100) {
    cleanupExpired()
  }
}

export function getOAuthError(email: string): string | null {
  const entry = errorStore.get(email.toLowerCase())
  if (!entry) {
    return null
  }

  // Check if expired
  if (Date.now() - entry.timestamp > EXPIRY_TIME) {
    errorStore.delete(email.toLowerCase())
    return null
  }

  // Delete after reading (one-time use)
  errorStore.delete(email.toLowerCase())
  return entry.message
}

function cleanupExpired() {
  const now = Date.now()
  for (const [email, entry] of errorStore.entries()) {
    if (now - entry.timestamp > EXPIRY_TIME) {
      errorStore.delete(email)
    }
  }
}

