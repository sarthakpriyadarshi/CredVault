import { NextRequest } from "next/server"

// Parse request body
export async function parseBody<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return await req.json()
  } catch {
    return {} as T
  }
}

// Get query parameters
export function getQueryParams(req: NextRequest): URLSearchParams {
  return new URL(req.url).searchParams
}

// Get pagination parameters
export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export function getPagination(req: NextRequest, defaultLimit = 10): PaginationParams {
  const searchParams = getQueryParams(req)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10)))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

// Create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
) {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    },
  }
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}

// Sanitize input
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "")
}

