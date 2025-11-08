"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { useState } from "react"

type PricingPlan = 
  | {
      name: string
      price: string
      description: string
      features: string[]
      popular: boolean
      cta: string
      link: string
      external?: boolean
    }
  | {
      name: string
      monthlyPrice: number
      annualPrice: number
      description: string
      features: string[]
      popular: boolean
      cta: string
      link: string
      external?: boolean
    }

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "Free",
    description: "For individuals and organizations without blockchain",
    features: [
      "Unlimited credential storage",
      "Credential verification",
      "Unlimited templates",
      "Bulk credential issuance (CSV)",
      "Certificate & badge templates",
      "Email delivery",
      "Analytics dashboard",
      "No blockchain integration",
    ],
    popular: true,
    cta: "Get Started",
    link: "/signup",
  },
  {
    name: "Self-Hosted",
    price: "Free",
    description: "Self-host your blockchain infrastructure",
    features: [
      "Everything in Free plan",
      "Blockchain verification support",
      "Self-hosted blockchain node",
      "Full control over infrastructure",
      "No monthly fees",
      "You manage gas costs",
      "Requires technical expertise",
      "IPFS integration",
    ],
    popular: false,
    cta: "View on GitHub",
    link: "https://github.com/sarthakpriyadarshi/credvault",
    external: true,
  },
  {
    name: "Cloud",
    price: "Coming Soon",
    description: "Cloud-based with managed blockchain",
    features: [
      "Everything in Free plan",
      "Managed blockchain infrastructure",
      "Automatic IPFS integration",
      "Blockchain verification support",
      "No infrastructure management",
      "Priority support",
      "Automatic scaling",
      "Gas costs charged separately",
    ],
    popular: false,
    cta: "Coming Soon",
    link: "#",
  },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/80">Pricing</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            Choose your plan
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Start issuing credentials or receiving badges today. Upgrade anytime as your organization grows.
          </p>

          {/* Monthly/Annual Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-4 p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm w-fit mx-auto"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !isAnnual ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white/80"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                isAnnual ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white/80"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative rounded-2xl p-8 backdrop-blur-sm border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/10 to-transparent border-primary/30 shadow-lg shadow-primary/10"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium px-4 py-2 rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  {"price" in plan ? (
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                  ) : "monthlyPrice" in plan ? (
                    <>
                      <span className="text-4xl font-bold text-white">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-white/60 text-lg">{isAnnual ? "/year" : "/month"}</span>
                    </>
                  ) : null}
                </div>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.a
                href={plan.link || "/signup"}
                target={"external" in plan && plan.external ? "_blank" : undefined}
                rel={"external" in plan && plan.external ? "noopener noreferrer" : undefined}
                whileHover={plan.link !== "#" ? { scale: 1.02 } : {}}
                whileTap={plan.link !== "#" ? { scale: 0.98 } : {}}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 text-center block flex items-center justify-center gap-2 ${
                  plan.link === "#"
                    ? "bg-white/5 text-white/50 border border-white/10 cursor-not-allowed"
                    : plan.popular
                    ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {plan.name === "Self-Hosted" && (
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {plan.cta}
              </motion.a>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-4">Need a custom solution for your organization? We&apos;re here to help.</p>
          <motion.a
            href="mailto:support@credvault.app"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary hover:text-primary/80 font-medium transition-colors inline-block"
          >
            Contact our sales team →
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
