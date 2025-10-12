"use client"

import { motion } from "framer-motion"
import { Shield, Zap } from "lucide-react"

export function TrustSection() {
  return (
    <section className="relative py-24 px-4 shadow-[0_-20px_40px_rgba(0,0,0,0.3)]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl p-12 backdrop-blur-sm border border-white/10 bg-gradient-to-b from-white/5 to-transparent text-center"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00FF87]/10 to-[#A6FF00]/10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#00FF87]" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-white/60">Powered by</div>
                  <div className="text-lg font-bold text-white">FASHN AI</div>
                </div>
              </div>

              <div className="w-px h-12 bg-white/20"></div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#A6FF00]" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-white/60">Hosted on</div>
                  <div className="text-lg font-bold text-white">Vercel Edge</div>
                </div>
              </div>
            </div>

            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Your images are processed securely and deleted automatically after 30 minutes. We never store or share
              your data.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
