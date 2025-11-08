"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

import { Logo } from "@/components/logo"

type FooterLink = {
  label: string
  targetId?: string
  href?: string
}

const footerLinks: FooterLink[] = [
  { label: "Home", targetId: "home" },
  { label: "Features", targetId: "features" },
  { label: "Pricing", targetId: "pricing" },
  { label: "Early Access", targetId: "early-access" },
  { label: "FAQ", targetId: "faq" },
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

  const scrollToSection = (targetId?: string) => {
    if (!targetId) return

    if (targetId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const element = document.getElementById(targetId)
    if (!element) return

    const headerOffset = 120
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - headerOffset

    window.scrollTo({ top: offsetPosition, behavior: "smooth" })
  }

  const linkClassName =
    "cursor-pointer font-medium tracking-[0.02em] text-zinc-300 transition-all duration-200 hover:text-lime-300 hover:drop-shadow-[0_0_18px_rgba(163,255,88,0.35)]"

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

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 text-left text-zinc-200 lg:flex-row lg:items-center lg:justify-between lg:py-12">
            <motion.div
              className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-6"
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

            <div className="flex flex-col gap-6 text-sm md:flex-row md:items-center md:gap-10">
              <motion.nav
                className="grid grid-cols-2 gap-x-10 gap-y-4 md:flex md:flex-wrap md:items-center md:gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {footerLinks.map(({ label, href, targetId }) =>
                  href ? (
                    <a key={label} href={href} className={linkClassName}>
                      {label}
                    </a>
                  ) : (
                    <button key={label} type="button" onClick={() => scrollToSection(targetId)} className={linkClassName}>
                      {label}
                    </button>
                  ),
                )}
              </motion.nav>
              <nav className="flex flex-row flex-wrap gap-4 text-gray-400 md:border-l md:border-white/10 md:pl-8">
                <a href="/terms" className="transition hover:text-lime-400">
                  Terms
                </a>
                <a href="/privacy" className="transition hover:text-lime-400">
                  Privacy
                </a>
                <a href="mailto:modelcast.fit@proton.me" className="transition hover:text-lime-400">
                  Contact
                </a>
              </nav>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  )
}
