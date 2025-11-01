import { NextRequest, NextResponse } from "next/server"
import { getOAuthError } from "@/lib/oauth-errors"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  
  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
  }

  const errorMessage = getOAuthError(email)
  
  if (!errorMessage) {
    return NextResponse.json({ error: null })
  }

  return NextResponse.json({ error: errorMessage })
}

