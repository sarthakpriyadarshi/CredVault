# Admin Setup Guide

## Admin Role Status

✅ **Schema**: Admin role is included in User model (`enum: ["recipient", "issuer", "admin"]`)
✅ **Login**: Admin can login via `/auth/admin/login` 
✅ **Login API**: `/api/v1/auth/login` supports admin role
✅ **Dashboard**: Admin dashboard at `/dashboard/admin`
✅ **Auto-Verification**: Admins are automatically verified (same as recipients)

## Admin Account Creation

**Note**: Admin accounts cannot be created via the public registration endpoint for security reasons.

### Option 1: Create Admin via Secure API Endpoint

Use the protected admin creation endpoint:

```bash
POST /api/v1/admin/create-admin
Content-Type: application/json
x-admin-secret: your-secret-key (if ADMIN_CREATE_SECRET is set)

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "secure-password-here"
}
```

**To secure this endpoint:**
1. Add to `.env.local`:
   ```
   ADMIN_CREATE_SECRET=your-very-secure-secret-here
   ```
2. Include the secret in the request header: `x-admin-secret: your-very-secure-secret-here`

### Option 2: Create Admin Directly in MongoDB

```javascript
// In MongoDB shell or MongoDB Compass
db.users.insertOne({
  name: "Admin Name",
  email: "admin@example.com",
  password: "<bcrypt-hashed-password>", // Hash with bcrypt
  role: "admin",
  isVerified: true,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Option 3: Use a Setup Script

Create a script to initialize the first admin:

```typescript
// scripts/create-admin.ts
import connectDB from "@/lib/db/mongodb"
import { User } from "@/models"
import bcrypt from "bcryptjs"

async function createAdmin() {
  await connectDB()
  
  const hashedPassword = await bcrypt.hash("your-password", 10)
  
  const admin = await User.create({
    name: "Admin Name",
    email: "admin@example.com",
    password: hashedPassword,
    role: "admin",
    isVerified: true,
  })
  
  console.log("Admin created:", admin.email)
}

createAdmin()
```

## Admin URLs

- **Login**: `/auth/admin/login`
- **Dashboard**: `/dashboard/admin` (redirects to login if not authenticated)
- **No Signup**: Admin signup is disabled for security (manual creation only)

## Security Notes

- Admin accounts are automatically verified
- Admin creation endpoint can be protected with `ADMIN_CREATE_SECRET`
- Admin login requires the admin role to be set in the database
- Consider removing or further securing `/api/v1/admin/create-admin` in production after initial setup

