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
                Welcome to CredVault (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our credential and badge issuance platform.
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
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Account credentials (username, password)</li>
                    <li>Organization information (for issuers)</li>
                    <li>Profile information and preferences</li>
                    <li>Credential data and achievement records</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2.2 Automatically Collected Information</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">When you use our platform, we automatically collect:</p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, features used, time spent)</li>
                    <li>Log data and error reports</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">2.3 Blockchain Data</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    When credentials are verified on blockchain, we store blockchain transaction IDs, wallet addresses, and verification timestamps. This data is immutable and publicly accessible on the blockchain.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">We use the collected information for:</p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li>Providing and maintaining our services</li>
                <li>Processing credential issuance and verification</li>
                <li>Managing user accounts and authentication</li>
                <li>Communicating with you about service updates</li>
                <li>Improving platform security and preventing fraud</li>
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">4. Information Sharing and Disclosure</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.1 With Your Consent</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We share your information when you explicitly consent, such as when sharing credentials with third parties.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.2 Service Providers</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We may share information with trusted service providers who assist in operating our platform, including hosting, analytics, and customer support services.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.3 Legal Requirements</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We may disclose information if required by law, court order, or governmental regulation, or to protect our rights, property, or safety.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">4.4 Public Blockchain Data</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Blockchain-verified credentials contain publicly accessible verification data on the blockchain network.
                  </p>
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
                To exercise these rights, please contact us at privacy@credvault.com
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
                <p className="text-zinc-300 leading-relaxed">
                  Our platform may integrate with third-party services (authentication providers, blockchain networks, analytics tools). These services have their own privacy policies, and we are not responsible for their practices.
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
                    <strong className="text-white">Email:</strong> privacy@credvault.com
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
