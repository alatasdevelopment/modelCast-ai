"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Zap, Shield, Smartphone, Sparkles } from "lucide-react"

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate professional model shots in just 20-30 seconds. No waiting, no hassle.",
      gradient: "from-[#A6FF00] to-[#7FFF00]",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your images are processed securely and automatically deleted after 30 minutes.",
      gradient: "from-[#00ffb8] to-[#00ff87]",
    },
    {
      icon: Smartphone,
      title: "Optimized for Everything",
      description: "Perfect for Shopify, Instagram, and web. Export in any format you need.",
      gradient: "from-[#a6ff00] to-[#54ff8b]",
    },
    {
      icon: Sparkles,
      title: "Professional Lighting",
      description: "Choose from Studio, Street, or Outdoor lighting styles for the perfect look.",
      gradient: "from-pink-500 to-pink-400",
    },
  ]

  return (
    <section id="features" className="text-foreground relative overflow-hidden py-24 sm:py-32">
      <div className="bg-[#A6FF00] absolute -top-10 left-1/2 h-16 w-44 -translate-x-1/2 rounded-full opacity-20 blur-3xl select-none"></div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#A6FF00]" />
            <span className="text-sm font-medium text-white/80">How It Works</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-6">
            Three Simple Steps
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Transform your product photos into professional model shots in seconds
          </p>
        </div>

        {/* 3-Step Process */}
        <div className="grid md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              title: "Upload Your Product",
              description: "Simply upload any clothing image - t-shirts, dresses, jackets, anything.",
            },
            {
              step: "02",
              title: "Choose Style",
              description: "Select your preferred model, lighting style, and aspect ratio.",
            },
            {
              step: "03",
              title: "Generate & Download",
              description: "Get your HD professional model shot in 30 seconds. Download and use anywhere.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group h-full"
            >
              <div className="relative rounded-2xl p-8 backdrop-blur-sm border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-[#A6FF00]/30 transition-all duration-300 h-full flex flex-col">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#A6FF00] to-[#7FFF00] flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#A6FF00]/50">
                  {item.step}
                </div>

                <div className="mt-4 flex-1">
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.description}</p>
                </div>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#A6FF00]/0 to-[#A6FF00]/0 group-hover:from-[#A6FF00]/5 group-hover:to-[#A6FF00]/5 transition-all duration-300 pointer-events-none"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <div className="relative rounded-2xl p-6 backdrop-blur-sm border border-white/10 bg-white/5 hover:border-[#A6FF00]/50 transition-all duration-300 h-full">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
