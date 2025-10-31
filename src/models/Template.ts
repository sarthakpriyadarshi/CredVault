import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPlaceholder {
  fieldName: string
  type: "text" | "number" | "date" | "email" | "id" | "custom"
  x?: number // Optional - email fields may not have coordinates if not displayed
  y?: number // Optional - email fields may not have coordinates if not displayed
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
      required: false, // Explicitly optional - email fields may not be displayed
    },
    y: {
      type: Number,
      required: false, // Explicitly optional - email fields may not be displayed
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
          // Use console.error to ensure logs appear
          console.error("[TEMPLATE VALIDATOR] Called with placeholders:", JSON.stringify(placeholders, null, 2))
          console.error("[TEMPLATE VALIDATOR] Placeholders array type:", typeof placeholders, Array.isArray(placeholders))
          
          if (!placeholders || !Array.isArray(placeholders) || placeholders.length === 0) {
            console.error("[TEMPLATE VALIDATOR] Failed: placeholders is empty or not an array")
            return false
          }
          
          // Log each placeholder for debugging
          placeholders.forEach((p, idx) => {
            console.error(`[TEMPLATE VALIDATOR] Placeholder ${idx}:`, JSON.stringify({
              fieldName: p?.fieldName,
              type: p?.type,
              typeOf: typeof p?.type,
              hasX: p?.x !== undefined && p?.x !== null,
              hasY: p?.y !== undefined && p?.y !== null,
              x: p?.x,
              y: p?.y,
            }, null, 2))
          })
          
          // Must have at least one placeholder with email type (email field is required but may not have coordinates if not displayed)
          const emailFields = placeholders.filter((p) => {
            if (!p) return false
            const typeStr = String(p.type || "").toLowerCase().trim()
            const isEmail = typeStr === "email"
            console.error(`[TEMPLATE VALIDATOR] Checking placeholder "${p.fieldName}": type="${p.type}" (${typeof p.type}), isEmail=${isEmail}`)
            return isEmail
          })
          
          console.error("[TEMPLATE VALIDATOR] Email fields found:", emailFields.length, emailFields.map(e => e.fieldName))
          
          if (emailFields.length === 0) {
            console.error("[TEMPLATE VALIDATOR] Failed: no email field found")
            return false
          }
          
          // For non-email fields, x and y are required
          const nonEmailFields = placeholders.filter((p) => p && String(p.type || "").toLowerCase().trim() !== "email")
          if (nonEmailFields.length > 0) {
            const allNonEmailFieldsHaveCoords = nonEmailFields.every(
              (p) => p.x !== undefined && p.x !== null && p.y !== undefined && p.y !== null
            )
            if (!allNonEmailFieldsHaveCoords) {
              console.error("[TEMPLATE VALIDATOR] Failed: non-email fields missing coordinates")
              return false
            }
          }
          
          console.error("[TEMPLATE VALIDATOR] Passed validation")
          return true
        },
        message: "Template must have at least one email field, and all non-email fields must have coordinates",
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

// Pre-save hook to debug validation
TemplateSchema.pre("save", function (next) {
  console.error("[PRE-SAVE] Hook triggered - placeholders:", JSON.stringify(this.placeholders, null, 2))
  if (this.placeholders && Array.isArray(this.placeholders)) {
    const emailCount = this.placeholders.filter(p => p && String(p.type || "").toLowerCase().trim() === "email").length
    console.error("[PRE-SAVE] Email fields found:", emailCount)
  }
  next()
})

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

