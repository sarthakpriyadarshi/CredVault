import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })

import connectDB from "../src/lib/db/mongodb"
import { User } from "../src/models"

async function createAdmin() {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env.local")
      console.error("Please ensure .env.local exists and contains MONGODB_URI")
      process.exit(1)
    }

    await connectDB()
    console.log("Connected to MongoDB")

    const adminEmail = "sarthak@sarthakpriyadarshi.com"
    const adminPassword = "sarthak0813"
    const adminName = "Sarthak Priyadarshi"

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() })
    
    if (existingAdmin) {
      console.log("Admin already exists!")
      console.log("Email:", existingAdmin.email)
      console.log("Role:", existingAdmin.role)
      console.log("Is Verified:", existingAdmin.isVerified)
      return
    }

    // Create admin user (password will be hashed automatically by the User model)
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: "admin",
      isVerified: true, // Admins are auto-verified
      emailVerified: false,
    })

    console.log("✅ Admin user created successfully!")
    console.log("Email:", admin.email)
    console.log("Name:", admin.name)
    console.log("Role:", admin.role)
    console.log("ID:", admin._id.toString())
    console.log("\nYou can now login at: http://localhost:4300/auth/admin/login")
  } catch (error) {
    console.error("❌ Error creating admin:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

createAdmin()

