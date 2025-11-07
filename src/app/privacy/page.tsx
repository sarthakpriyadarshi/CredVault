"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function PrivacyPolicyPage() {
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
      <div className="fixed top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="fixed bottom-40 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />
      
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
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
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-zinc-300 leading-relaxed">
                Welcome to CredVault (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), an enterprise-grade digital credential and badge issuance platform. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform, including when you authenticate using Google OAuth, GitHub OAuth, or email/password.
              </p>
              <p className="text-zinc-300 leading-relaxed mt-3">
                This Privacy Policy complies with Google OAuth verification requirements and applicable data protection laws. By using CredVault, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">2. Information We Collect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2.1 Personal Information</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">We collect information that you provide directly to us, including:</p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li><strong className="text-white">Account Information:</strong> Name, email address, password (hashed), and profile picture</li>
                    <li><strong className="text-white">Organization Information:</strong> For issuers, we collect organization name, website, and verification proof documents</li>
                    <li><strong className="text-white">Profile Data:</strong> Profile information, preferences, public profile settings, and any additional information you choose to provide</li>
                    <li><strong className="text-white">Credential Data:</strong> Credentials issued to you (as a recipient) or issued by you (as an issuer), including credential details, templates, and metadata</li>
                    <li><strong className="text-white">Template Data:</strong> Custom certificate and badge templates you create, including design elements, fonts, and field configurations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2.2 OAuth Provider Information</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    When you authenticate using Google OAuth or GitHub OAuth, we receive the following information from the OAuth provider:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4 mb-3">
                    <li><strong className="text-white">Google OAuth:</strong> Your Google account email address, name, and profile picture URL</li>
                    <li><strong className="text-white">GitHub OAuth:</strong> Your GitHub account email address, username, and profile picture URL</li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    We only request the minimum necessary information required to create and manage your CredVault account. We do not access or store your OAuth provider passwords, and we do not request access to your contacts, files, or other data from OAuth providers beyond what is necessary for authentication.
                  </p>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    When you use OAuth authentication, your email address is automatically verified by the OAuth provider, so we mark your email as verified in our system. You can revoke our access to your OAuth account at any time through your OAuth provider&apos;s settings, which will prevent future OAuth logins but will not delete your CredVault account.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2.3 Automatically Collected Information</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">When you use our platform, we automatically collect:</p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Device information (IP address, browser type, operating system, device identifiers)</li>
                    <li>Usage data (pages visited, features used, time spent, actions taken)</li>
                    <li>Log data and error reports for debugging and security purposes</li>
                    <li>Cookies and similar tracking technologies (see Section 8 for details)</li>
                    <li>Session information and authentication tokens</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2.4 Blockchain Data</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    When you enable blockchain verification for credentials (using VAULT Protocol), we collect and store:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Blockchain transaction IDs and hashes</li>
                    <li>IPFS file identifiers (VAULT File IDs)</li>
                    <li>Wallet addresses used for blockchain transactions</li>
                    <li>Verification timestamps and status</li>
                    <li>Encryption keys (stored securely, never on blockchain)</li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mt-3">
                    Blockchain-verified credentials are encrypted before storage. While verification metadata on the blockchain is publicly accessible and immutable, the actual credential content is encrypted and stored on IPFS. Blockchain verification is optional and only available for self-hosted or future cloud plans.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li><strong className="text-white">Account Management:</strong> Creating and managing your account, authenticating you via email/password or OAuth providers, and maintaining your profile</li>
                <li><strong className="text-white">Service Delivery:</strong> Processing credential issuance, verification, template creation, bulk operations, and providing analytics dashboards</li>
                <li><strong className="text-white">Organization Verification:</strong> Reviewing and verifying organization registration requests and managing issuer accounts</li>
                <li><strong className="text-white">Communication:</strong> Sending email verification messages, service updates, security alerts, and responding to your inquiries</li>
                <li><strong className="text-white">Security:</strong> Detecting and preventing fraud, unauthorized access, and security threats; monitoring for suspicious activity</li>
                <li><strong className="text-white">Platform Improvement:</strong> Analyzing usage patterns, performance metrics, and user feedback to enhance features and user experience</li>
                <li><strong className="text-white">Legal Compliance:</strong> Complying with applicable laws, regulations, legal processes, and responding to lawful requests from authorities</li>
                <li><strong className="text-white">Blockchain Operations:</strong> When enabled, processing blockchain verification, managing IPFS storage, and maintaining transaction records</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-3">
                We do not use your information for advertising purposes or sell your personal information to third parties. OAuth provider information is used solely for authentication and account management purposes.
              </p>
            </div>

            {/* Section 4 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">4. Information Sharing and Disclosure</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.1 With Your Consent</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We share your information when you explicitly consent, such as when you share your public profile or credentials with third parties, or when you authorize OAuth providers to share information with us.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.2 OAuth Providers</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    When you use Google OAuth or GitHub OAuth, we interact with these providers to authenticate you. We do not share your CredVault data back with OAuth providers except as necessary for authentication. OAuth providers have their own privacy policies:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li><strong className="text-white">Google:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Privacy Policy</a></li>
                    <li><strong className="text-white">GitHub:</strong> <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub Privacy Statement</a></li>
                  </ul>
                  <p className="text-zinc-300 leading-relaxed mt-3">
                    You can revoke our access to your OAuth account at any time through your OAuth provider&apos;s account settings, which will prevent future OAuth logins to CredVault.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.3 Service Providers</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We may share information with trusted service providers who assist in operating our platform, including hosting providers (MongoDB, cloud infrastructure), email service providers, analytics services, and customer support tools. These providers are contractually obligated to protect your information and use it only for the purposes we specify.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.4 Legal Requirements</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We may disclose information if required by law, court order, governmental regulation, or legal process, or to protect our rights, property, safety, or the rights of our users. We will notify you of such disclosures when legally permitted.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.5 Public Information</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    Certain information may be publicly accessible:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li><strong className="text-white">Public Profiles:</strong> If you enable a public profile, your name, profile picture, and issued credentials may be publicly viewable</li>
                    <li><strong className="text-white">Blockchain Data:</strong> Blockchain-verified credentials contain publicly accessible verification metadata (transaction IDs, timestamps) on the blockchain network, though credential content remains encrypted</li>
                    <li><strong className="text-white">Organization Information:</strong> Verified organization names and websites may be publicly displayed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>

            {/* Section 6 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
              <p className="text-zinc-300 leading-relaxed">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. Credential records and blockchain data may be retained indefinitely for verification purposes. You may request deletion of your personal data, subject to legal and operational requirements.
              </p>
            </div>

            {/* Section 7 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your information</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for data processing</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-4">
                To exercise these rights, please contact us at support@credvault.app. We will respond to your request within 30 days. Note that some information may be retained for legal or operational purposes, and blockchain data cannot be deleted once verified.
              </p>
              <p className="text-zinc-300 leading-relaxed mt-3">
                For OAuth accounts, you can also manage your data through your OAuth provider&apos;s account settings. Revoking OAuth access will prevent future logins but will not automatically delete your CredVault account or data.
              </p>
            </div>

            {/* Section 8 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li>Maintain user sessions and authentication</li>
                <li>Remember user preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-4">
                You can control cookies through your browser settings, but disabling them may affect platform functionality.
              </p>
            </div>

            {/* Section 9-13 Combined */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Third-Party Services</h2>
                <p className="text-zinc-300 leading-relaxed mb-3">
                  Our platform integrates with the following third-party services:
                </p>
                <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4 mb-3">
                  <li><strong className="text-white">OAuth Providers:</strong> Google OAuth and GitHub OAuth for authentication. Their privacy policies govern how they handle your data.</li>
                  <li><strong className="text-white">Blockchain Networks:</strong> VAULT Protocol and IPFS for optional blockchain verification. Blockchain data is publicly accessible and immutable.</li>
                  <li><strong className="text-white">Database Services:</strong> MongoDB for data storage, subject to MongoDB&apos;s privacy and security practices.</li>
                  <li><strong className="text-white">Email Services:</strong> Email delivery services for verification emails and notifications.</li>
                </ul>
                <p className="text-zinc-300 leading-relaxed">
                  These services have their own privacy policies and terms of service. We are not responsible for the privacy practices of third-party services, but we select service providers that meet high security and privacy standards. We recommend reviewing the privacy policies of OAuth providers before using OAuth authentication.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
                <p className="text-zinc-300 leading-relaxed">
                  Our platform is not intended for users under 13 years of age. We do not knowingly collect information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">11. International Data Transfers</h2>
                <p className="text-zinc-300 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Policy</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Your continued use of the platform after changes constitutes acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
                <p className="text-zinc-300 leading-relaxed mb-4">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 space-y-2">
                  <p className="text-zinc-300">
                    <strong className="text-white">Support Email:</strong> support@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Admin Email:</strong> admin@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Privacy Inquiries:</strong> For questions about this Privacy Policy or our data practices, contact support@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Data Rights Requests:</strong> To exercise your data rights (access, deletion, correction, etc.), contact support@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">OAuth Concerns:</strong> For questions about OAuth data handling or to revoke OAuth access, contact support@credvault.app
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Response Time:</strong> We aim to respond within 48 hours
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
