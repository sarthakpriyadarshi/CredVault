"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function TermsAndConditionsPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "system")
    root.classList.add("dark")
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen w-full relative bg-black">
      {/* Pearl Mist Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      {/* Decorative elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-40 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Sticky Header */}
        <header
          className={`sticky top-4 z-50 mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 ${
            isScrolled ? "max-w-3xl px-4" : "max-w-5xl px-6"
          } py-3`}
        >
          <Link 
            href="/" 
            className="flex items-center gap-2 z-50"
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full object-contain"
            />
          </Link>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-zinc-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-6 py-16 pb-32">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Terms and Conditions</h1>
            <p className="text-zinc-400 text-lg">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Section 1 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-zinc-300 leading-relaxed">
                Welcome to CredVault (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), an enterprise-grade digital credential and badge issuance platform. By accessing, registering for, or using CredVault, you accept and agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;). These Terms constitute a legally binding agreement between you and CredVault.
              </p>
              <p className="text-zinc-300 leading-relaxed mt-3">
                If you do not agree to these Terms, you must not access or use the Platform. We reserve the right to modify these Terms at any time. Material changes will be communicated via email or platform notification. Your continued use of the Platform after such modifications constitutes acceptance of the updated Terms.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">
                CredVault is an enterprise-grade digital credential and badge issuance platform that enables organizations to create, issue, and manage verifiable digital credentials. Our Platform provides:
              </p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li><strong className="text-white">Credential Issuance:</strong> Organizations (Issuers) can create custom certificate and badge templates, issue credentials to recipients individually or in bulk via CSV upload, and manage credential lifecycle</li>
                <li><strong className="text-white">Credential Management:</strong> Recipients can receive, store, view, download, and share their digital credentials through public profile pages</li>
                <li><strong className="text-white">Verification System:</strong> Third parties can verify the authenticity of credentials through QR codes and blockchain verification</li>
                <li><strong className="text-white">Blockchain Integration:</strong> Optional blockchain-based verification using VAULT Protocol for tamper-proof, immutable credential storage with IPFS integration</li>
                <li><strong className="text-white">Template Designer:</strong> Drag-and-drop certificate/badge designer with 50+ Google Fonts, coordinate-based placement, and dynamic field support</li>
                <li><strong className="text-white">Analytics Dashboard:</strong> Real-time analytics and insights for issuers, recipients, and administrators</li>
                <li><strong className="text-white">Organization Management:</strong> Admin-verified organization registration with role-based access control</li>
                <li><strong className="text-white">Bulk Operations:</strong> CSV-based bulk credential issuance with auto-fill support for QR codes and issue dates</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-3">
                The Platform is built using Next.js, MongoDB, and integrates with blockchain networks (VAULT Protocol) and IPFS for decentralized storage when blockchain features are enabled.
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">3. User Accounts</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">3.1 Account Creation</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    To use the Platform, you must create an account. You can register using:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4 mb-3">
                    <li><strong className="text-white">Email and Password:</strong> Traditional registration with email verification</li>
                    <li><strong className="text-white">Google OAuth:</strong> Sign in with your Google account</li>
                    <li><strong className="text-white">GitHub OAuth:</strong> Sign in with your GitHub account</li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    When using OAuth providers (Google or GitHub), you authorize us to access certain information from your OAuth account as described in our Privacy Policy. By creating an account, you agree to:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your information as needed</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Verify your email address when required</li>
                    <li>Comply with the terms of service of any OAuth providers you use to access the Platform</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">3.2 Account Types and Roles</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    CredVault supports three distinct user roles with different permissions:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li><strong className="text-white">Recipient:</strong> Users who receive credentials. Recipients can view, download, and share their credentials, manage their public profile, and verify credentials. Recipient accounts are automatically verified upon registration.</li>
                    <li><strong className="text-white">Issuer:</strong> Organizations that issue credentials. Issuers must register their organization, which requires admin verification. Issuers can create custom templates, issue credentials individually or in bulk, manage their organization, and access analytics. Issuer accounts created via OAuth must complete organization registration separately.</li>
                    <li><strong className="text-white">Admin:</strong> Platform administrators with full system management capabilities, including organization verification, user management, system analytics, and configuration. Admin accounts are created through separate administrative processes.</li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mt-3">
                    Role-based access control ensures that users can only access features and data appropriate to their role. Organization isolation ensures that issuers can only access data from their own organization.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">3.3 Account Termination</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or pose security risks. You may delete your account at any time through your account settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">4. User Responsibilities</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.1 Prohibited Activities</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">You agree not to:</p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Issue fraudulent or misleading credentials</li>
                    <li>Impersonate any person or entity</li>
                    <li>Upload malicious code or viruses</li>
                    <li>Attempt to gain unauthorized access to the Platform</li>
                    <li>Interfere with the proper functioning of the Platform</li>
                    <li>Scrape or harvest data without permission</li>
                    <li>Use the Platform for illegal purposes</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.2 Content Responsibility</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    You are solely responsible for all content you upload, create, or transmit through the Platform. This includes credential descriptions, templates, images, and any other materials. You warrant that you have all necessary rights and permissions for such content.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">5. Credential Issuance</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">5.1 Issuer Responsibilities</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    Organizations issuing credentials through CredVault agree to:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Complete organization registration with accurate information and provide verification proof documents as required</li>
                    <li>Wait for admin verification before issuing credentials (organizations start with &ldquo;pending&rdquo; status)</li>
                    <li>Verify recipient eligibility and accuracy before issuing credentials</li>
                    <li>Ensure all credential information is accurate and truthful</li>
                    <li>Comply with all applicable laws, regulations, and industry standards</li>
                    <li>Maintain appropriate documentation and records of credential issuance</li>
                    <li>Handle recipient data responsibly, securely, and in accordance with our Privacy Policy</li>
                    <li>Not issue credentials for fraudulent, misleading, or illegal purposes</li>
                    <li>Respect intellectual property rights when creating templates and issuing credentials</li>
                    <li>Manage credential lifecycle appropriately, including revocation when necessary</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">5.2 Credential Validity</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Issuers may set expiration dates or revoke credentials at their discretion. CredVault provides the technical means to manage credentials but does not verify the accuracy or legitimacy of credential claims. The issuing organization is solely responsible for the validity of credentials.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">5.3 Blockchain Verification</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    CredVault offers optional blockchain verification using the VAULT Protocol. When enabled:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Credentials are encrypted using AES-256-GCM encryption before storage</li>
                    <li>Encrypted credentials are stored on IPFS (InterPlanetary File System) for decentralized storage</li>
                    <li>Verification data is recorded on the blockchain, making it tamper-proof and immutable</li>
                    <li>Blockchain transaction IDs, wallet addresses, and verification timestamps are stored</li>
                    <li>Once verified on blockchain, credentials cannot be modified or deleted from the blockchain</li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mt-3">
                    You acknowledge that blockchain-verified credentials are permanently recorded and publicly accessible on the blockchain network. Blockchain verification is optional and requires self-hosted infrastructure or a future cloud plan. The Free plan does not include blockchain integration.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">6. Intellectual Property</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">6.1 Platform Ownership</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    CredVault and all related trademarks, logos, and intellectual property are owned by us or our licensors. You may not use, reproduce, or distribute any of our intellectual property without explicit written permission.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">6.2 User Content</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    You retain ownership of content you create on the Platform. By using our services, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and display your content as necessary to provide the Platform services.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">6.3 Feedback</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Any feedback, suggestions, or ideas you provide to us become our property, and we may use them without compensation or attribution.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">7. Payment and Fees</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">7.1 Pricing Plans</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    We offer the following pricing plans:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li><strong className="text-white">Free Plan:</strong> Our main plan available to all users at no cost, providing unlimited credential storage, verification, templates, and bulk issuance without blockchain integration.</li>
                    <li><strong className="text-white">Self-Hosted Plan:</strong> Free and open-source, available on GitHub. Allows you to self-host the platform with full blockchain infrastructure control. Visit our <a href="https://github.com/sarthakpriyadarshi/credvault" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub repository</a> for installation and setup instructions.</li>
                    <li><strong className="text-white">Cloud Plan:</strong> Coming soon. A managed cloud-based solution with automatic blockchain infrastructure management.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">7.2 Payment Terms</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    Currently, all available plans are free. If paid plans are introduced in the future, by purchasing a paid plan, you agree to:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Provide accurate billing information</li>
                    <li>Pay all fees when due</li>
                    <li>Authorize recurring charges for subscription plans</li>
                    <li>Pay applicable taxes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">7.3 Refunds</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    As all current plans are free, refunds are not applicable at this time. If paid plans are introduced in the future, refunds will be handled on a case-by-case basis. Generally, payments are non-refundable, but we may provide refunds at our discretion for service failures or billing errors.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 8-10 Combined */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy and Data Protection</h2>
                <p className="text-zinc-300 leading-relaxed">
                  Our collection, use, disclosure, and protection of your personal information is governed by our Privacy Policy. By using the Platform, including when you authenticate via Google OAuth, GitHub OAuth, or email/password, you consent to our data practices as described in the Privacy Policy. Please review our Privacy Policy carefully to understand how we handle your information, including data received from OAuth providers.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Service Availability</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We strive to maintain high availability but do not guarantee uninterrupted service. The Platform may be unavailable due to maintenance, updates, or unforeseen technical issues. We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimers and Limitations</h2>
                <p className="text-zinc-300 leading-relaxed mb-3">
                  THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                  <li>Indirect, incidental, special, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Service interruptions or data loss</li>
                  <li>Third-party actions or content</li>
                </ul>
                <p className="text-zinc-300 leading-relaxed mt-3">
                  Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </div>
            </div>

            {/* Section 11 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Indemnification</h2>
              <p className="text-zinc-300 leading-relaxed">
                You agree to indemnify, defend, and hold harmless CredVault, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Platform, violation of these terms, or infringement of any rights of another party.
              </p>
            </div>

            {/* Section 12 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">12. Dispute Resolution</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">12.1 Informal Resolution</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Before filing a legal claim, you agree to attempt to resolve disputes informally by contacting us at support@credvault.app. We will attempt to resolve the dispute within 30 days.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">12.2 Arbitration</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    If informal resolution fails, disputes shall be resolved through binding arbitration rather than in court, except where prohibited by law. Arbitration will be conducted on an individual basis; class actions are not permitted.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">12.3 Governing Law</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CredVault operates, without regard to conflict of law principles.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 13-14 Combined */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the Platform. Material changes will be communicated via email or platform notification. Your continued use of the Platform after changes constitutes acceptance of the modified terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  If you have questions about these Terms and Conditions, please contact us:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 space-y-2">
                  <p className="text-zinc-300">
                    <strong className="text-white">Support Email:</strong> support@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Admin Email:</strong> admin@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Response Time:</strong> We aim to respond within 48 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-linear-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-amber-200 font-semibold mb-2 text-lg">
                    Important Notice
                  </p>
                  <p className="text-amber-100 leading-relaxed">
                    By clicking &ldquo;I Accept&rdquo; or by using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, you must discontinue use of the Platform immediately.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-900/30 backdrop-blur-sm mt-16 relative z-10">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-zinc-400 text-sm">
                © {new Date().getFullYear()} CredVault. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Terms & Conditions
                </Link>
                <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
