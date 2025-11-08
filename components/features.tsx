"use client"

import { motion, useInView } from "framer-motion"
import { useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Palette, ShieldCheck, Smartphone, Sparkles, Upload, Zap } from "lucide-react"

const processSteps = [
  {
    num: "01",
    title: "Upload Your Product",
    desc: "Drop in any garment photo — tees, dresses, jackets, you name it.",
    icon: Upload,
  },
  {
    num: "02",
    title: "Choose Style",
    desc: "Pick the model, lighting, and framing that matches your brand.",
    icon: Palette,
  },
  {
    num: "03",
    title: "Generate & Download",
    desc: "Receive an HD model shot in ~30 seconds and use it anywhere.",
    icon: Sparkles,
  },
] as const

const benefitHighlights = [
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Final shots render in 20–30 seconds so you never wait around.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy First",
    desc: "Uploads stay encrypted and auto-delete within 30 minutes.",
  },
  {
    icon: Smartphone,
    title: "Optimized for Everything",
    desc: "Go from Shopify to Instagram without extra resizing.",
  },
  {
    icon: Camera,
    title: "Professional Lighting",
    desc: "Studio, street, or outdoor looks that keep skin tones natural.",
  },
] as const

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  // Fade + slight lift only once per view to keep focus on the content hierarchy
  const cardAnimation = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }),
    [],
  )

  return (
    <section id="how-it-works" className="relative py-24 bg-black text-center">
      <div className="mx-auto max-w-5xl px-4">
        <Button
          variant="ghost"
          size="sm"
          className="mx-auto mb-6 text-lime-400/80 hover:bg-lime-400/10 focus-visible:ring-lime-300/40"
        >
          ✨ How It Works
        </Button>

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Three Simple Steps</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-12">
          Transform your product photos into professional model shots in seconds.
        </p>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 text-left">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.num}
              ref={index === 0 ? ref : undefined}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              variants={cardAnimation}
            >
              <div className="rounded-2xl bg-neutral-900/50 border border-neutral-800 p-6 h-full text-center sm:text-left hover:bg-neutral-800/60 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-lime-400/10 text-lime-300 text-sm font-semibold">
                    {step.num}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-neutral-900/80 flex items-center justify-center border border-neutral-800">
                    <step.icon className="w-5 h-5 text-lime-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 text-center md:text-left">
          {benefitHighlights.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
              variants={cardAnimation}
            >
              <div className="rounded-xl bg-neutral-900/30 p-5 border border-neutral-800 hover:bg-neutral-800/40 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="flex items-center gap-2 text-lime-300 justify-center md:justify-start mb-2">
                  <benefit.icon className="w-4 h-4" />
                  <span className="sr-only">{benefit.title} icon</span>
                </div>
                <h4 className="text-white font-medium mb-1">{benefit.title}</h4>
                <p className="text-gray-400 text-sm leading-snug">{benefit.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
