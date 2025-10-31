import mongoose, { Schema, Document, Model } from "mongoose"

export interface IOrganization extends Document {
  _id: string
  name: string
  description?: string
  website?: string
  logo?: string
  verificationStatus: "pending" | "approved" | "rejected"
  verifiedBy?: mongoose.Types.ObjectId // Admin user who verified
  verifiedAt?: Date
  rejectionReason?: string
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
      match: [/^https?:\/\/.+/, "Please provide a valid website URL"],
    },
    logo: {
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

