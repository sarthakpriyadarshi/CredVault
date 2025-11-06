import mongoose, { Schema, Document, Model } from "mongoose"

export interface IOrganization extends Document {
  _id: string
  name: string
  description?: string
  website?: string
  logo?: string
  verificationProof?: string // Base64 encoded verification proof image
  verificationStatus: "pending" | "approved" | "rejected"
  verifiedBy?: mongoose.Types.ObjectId // Admin user who verified
  verifiedAt?: Date
  rejectionReason?: string
  blockchainEnabled?: boolean // Whether blockchain is enabled for this organization
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string | null | undefined): boolean => {
          // If website is not provided (empty/undefined), it's valid (optional field)
          if (!v || typeof v !== "string" || v.trim() === "") {
            return true
          }
          // If provided, it should be a valid URL (with or without protocol)
          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
          return urlPattern.test(v) || v.startsWith("http://") || v.startsWith("https://")
        },
        message: "Please provide a valid website URL",
      },
    },
    logo: {
      type: String,
      default: null,
    },
    verificationProof: {
      type: String,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    blockchainEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
// Note: name index is already created by unique: true option above
OrganizationSchema.index({ verificationStatus: 1 })
OrganizationSchema.index({ verifiedBy: 1 })

// Safely check for existing model or create new one
const Organization: Model<IOrganization> =
  (mongoose.models && (mongoose.models.Organization as Model<IOrganization>)) ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema)

export default Organization

