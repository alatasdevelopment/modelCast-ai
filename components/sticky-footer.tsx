"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

import { Logo } from "@/components/logo"

const footerLinks = [
  "Home",
  "Features",
  "Pricing",
  "FAQ",
  "Support",
  "Twitter",
  "Instagram",
]

export function StickyFooter() {
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY
          const windowHeight = window.innerHeight
          const documentHeight = document.documentElement.scrollHeight
          const isNearBottom = scrollTop + windowHeight >= documentHeight - 100

          setIsAtBottom(isNearBottom)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isAtBottom && (
        <motion.footer
          className="fixed bottom-0 left-0 z-50 w-full overflow-hidden border-t border-white/10 bg-gradient-to-t from-[#001b10] via-black/95 to-black/90 backdrop-blur-lg"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#00FF87]/25 via-white/10 to-transparent" aria-hidden />

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 text-left text-zinc-200 sm:flex-row sm:items-center sm:justify-between sm:py-12">
            <motion.div
              className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <Logo className="h-10 w-10 md:h-12 md:w-12" sizes="(max-width: 768px) 2.5rem, 3rem" />
                <div className="space-y-1">
                  <p className="text-base font-semibold tracking-[0.03em] text-zinc-50">ModelCast</p>
                  <p className="max-w-sm text-sm text-zinc-400">
                    Fashion-tech visuals powered by AI. Launch premium model shoots in minutes.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.nav
              className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm md:flex md:flex-wrap md:items-center md:justify-end md:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {footerLinks.map((item) => (
                <a
                  key={item}
                  className="cursor-pointer font-medium tracking-[0.02em] text-zinc-300 transition-all duration-200 hover:text-[#00FF87]/90 hover:drop-shadow-[0_0_12px_rgba(0,255,135,0.32)]"
                >
                  {item}
                </a>
              ))}
            </motion.nav>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  )
}
