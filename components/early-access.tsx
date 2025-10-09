"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Zap, Brain } from "lucide-react"
import { useState, useEffect } from "react"

export function EarlyAccessSection() {
  const [spotsCount, setSpotsCount] = useState(47)

  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsCount((prev) => {
        const newCount = prev + Math.floor(Math.random() * 2)
        return newCount >= 100 ? 100 : newCount
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const benefits = [
    {
      icon: Sparkles,
      title: "Founding Member Pricing",
      description: "Lock in $2 per HD image forever.",
    },
    {
      icon: Zap,
      title: "Priority Access",
      description: "Get faster generation and first access to new models.",
    },
    {
      icon: Brain,
      title: "Co-Creation Perks",
      description: "Your feedback directly shapes the platform.",
    },
  ]

  return (
    <section id="early-access" className="relative py-24 px-4">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00FF87]/20 to-[#A6FF00]/20 border border-[#00FF87]/30 mb-8 shadow-[0_0_20px_rgba(0,255,135,0.2)]"
          >
            <span className="text-2xl">🚀</span>
            <span className="text-[#00FF87] font-semibold text-sm">Early Access</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Be One of the First 100 Creators
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 max-w-[600px] mx-auto mb-12"
          >
            We're launching soon. Join early and help shape the future of AI-powered model photography.
          </motion.p>

          {/* Benefit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="group relative p-8 rounded-2xl backdrop-blur-sm border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:-translate-y-1.5 transition-all duration-300"
                style={{
                  boxShadow: "0 0 0 1px rgba(0,255,135,0.1), 0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00FF87]/5 to-[#A6FF00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00FF87]/20 to-[#A6FF00]/20 flex items-center justify-center mb-4 mx-auto group-hover:shadow-[0_0_30px_rgba(0,255,135,0.3)] transition-shadow duration-300">
                    <benefit.icon className="w-7 h-7 text-[#00FF87]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/70">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 text-lg font-semibold text-white mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00FF87]"></span>
              </span>
              <span>{spotsCount} / 100 spots taken</span>
            </div>
            <div className="max-w-md mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00FF87] to-[#A6FF00] rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: `${spotsCount}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#00FF87] to-[#A6FF00] text-black font-bold text-lg hover:-translate-y-1 transition-all duration-300 shadow-[0_0_30px_rgba(0,255,135,0.25)] hover:shadow-[0_0_50px_rgba(0,255,135,0.4)]"
          >
            <span>Claim Your Founding Spot</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.button>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-6 text-sm text-white/50"
          >
            No credit card needed • Cancel anytime • Privacy guaranteed
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
