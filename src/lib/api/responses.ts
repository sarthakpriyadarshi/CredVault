import { NextResponse } from "next/server"

/**
 * Standard API response utilities
 */

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function validationErrorResponse(errors: string[], status = 400) {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status }
  )
}

export function methodNotAllowed() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = "Forbidden: Insufficient permissions") {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFound(message = "Resource not found") {
  return NextResponse.json({ error: message }, { status: 404 })
}


