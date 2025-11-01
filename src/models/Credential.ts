import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICredentialData {
  [key: string]: string | number | Date // Field name -> value mapping
}

export interface ICredential extends Document {
  _id: string
  templateId: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  recipientEmail: string
  recipientId?: mongoose.Types.ObjectId
  credentialData: ICredentialData
  type: "certificate" | "badge" | "both"
  certificateUrl?: string // Base64 encoded certificate image (data URL)
  badgeUrl?: string // Base64 encoded badge image (data URL)
  isOnBlockchain: boolean
  blockchainTxId?: string // Transaction hash from VAULT Protocol
  blockchainNetwork?: string
  blockchainVerified?: boolean // Whether blockchain record has been verified
  blockchainVerifiedAt?: Date // When blockchain verification was performed
  // VAULT Protocol fields (based on actual API response)
  vaultFid?: string // VAULT Protocol File ID (cert_xxx)
  vaultCid?: string // VAULT Protocol Content ID (IPFS hash - QmXxx)
  vaultUrl?: string // VAULT Protocol URL (vault://fid/cid)
  vaultGatewayUrl?: string // IPFS Gateway URL
  vaultIssuer?: string // Blockchain issuer address
  issuedAt: Date
  expiresAt?: Date
  status: "active" | "expired" | "revoked"
  revokedAt?: Date
  revokedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CredentialSchema = new Schema<ICredential>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: [true, "Template ID is required"],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    recipientEmail: {
      type: String,
      required: [true, "Recipient email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    credentialData: {
      type: Schema.Types.Mixed,
      required: [true, "Credential data is required"],
    },
    type: {
      type: String,
      enum: ["certificate", "badge", "both"],
      required: [true, "Credential type is required"],
    },
    certificateUrl: {
      type: String,
      default: null,
    },
    badgeUrl: {
      type: String,
      default: null,
    },
    isOnBlockchain: {
      type: Boolean,
      default: false,
    },
    blockchainTxId: {
      type: String,
      default: null,
    },
    blockchainNetwork: {
      type: String,
      default: null,
    },
    blockchainVerified: {
      type: Boolean,
      default: false,
    },
    blockchainVerifiedAt: {
      type: Date,
      default: null,
    },
    // VAULT Protocol fields
    vaultFid: {
      type: String,
      default: null,
    },
    vaultCid: {
      type: String,
      default: null,
    },
    vaultUrl: {
      type: String,
      default: null,
    },
    vaultGatewayUrl: {
      type: String,
      default: null,
    },
    vaultIssuer: {
      type: String,
      default: null,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for performance
CredentialSchema.index({ recipientEmail: 1 })
CredentialSchema.index({ recipientId: 1 })
CredentialSchema.index({ organizationId: 1 })
CredentialSchema.index({ templateId: 1 })
CredentialSchema.index({ status: 1 })
CredentialSchema.index({ isOnBlockchain: 1 })
CredentialSchema.index({ blockchainVerified: 1 })
CredentialSchema.index({ expiresAt: 1 })
CredentialSchema.index({ blockchainTxId: 1 })
CredentialSchema.index({ vaultFid: 1 }) // VAULT Protocol index
CredentialSchema.index({ vaultCid: 1 }) // VAULT Protocol index
// Compound indexes for optimized queries
CredentialSchema.index({ organizationId: 1, issuedAt: -1 }) // For issuer credentials query
CredentialSchema.index({ recipientId: 1, issuedAt: -1 }) // For recipient credentials query by ID
CredentialSchema.index({ recipientEmail: 1, issuedAt: -1 }) // For recipient credentials query by email

// Virtual for checking if credential is expired
CredentialSchema.virtual("isExpired").get(function (this: ICredential) {
  if (!this.expiresAt) return false
  return new Date() > this.expiresAt
})

// Method to check if credential should be expired
CredentialSchema.methods.checkExpiration = function () {
  if (this.expiresAt && new Date() > this.expiresAt && this.status === "active") {
    this.status = "expired"
    return true
  }
  return false
}

// Force delete any cached model to ensure schema updates are picked up
if (mongoose.models && mongoose.models.Credential) {
  delete mongoose.models.Credential
}

// Create the model with updated schema
const Credential: Model<ICredential> = mongoose.model<ICredential>("Credential", CredentialSchema)

export default Credential

