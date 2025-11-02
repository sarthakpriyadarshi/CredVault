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
                By accessing and using CredVault (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of the Platform constitutes acceptance of any changes.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">
                CredVault provides a digital credential and badge issuance platform that enables:
              </p>
              <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                <li>Organizations to issue verifiable digital credentials and badges</li>
                <li>Recipients to receive, store, and share their credentials</li>
                <li>Third parties to verify the authenticity of credentials</li>
                <li>Blockchain-based verification for enhanced security</li>
                <li>Template creation and customization tools</li>
                <li>Analytics and reporting features</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">3. User Accounts</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">3.1 Account Creation</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    To use certain features of the Platform, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your information as needed</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized access</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">3.2 Account Types</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    We offer different account types with varying permissions:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
                    <li><strong className="text-white">Admin:</strong> Full platform management and configuration</li>
                    <li><strong className="text-white">Issuer:</strong> Create and issue credentials to recipients</li>
                    <li><strong className="text-white">Recipient:</strong> Receive, view, and share credentials</li>
                  </ul>
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
                    <li>Verify recipient eligibility before issuing credentials</li>
                    <li>Ensure accuracy of credential information</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Maintain appropriate documentation and records</li>
                    <li>Handle recipient data responsibly and securely</li>
                    <li>Not issue credentials for fraudulent or illegal purposes</li>
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
                  <p className="text-zinc-300 leading-relaxed">
                    Credentials verified on blockchain are immutable and permanently recorded. You acknowledge that blockchain verification cannot be undone, and credential data on the blockchain is publicly accessible.
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
                  <h3 className="text-xl font-semibold text-white mb-3">7.1 Pricing</h3>
                  <p className="text-zinc-300 leading-relaxed">
                    We offer various pricing plans for different user types and feature sets. Current pricing is available on our website and may be modified with notice.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">7.2 Payment Terms</h3>
                  <p className="text-zinc-300 leading-relaxed mb-3">
                    By purchasing a paid plan, you agree to:
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
                    Refunds are handled on a case-by-case basis. Generally, payments are non-refundable, but we may provide refunds at our discretion for service failures or billing errors.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 8-10 Combined */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy and Data Protection</h2>
                <p className="text-zinc-300 leading-relaxed">
                  Our collection, use, and protection of your personal information is governed by our Privacy Policy. By using the Platform, you consent to our data practices as described in the Privacy Policy.
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
                    Before filing a legal claim, you agree to attempt to resolve disputes informally by contacting us at sarthak@sarthakpriyadarshi.com. We will attempt to resolve the dispute within 30 days.
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
                    <strong className="text-white">Email:</strong> sarthak@sarthakpriyadarshi.com
                  </p>
                  <p className="text-zinc-300">
                    <strong className="text-white">Support:</strong> sarthak@sarthakpriyadarshi.com
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
