"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { geist } from "@/lib/fonts"
import { cn } from "@/lib/utils"

const heroVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay },
  }),
}

export default function Hero() {
  return (
    <section
      id="hero"
      role="banner"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-black py-10 text-center sm:py-14 md:py-20"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(163,255,88,0.08),transparent_70%),radial-gradient(circle_at_80%_70%,rgba(120,255,200,0.06),transparent_70%)]"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 200%" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-400/5 blur-[200px]"
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:180px_140px]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center sm:px-8">
        <motion.p
          custom={0.1}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="mb-3 text-xs uppercase tracking-[0.32em] text-lime-400/80 md:text-sm"
        >
          AI-Powered Visuals for Fashion Creators
        </motion.p>

        <motion.h1
          id="hero-heading"
          custom={0.2}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "mb-5 text-5xl font-black leading-[1.1] text-white md:text-6xl",
            "bg-gradient-to-r from-lime-300 via-white to-lime-200 bg-clip-text text-transparent",
            geist.className,
          )}
        >
          Generate model photos with AI
        </motion.h1>

        <motion.p
          custom={0.3}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="mb-7 max-w-2xl text-base text-gray-400 sm:text-lg"
        >
          Turn simple product images into studio-grade model visuals — no photoshoots, no models, no limits. Free to
          try.
        </motion.p>

        <motion.div
          custom={0.4}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="mb-3 flex flex-wrap justify-center gap-4"
        >
          <Link href="/signup" prefetch={false}>
            <Button
              variant="lime"
              size="lg"
              className="btn-lime group relative overflow-hidden rounded-full px-8 py-3 text-base font-semibold transition-transform duration-300 hover:scale-[1.03]"
              aria-label="Start generating AI model photos"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin-slow" /> Start generating
              </span>
              <span className="absolute inset-0 translate-y-[65%] bg-white/25 blur-2xl transition-all duration-300 group-hover:translate-y-[10%]" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="px-6 text-base font-semibold text-gray-300 transition-colors duration-200 hover:text-white"
            asChild
          >
            <Link href="#how-it-works" prefetch={false} aria-label="View how ModelCast works">
              View how it works →
            </Link>
          </Button>
        </motion.div>

        <motion.p
          custom={0.45}
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="text-sm text-zinc-400"
        >
          Learn more in our{" "}
          <Link href="#faq" prefetch={false} className="text-lime-300 underline-offset-4 hover:underline">
            FAQ
          </Link>{" "}
          about credits, privacy, and results.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
          className="text-xs font-medium uppercase tracking-[0.32em] text-zinc-500"
        >
          Trusted by early fashion creators worldwide
        </motion.p>
      </div>
    </section>
  )
}
