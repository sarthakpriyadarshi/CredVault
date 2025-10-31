# CredVault - Credential & Badge Issuance Platform

A scalable platform for issuing and managing digital credentials, certificates, and badges with blockchain verification support.

## Features

- **Multi-role Authentication**: Recipient, Issuer, and Admin roles
- **Organization Verification**: Admin approval system for issuer organizations
- **Template Management**: Create customizable certificate/badge templates
- **Bulk Issuance**: Upload CSV files for batch credential issuance
- **Blockchain Integration**: Optional blockchain verification for credentials
- **Scalable API Architecture**: RESTful API with versioning (`/api/v1/...`)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js v5 with OAuth support
- **Database**: MongoDB

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (copy from `.env.local.example`):
```env
NEXTAUTH_URL=http://localhost:4300
NEXTAUTH_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/credvault
```

4. Run the development server:
```bash
npm run dev
```

## Environment Variables

See `.env.local.example` for all required environment variables:

- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secret key for NextAuth (generate a random string)
- `MONGODB_URI`: MongoDB connection string
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Optional OAuth providers
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: Optional OAuth providers

## Database Models

### User
- Supports roles: `recipient`, `issuer`, `admin`
- Auto-verified recipients, pending verification for issuers
- Password hashing with bcrypt

### Organization
- Verification status: `pending`, `approved`, `rejected`
- Linked to issuer users

### Template
- Supports categories for organization
- Placeholder system with x/y coordinates
- Certificate, badge, or both types
- Requires email field in placeholders

### Credential
- Links to template and organization
- Blockchain integration support
- Expiration and revocation tracking

## API Architecture

The API follows a scalable, versioned structure:

### Base Path
`/api/v1/`

### Authentication Routes
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### User Routes
- `GET /api/v1/users/me` - Get current user (authenticated)

### Middleware
- `withDB` - Database connection wrapper
- `withAuth` - Authentication middleware
- `withAdmin` - Admin-only middleware
- `withIssuer` - Issuer/admin middleware

## Project Structure

```
src/
├── app/
│   ├── api/v1/          # Versioned API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx          # Home page
├── components/            # React components
├── lib/
│   ├── api/             # API utilities and middleware
│   ├── auth.ts          # NextAuth configuration
│   └── db/              # Database connection
└── models/              # MongoDB models
```

## Authentication Routes

- **Recipients**: `/auth/login`, `/auth/signup`
- **Issuers**: `/auth/issuer/login`, `/auth/issuer/signup`
- **Admin**: `/auth/admin/login` (no public signup - admin accounts created manually)
- **Dashboards**: 
  - `/dashboard/recipient` - Recipient dashboard
  - `/dashboard/issuer` - Issuer dashboard
  - `/dashboard/admin` - Admin dashboard (hidden from navigation)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
