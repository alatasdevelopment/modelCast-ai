"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import AnimatedBackground from "@/components/animated-background"
import LiquidGlassCard from "@/components/liquid-glass-card"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const phoneData = [
    {
      title: "Studio",
      sub: "Professional lighting & backdrop",
      tone: "premium",
      imageSrc: "/fashion-model-studio-professional-lighting.jpg",
      colorFilter: "hue-rotate-[200deg] saturate-[0.8]",
    },
    {
      title: "Street",
      sub: "Urban energy, authentic vibes",
      tone: "urban",
      imageSrc: "/fashion-model-streetwear-urban-style.jpg",
      colorFilter: "hue-rotate-[20deg] saturate-[1.2]",
    },
    {
      title: "Outdoor",
      sub: "Natural light, lifestyle shots",
      tone: "natural",
      imageSrc: "/fashion-model-outdoor-natural-lighting.jpg",
      colorFilter: "hue-rotate-[90deg] saturate-[1.1]",
    },
    {
      title: "Editorial",
      sub: "High-fashion magazine quality",
      tone: "editorial",
      imageSrc: "/fashion-model-editorial-vogue-style.jpg",
      colorFilter: "saturate-[0.7] contrast-[1.1]",
    },
  ]

  return (
    <>
      <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black">
        <AnimatedBackground />

        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black opacity-60" />

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#A6FF00] opacity-[0.06] blur-[120px] rounded-full" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
            >
              <span className="block text-white mb-2">HIGH-IMPACT</span>
              <span className="block bg-gradient-to-r from-[#A6FF00] via-[#7FFF00] to-[#A6FF00] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(166,255,0,0.4)]">
                AI MODEL SHOTS
              </span>
              <span className="block text-white mt-2">FOR BRANDS</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-center text-lg sm:text-xl text-gray-400 max-w-2xl"
            >
              Transform your product photos into professional model visuals in 30 seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10"
            >
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-black bg-[#A6FF00] rounded-full shadow-lg shadow-[#A6FF00]/40 hover:shadow-[#A6FF00]/60 transition-all duration-300 hover:-translate-y-1"
              >
                <Sparkles className="w-6 h-6 mr-2" />
                Try for Free
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-20 grid w-full gap-6 grid-cols-2 md:grid-cols-4 max-w-6xl"
            >
              {phoneData.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + i * 0.08 }}
                >
                  <LiquidGlassCard
                    title={p.title}
                    sub={p.sub}
                    tone={p.tone}
                    imageSrc={p.imageSrc}
                    colorFilter={p.colorFilter}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
