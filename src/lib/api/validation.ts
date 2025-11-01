/**
 * Validation utilities for API routes
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return {
      valid: false,
      errors: [`${fieldName} is required`],
    }
  }
  return { valid: true, errors: [] }
}

/**
 * Validate password
 */
export function validatePassword(password: string | undefined, minLength = 8): ValidationResult {
  if (!password) {
    return {
      valid: false,
      errors: ["Password is required"],
    }
  }

  const errors: string[] = []

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate email
 */
export function validateEmail(email: string | undefined): ValidationResult {
  if (!email) {
    return {
      valid: false,
      errors: ["Email is required"],
    }
  }

  const emailRegex = /^\S+@\S+\.\S+$/
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      errors: ["Please provide a valid email"],
    }
  }

  return { valid: true, errors: [] }
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      errors: [`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`],
    }
  }
  return { valid: true, errors: [] }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeBytes: number): ValidationResult {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0)
    return {
      valid: false,
      errors: [`File size exceeds ${maxSizeMB}MB limit`],
    }
  }
  return { valid: true, errors: [] }
}


