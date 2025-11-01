# CredVault - Credential & Badge Issuance Platform

A scalable platform for issuing and managing digital credentials, certificates, and badges with blockchain verification support.

## Features

- **Multi-role Authentication**: Recipient, Issuer, and Admin roles
- **Organization Verification**: Admin approval system for issuer organizations
- **Template Management**: Create customizable certificate/badge templates
- **Bulk Issuance**: Upload CSV files for batch credential issuance
- **Blockchain Integration**: VAULT Protocol for encrypted, blockchain-verified credentials
- **Scalable API Architecture**: RESTful API with versioning (`/api/v1/...`)
- **Decentralized Storage**: IPFS integration via VAULT Protocol
- **Enterprise Encryption**: AES-256-GCM encryption for all blockchain certificates

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js v5 with OAuth support
- **Database**: MongoDB
- **Blockchain**: VAULT Protocol (Quorum/IPFS)
- **Encryption**: AES-256-GCM via VAULT Protocol

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
# Basic Configuration
NEXTAUTH_URL=http://localhost:4300
NEXTAUTH_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/credvault

# VAULT Protocol (Optional - for blockchain features)
VAULT_PROTOCOL_URL=http://localhost:3001
FILE_ENCRYPTION_KEY=9c69b7c1996a8cbb37bd218fc147a0e275444aeb83dc30d8d2992a42321395f6
```

> **Note**: For blockchain features, you need to set up VAULT Protocol. See [VAULT Protocol Integration Guide](./docs/VAULT_PROTOCOL_INTEGRATION.md)

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

## 🔐 VAULT Protocol Integration

CredVault integrates with [VAULT Protocol](https://github.com/sarthakpriyadarshi/VaultProtocol) for blockchain-based credential verification and encrypted storage.

### Features

- **Blockchain Verification**: Immutable credential records on Quorum blockchain
- **Encrypted Storage**: AES-256-GCM encryption before IPFS storage
- **Decentralized Files**: IPFS for distributed certificate storage
- **Custom Protocol**: `vault://` URLs for secure access
- **Automatic Decryption**: Files decrypted on retrieval

### Setup

1. Install VAULT Protocol dependencies:
```bash
# Clone VAULT Protocol
git clone https://github.com/sarthakpriyadarshi/VaultProtocol.git
cd VaultProtocol
npm install

# Start IPFS
ipfs daemon

# Start Quorum (in separate terminal)
npx quorum-dev-quickstart
cd quorum-dev-quickstart && ./start.sh

# Start VAULT Protocol API
npm run dev:encrypted
```

2. Configure environment variables in `.env.local`:
```env
VAULT_PROTOCOL_URL=http://localhost:3001
FILE_ENCRYPTION_KEY=9c69b7c1996a8cbb37bd218fc147a0e275444aeb83dc30d8d2992a42321395f6
```

3. Enable "Register on Blockchain" when issuing credentials

For detailed setup instructions, see [VAULT Protocol Integration Guide](./docs/VAULT_PROTOCOL_INTEGRATION.md)

### How It Works

1. **Issuance**: Certificate → Encrypt → IPFS → Blockchain → MongoDB
2. **Verification**: Query MongoDB → Verify Blockchain → Retrieve from IPFS → Decrypt
3. **Storage**: 
   - **CredVault DB**: Credential metadata, user data
   - **VAULT Protocol**: Encrypted files, blockchain records
   - **IPFS**: Distributed file storage

### Credential Fields (with Blockchain)

| Field | Description |
|-------|-------------|
| `vaultFid` | VAULT Protocol File ID |
| `vaultCid` | IPFS Content ID (encrypted) |
| `vaultUrl` | vault://fid/cid URL |
| `vaultGatewayUrl` | IPFS Gateway URL |
| `blockchainTxId` | Transaction hash |
| `vaultIssuer` | Blockchain issuer address |


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
