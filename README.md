![CredVault](./public/github-ogimage.png)

<div align="center">
   
# CredVault - Credential and Badge Issuance Platform

### Enterprise-Grade Credential & Badge Issuance Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![Blockchain](https://img.shields.io/badge/Blockchain-VAULT%20Protocol-purple)](https://github.com/sarthakpriyadarshi/VaultProtocol)

*Issue credentials and badges seamlessly with blockchain verification, custom templates, and enterprise-grade security.*

[Live Demo](https://credvault.app) • [Documentation](https://docs.credvault.app) • [API Reference](https://api.credvault.app)

</div>

---

## Features

### **Multi-Role Authentication System**
- **Recipients**: View, download, and share earned credentials
- **Issuers**: Create templates, issue credentials, manage organizations
- **Admins**: Verify organizations, manage system settings, analytics

### **Organization Management**
- Organization verification workflow with admin approval
- Secure organization registration with proof documentation
- Role-based access control with organization isolation

### **Template & Credential Management**
- **Custom Templates**: Drag-and-drop certificate/badge designer
- **Bulk Issuance**: CSV upload for batch credential generation
- **Dynamic Fields**: Recipient name, date, custom fields
- **Font Library**: 50+ Google Fonts for professional designs

### **Blockchain Integration**
- **VAULT Protocol**: Encrypted, tamper-proof credential storage
- **IPFS Integration**: Decentralized file storage
- **AES-256-GCM Encryption**: Enterprise-grade security
- **Blockchain Verification**: Immutable credential authenticity

### **Analytics & Insights**
- Real-time dashboard analytics for all user roles
- Credential issuance tracking and verification metrics
- Organization performance insights
- System-wide statistics for administrators

---

## Tech Stack

### **Frontend**
- **[Next.js 16.0](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript 5.0+](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful, customizable icons

### **Backend & API**
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless API endpoints
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose ODM](https://mongoosejs.com/)** - Object modeling for MongoDB
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing

### **Authentication**
- **[NextAuth.js v5](https://next-auth.js.org/)** - Authentication framework
- **[OAuth Providers](https://next-auth.js.org/providers/)** - Google, GitHub integration
- **[JWT Strategy](https://next-auth.js.org/configuration/options#session)** - Stateless sessions

### **Blockchain & Storage**
- **[VAULT Protocol](https://github.com/sarthakpriyadarshi/VaultProtocol)** - Custom blockchain solution
- **[Quorum](https://consensys.net/quorum/)** - Enterprise Ethereum platform
- **[IPFS](https://ipfs.io/)** - Distributed file storage
- **[AES-256-GCM](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)** - Encryption standard

### **Development & Deployment**
- **[Vercel](https://vercel.com/)** - Deployment platform
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Turbopack](https://turbo.build/pack)** - Fast bundler for development

---

## Quick Start

### **Prerequisites**
- **Node.js 20+** ([Download](https://nodejs.org/))
- **MongoDB 7.0+** ([Install Guide](https://docs.mongodb.com/manual/installation/))
- **Git** ([Download](https://git-scm.com/))

### **1. Clone & Install**
```bash
# Clone the repository
git clone https://github.com/sarthakpriyadarshi/credvault.git
cd credvault

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### **2. Environment Configuration**
Create `.env.local` with the following variables:

```env
# ============================================
# Application Configuration
# ============================================
NEXTAUTH_URL=http://localhost:4300
NEXTAUTH_SECRET=your-super-secure-secret-key-here-minimum-32-characters

# ============================================
# Database Configuration
# ============================================
MONGODB_URI=mongodb://localhost:27017/credvault
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/credvault

# ============================================
# OAuth Providers (Optional)
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# ============================================
# VAULT Protocol (Blockchain Features)
# ============================================
VAULT_PROTOCOL_URL=http://localhost:3001
FILE_ENCRYPTION_KEY=generate-32-byte-hex-key-here
IPFS_URL=http://127.0.0.1:5001
BLOCKCHAIN_URL=http://127.0.0.1:8545
CHAIN_ID=1337

# ============================================
# Admin Security (Optional)
# ============================================
ADMIN_CREATE_SECRET=your-admin-creation-secret
```

### **3. Database Setup**
```bash
# Start MongoDB (if running locally)
mongod

# The application will automatically create collections on first run
```

### **4. Development Server**
```bash
# Start the development server
npm run dev

# Application will be available at:
# http://localhost:4300
```

### **5. First-Time Setup**
1. Visit `http://localhost:4300`
2. Complete the first-time admin setup
3. Create your admin account
4. Start issuing credentials!

---

## Configuration Guide

### **Environment Variables Reference**

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXTAUTH_URL` | ✅ | Application URL | `http://localhost:4300` |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret | - |
| `MONGODB_URI` | ✅ | MongoDB connection string | - |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret | - |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth client ID | - |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth client secret | - |
| `VAULT_PROTOCOL_URL` | ❌ | VAULT Protocol API endpoint | `http://localhost:3001` |
| `FILE_ENCRYPTION_KEY` | ❌ | AES-256 encryption key (64 chars) | - |
| `IPFS_URL` | ❌ | IPFS node endpoint | `http://127.0.0.1:5001` |
| `BLOCKCHAIN_URL` | ❌ | Quorum node endpoint | `http://127.0.0.1:8545` |
| `ADMIN_CREATE_SECRET` | ❌ | Admin creation API protection | - |

### **OAuth Setup**

<details>
<summary><strong>Google OAuth Configuration</strong></summary>

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

</details>

<details>
<summary><strong>GitHub OAuth Configuration</strong></summary>

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `{NEXTAUTH_URL}/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

</details>

### **Blockchain Setup (Optional)**

<details>
<summary><strong>VAULT Protocol Integration</strong></summary>

For blockchain credential verification:

1. **Clone VAULT Protocol**:
   ```bash
   git clone https://github.com/sarthakpriyadarshi/VaultProtocol.git
   cd VaultProtocol
   ```

2. **Setup Quorum Network**:
   ```bash
   npx quorum-dev-quickstart
   # Follow the interactive setup
   ```

3. **Start IPFS**:
   ```bash
   ipfs daemon
   ```

4. **Start VAULT Protocol API**:
   ```bash
   npm install
   npm run dev:encrypted
   ```

5. **Generate Encryption Key**:
   ```bash
   openssl rand -hex 32
   ```

</details>

---

## Project Structure

```
credvault/
├── public/                   # Static assets
│   ├── fonts/                   # Certificate font files
│   ├── uploads/                 # User uploads
│   ├── logo.svg                 # Application logo
│   └── meta-image.png           # Social media preview
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API endpoints
│   │   │   └── v1/           # Versioned API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # User dashboards
│   │   │   ├── admin/           # Admin dashboard
│   │   │   ├── issuer/          # Issuer dashboard
│   │   │   └── recipient/       # Recipient dashboard
│   │   ├── profile/          # Public profiles
│   │   ├── verify/           # Credential verification
│   │   └── layout.tsx           # Root layout
│   ├── components/           # Reusable UI components
│   │   └── ui/               # Base UI primitives
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts              # NextAuth configuration
│   │   ├── mongodb.ts           # Database connection
│   │   └── certificate/         # Certificate generation
│   ├── models/               # MongoDB schemas
│   │   ├── User.ts              # User model
│   │   ├── Organization.ts      # Organization model
│   │   ├── Template.ts          # Template model
│   │   └── Credential.ts        # Credential model
│   └── types/                # TypeScript definitions
├── .env.example              # Environment template
├── package.json              # Dependencies & scripts
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── next.config.ts            # Next.js configuration
```

---

## Development Workflow

### **Available Scripts**
```bash
# Development
npm run dev          # Start development server (localhost:4300)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npm run db:seed      # Seed development data
npm run db:reset     # Reset database
npm run db:backup    # Backup database

# Testing
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### **Code Quality**
- **ESLint**: Automatic code linting
- **Prettier**: Code formatting on save
- **TypeScript**: Strict type checking
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Standardized commit messages

### **Development Best Practices**
1. **Feature Branches**: Create branches for each feature
2. **Commit Convention**: Use `feat:`, `fix:`, `docs:`, etc.
3. **Code Reviews**: Required for all pull requests
4. **Testing**: Write tests for new features
5. **Documentation**: Update docs with changes

---

## Deployment

### **Vercel Deployment (Recommended)**

1. **Connect Repository**:
   - Fork this repository
   - Import to [Vercel](https://vercel.com/)
   - Configure environment variables

2. **Environment Variables**:
   ```bash
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-production-secret
   MONGODB_URI=your-atlas-connection-string
   # Add all other required variables
   ```

3. **Custom Domain** (Optional):
   - Add custom domain in Vercel dashboard
   - Update `NEXTAUTH_URL` to match

### **Manual Deployment**

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "credvault" -- start
```

### **Database Deployment**

<details>
<summary><strong>MongoDB Atlas Setup</strong></summary>

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Set up database user and IP whitelist
4. Get connection string and update `MONGODB_URI`

</details>

<details>
<summary><strong>Self-Hosted MongoDB</strong></summary>

```bash
# Install MongoDB
sudo apt-get install mongodb

# Configure replica set for transactions
sudo nano /etc/mongod.conf

# Add:
replication:
  replSetName: "rs0"

# Restart and initialize
sudo systemctl restart mongod
mongo --eval "rs.initiate()"
```

</details>

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Quick Contribution Steps**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Setup for Contributors**
```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/credvault.git
cd credvault

# Add upstream remote
git remote add upstream https://github.com/sarthakpriyadarshi/credvault.git

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Start development
npm run dev
```

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Support

### **Getting Help**
- **Documentation**: [docs.credvault.app](https://docs.credvault.app)
- **Discord**: [Join our community](https://discord.gg/credvault)
- **Email**: support@credvault.app
- **Issues**: [GitHub Issues](https://github.com/sarthakpriyadarshi/credvault/issues)

### **Common Issues**

<details>
<summary><strong>MongoDB Connection Issues</strong></summary>

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection string format
MONGODB_URI=mongodb://localhost:27017/credvault
```

</details>

<details>
<summary><strong>OAuth Authentication Issues</strong></summary>

1. Verify OAuth redirect URIs match exactly
2. Check client ID and secret are correct
3. Ensure OAuth applications are not in development mode
4. Verify domain is added to authorized domains

</details>

<details>
<summary><strong>Build/Deployment Issues</strong></summary>

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

</details>

---

## Acknowledgments

- **[Next.js Team](https://nextjs.org/)** - Amazing React framework
- **[Vercel](https://vercel.com/)** - Seamless deployment platform  
- **[MongoDB](https://www.mongodb.com/)** - Flexible NoSQL database
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication made simple
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component system

---

<div align="center">

**Made with by [Sarthak Priyadarshi](https://github.com/sarthakpriyadarshi)**

[Star this repo](https://github.com/sarthakpriyadarshi/credvault) • [Report Bug](https://github.com/sarthakpriyadarshi/credvault/issues) • [Request Feature](https://github.com/sarthakpriyadarshi/credvault/issues/new)

</div>
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
