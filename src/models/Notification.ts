import mongoose, { Schema, Document, Model } from "mongoose"

export type NotificationType = 
  | "organization_signup"      // Admin: New organization signed up
  | "organization_approved"     // Issuer: Organization approved
  | "organization_rejected"     // Issuer: Organization rejected
  | "credential_issued"         // Recipient: Credential issued
  | "credential_verified"        // Issuer: Credential verified

export interface INotification extends Document {
  _id: string
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "organization_signup",
        "organization_approved",
        "organization_rejected",
        "credential_issued",
        "credential_verified",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })

// Safely check for existing model or create new one
const Notification: Model<INotification> =
  (mongoose.models && (mongoose.models.Notification as Model<INotification>)) ||
  mongoose.model<INotification>("Notification", NotificationSchema)

export default Notification

