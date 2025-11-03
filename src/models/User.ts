import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  password?: string
  role: "recipient" | "issuer" | "admin"
  organizationId?: mongoose.Types.ObjectId
  isVerified: boolean
  emailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  image?: string
  // Profile fields
  profilePublic?: boolean
  description?: string
  linkedin?: string
  github?: string
  twitter?: string
  website?: string
  createdAt: Date
  updatedAt: Date
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["recipient", "issuer", "admin"],
      required: [true, "Role is required"],
      default: "recipient",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: function (this: IUser) {
        // Recipients and admins are auto-verified, issuers need admin approval
        return this.role === "recipient" || this.role === "admin"
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: null,
    },
    profilePublic: {
      type: Boolean,
      default: true, // Profile is public by default
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    linkedin: {
      type: String,
      default: null,
      trim: true,
    },
    github: {
      type: String,
      default: null,
      trim: true,
    },
    twitter: {
      type: String,
      default: null,
      trim: true,
    },
    website: {
      type: String,
      default: null,
      trim: true,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
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
// Note: email index is already created by unique: true option above
UserSchema.index({ role: 1 })
UserSchema.index({ organizationId: 1 })
UserSchema.index({ isVerified: 1 })

// Hash password before saving (if using bcrypt)
UserSchema.pre("save", async function (next) {
  // Only hash if password is modified and exists
  if (!this.isModified("password") || !this.password) {
    return next()
  }

  try {
    const bcrypt = await import("bcryptjs")
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: unknown) {
    next(error as Error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(candidatePassword, this.password)
}

// Safely check for existing model or create new one
const User: Model<IUser> =
  (mongoose.models && (mongoose.models.User as Model<IUser>)) ||
  mongoose.model<IUser>("User", UserSchema)

export default User

