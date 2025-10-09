"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Try it out with a watermarked sample",
    features: ["1 watermarked try-on", "All model styles", "All lighting options", "Standard resolution"],
    popular: false,
    cta: "Start Free",
  },
  {
    name: "Pay-per-use",
    price: "$2",
    priceDetail: "per HD image",
    description: "Perfect for occasional use",
    features: [
      "No watermark",
      "HD resolution",
      "All model styles",
      "All lighting options",
      "Commercial license",
      "Priority processing",
    ],
    popular: true,
    cta: "Buy Credits",
  },
  {
    name: "Pro Pack",
    price: "$10",
    priceDetail: "for 6 credits",
    description: "Best value for regular users",
    features: [
      "6 HD images",
      "Save $2 per image",
      "No watermark",
      "All model styles",
      "All lighting options",
      "Commercial license",
      "Priority processing",
      "Credits never expire",
    ],
    popular: false,
    cta: "Get Pro Pack",
  },
]

export function PricingSection() {
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
            <Sparkles className="w-4 h-4 text-[#A6FF00]" />
            <span className="text-sm font-medium text-white/80">Pricing</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            Simple, Transparent Pricing
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-4">
            No subscriptions. Pay as you go. Start free and upgrade when you need more.
          </p>

          <p className="text-sm text-[#A6FF00] font-medium">No subscriptions. Just credits.</p>
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
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              className={`relative rounded-2xl p-8 backdrop-blur-sm border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-b from-[#A6FF00]/10 to-transparent border-[#A6FF00]/30 shadow-lg shadow-[#A6FF00]/20"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#A6FF00] text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-[#A6FF00]/50 hover:shadow-[#A6FF00]/70 transition-shadow duration-300">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.priceDetail && <span className="text-white/60 text-sm">{plan.priceDetail}</span>}
                </div>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#A6FF00] flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  plan.popular
                    ? "bg-[#A6FF00] text-black shadow-lg shadow-[#A6FF00]/30 hover:shadow-[#A6FF00]/50 font-bold"
                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
