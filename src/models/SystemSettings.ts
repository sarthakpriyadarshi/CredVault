import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISystemSettings extends Document {
  _id: string
  systemName: string
  autoVerificationTimeoutHours: number
  backupSchedule: string
  apiKeyRotationDays: number
  ipWhitelisting: string[]
  emailNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    systemName: {
      type: String,
      default: "Credential Management System",
      trim: true,
    },
    autoVerificationTimeoutHours: {
      type: Number,
      default: 24,
      min: 1,
      max: 168, // Max 1 week
    },
    backupSchedule: {
      type: String,
      default: "0 2 * * *", // Cron format: Daily at 2:00 AM
      trim: true,
    },
    apiKeyRotationDays: {
      type: Number,
      default: 90,
      min: 30,
    },
    ipWhitelisting: {
      type: [String],
      default: ["0.0.0.0/0"], // Allow all by default
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    smsNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// This model should only have one document - use a fixed ID
// The schema will automatically create/update the single settings document

// Safely check for existing model or create new one
const SystemSettings: Model<ISystemSettings> =
  (mongoose.models && (mongoose.models.SystemSettings as Model<ISystemSettings>)) ||
  mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema)

export default SystemSettings

