"use client"

import { motion } from "framer-motion"
import { ArrowRight, Lock, Sparkles, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const totalSpots = 100
const spotsTaken = 53

const perks = [
  {
    icon: Lock,
    title: "Founding Pricing Lock",
    description: "Lock in discounted credit rates during beta. Your early pricing stays fixed after launch.",
  },
  {
    icon: Zap,
    title: "Priority Generation",
    description: "Jump the public queue, test new body models first, and keep your shoots moving fast.",
  },
  {
    icon: Users,
    title: "Creator Circle",
    description: "Work directly with the team—share feedback, influence the roadmap, and co-build features.",
  },
]

export function EarlyAccessSection() {
  return (
    <section id="early-access" className="relative py-24 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(166,255,0,0.12),_transparent_55%)] pointer-events-none" />
      <div className="relative max-w-[1100px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-black/60 px-4 py-2 text-sm font-semibold text-lime-200 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Early Access
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
          >
            Reserve Your Founding Spot
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/70 max-w-2xl mx-auto mb-12"
          >
            Secure priority access, lock in your credit pricing, and help shape ModelCast before the public launch.
          </motion.p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-12 text-left">
            {perks.map((perk, index) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-lime-300/30 hover:bg-neutral-900/80 hover:scale-[1.01] transition"
              >
                <perk.icon className="w-6 h-6 text-lime-300 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{perk.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{perk.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 text-base font-medium text-white mb-3">
              <span className="h-2 w-2 rounded-full bg-lime-300" />
              <span>
                {spotsTaken} / {totalSpots} spots claimed
              </span>
            </div>
            <div className="max-w-md mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime-400 to-lime-200"
                initial={{ width: "0%" }}
                whileInView={{ width: "53%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              variant="lime"
              className="w-full sm:w-auto text-base px-8 py-4 font-semibold shadow-[0_0_12px_rgba(163,255,88,0.25)] hover:shadow-[0_0_18px_rgba(163,255,88,0.35)]"
            >
              Join the Early Access List
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 text-sm text-white/50"
          >
            No credit card required · Cancel anytime · Privacy guaranteed
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
