import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPlaceholder {
  fieldName: string
  type: "text" | "number" | "date" | "email" | "id" | "custom"
  x: number
  y: number
  fontSize?: number
  fontFamily?: string
  color?: string
  align?: "left" | "center" | "right"
}

export interface ITemplate extends Document {
  _id: string
  name: string
  description?: string
  category: string
  organizationId: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  type: "certificate" | "badge" | "both"
  certificateImage?: string // URL or path to certificate image/PDF
  badgeImage?: string // URL or path to badge image
  placeholders: IPlaceholder[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PlaceholderSchema = new Schema<IPlaceholder>(
  {
    fieldName: {
      type: String,
      required: [true, "Field name is required"],
    },
    type: {
      type: String,
      enum: ["text", "number", "date", "email", "id", "custom"],
      required: [true, "Field type is required"],
    },
    x: {
      type: Number,
      required: [true, "X coordinate is required"],
    },
    y: {
      type: Number,
      required: [true, "Y coordinate is required"],
    },
    fontSize: {
      type: Number,
      default: 16,
    },
    fontFamily: {
      type: String,
      default: "Arial",
    },
    color: {
      type: String,
      default: "#000000",
    },
    align: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
  },
  { _id: false }
)

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
      lowercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    },
    type: {
      type: String,
      enum: ["certificate", "badge", "both"],
      required: [true, "Template type is required"],
    },
    certificateImage: {
      type: String,
      default: null,
    },
    badgeImage: {
      type: String,
      default: null,
    },
    placeholders: {
      type: [PlaceholderSchema],
      default: [],
      validate: {
        validator: function (this: ITemplate, placeholders: IPlaceholder[]) {
          // Must have at least one placeholder for email
          return placeholders.some((p) => p.fieldName.toLowerCase() === "email")
        },
        message: "Template must have at least one email field",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
TemplateSchema.index({ organizationId: 1 })
TemplateSchema.index({ createdBy: 1 })
TemplateSchema.index({ category: 1 })
TemplateSchema.index({ isActive: 1 })

// Safely check for existing model or create new one
const Template: Model<ITemplate> =
  (mongoose.models && (mongoose.models.Template as Model<ITemplate>)) ||
  mongoose.model<ITemplate>("Template", TemplateSchema)

export default Template

