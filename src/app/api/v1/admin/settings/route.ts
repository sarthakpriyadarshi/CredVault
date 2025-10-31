import { NextRequest, NextResponse } from "next/server"
import { withAdmin, handleApiError } from "@/lib/api/middleware"
import { parseBody } from "@/lib/api/utils"
import SystemSettings from "@/models/SystemSettings"
import connectDB from "@/lib/db/mongodb"

// GET settings
async function getHandler(
  _req: NextRequest,
  _context: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  try {
    await connectDB()

    // Get or create default settings document (singleton pattern)
    // Use findOneAndUpdate with upsert to ensure only one document exists
    let settings = await SystemSettings.findOneAndUpdate(
      {},
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Format backup schedule for display
    const formatBackupSchedule = (cron: string) => {
      if (cron === "0 2 * * *") return "Daily at 2:00 AM"
      // Add more formatting as needed
      return cron
    }

    return NextResponse.json({
      systemName: settings.systemName,
      autoVerificationTimeoutHours: settings.autoVerificationTimeoutHours,
      backupSchedule: settings.backupSchedule,
      backupScheduleDisplay: formatBackupSchedule(settings.backupSchedule),
      apiKeyRotationDays: settings.apiKeyRotationDays,
      ipWhitelisting: settings.ipWhitelisting,
      ipWhitelistingDisplay: settings.ipWhitelisting.length === 0 || settings.ipWhitelisting.includes("0.0.0.0/0") 
        ? "0.0.0.0/0 (Allow all)" 
        : `${settings.ipWhitelisting.length} IP(s) configured`,
      emailNotificationsEnabled: settings.emailNotificationsEnabled,
      smsNotificationsEnabled: settings.smsNotificationsEnabled,
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

// PUT/PATCH settings
async function updateHandler(
  req: NextRequest,
  _context: { params?: Promise<Record<string, string>> | Record<string, string> },
  _user?: Record<string, unknown>
) {
  try {
    await connectDB()

    const body = await parseBody<{
      systemName?: string
      autoVerificationTimeoutHours?: number
      backupSchedule?: string
      apiKeyRotationDays?: number
      ipWhitelisting?: string[]
      emailNotificationsEnabled?: boolean
      smsNotificationsEnabled?: boolean
    }>(req)

    // Get or create settings (singleton pattern)
    let settings = await SystemSettings.findOneAndUpdate(
      {},
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Update fields if provided
    if (body.systemName !== undefined) {
      settings.systemName = body.systemName.trim()
    }
    if (body.autoVerificationTimeoutHours !== undefined) {
      settings.autoVerificationTimeoutHours = Math.max(1, Math.min(168, body.autoVerificationTimeoutHours))
    }
    if (body.backupSchedule !== undefined) {
      settings.backupSchedule = body.backupSchedule.trim()
    }
    if (body.apiKeyRotationDays !== undefined) {
      settings.apiKeyRotationDays = Math.max(30, body.apiKeyRotationDays)
    }
    if (body.ipWhitelisting !== undefined) {
      settings.ipWhitelisting = body.ipWhitelisting
    }
    if (body.emailNotificationsEnabled !== undefined) {
      settings.emailNotificationsEnabled = body.emailNotificationsEnabled
    }
    if (body.smsNotificationsEnabled !== undefined) {
      settings.smsNotificationsEnabled = body.smsNotificationsEnabled
    }

    await settings.save()

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: {
        systemName: settings.systemName,
        autoVerificationTimeoutHours: settings.autoVerificationTimeoutHours,
        backupSchedule: settings.backupSchedule,
        apiKeyRotationDays: settings.apiKeyRotationDays,
        ipWhitelisting: settings.ipWhitelisting,
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        smsNotificationsEnabled: settings.smsNotificationsEnabled,
      },
    })
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(getHandler)
export const PUT = withAdmin(updateHandler)
export const PATCH = withAdmin(updateHandler)

