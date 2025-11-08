"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import Hero from "@/components/home/hero"
import ModelStyles from "@/components/model-styles"
import Features from "@/components/features"
import { EarlyAccessSection } from "@/components/early-access"
import { FAQSection } from "@/components/faq-section"
import { PricingSection } from "@/components/pricing-section"
import { StickyFooter } from "@/components/sticky-footer"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, isLoading, signOut } = useSupabaseAuth()
  const { toast } = useToast()
  const desktopNavActionClass =
    "inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-green)] hover:bg-white/[0.1] hover:text-[var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"

  const mobileNavActionClass =
    "w-full text-left rounded-lg px-4 py-3 text-lg font-medium text-zinc-300 transition-all duration-200 hover:translate-x-1 hover:bg-white/[0.08] hover:text-[var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      toast({
        title: "Logged out successfully",
      })
      router.replace("/")
      router.refresh()
    } catch (error) {
      console.error("[auth] failed to sign out from navbar", error)
    } finally {
      setIsMobileMenuOpen(false)
    }
  }, [router, signOut, toast])

  const goToDashboard = useCallback(() => {
    setIsMobileMenuOpen(false)
    router.push("/dashboard")
  }, [router])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "system")
    root.classList.add("dark")
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleMobileNavClick = (elementId: string) => {
    setIsMobileMenuOpen(false)
    setTimeout(() => {
      const element = document.getElementById(elementId)
      if (element) {
        const headerOffset = 120
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen w-full relative bg-black">
      {/* Pearl Mist Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(155, 92, 255, 0.15), transparent 60%), #000000",
        }}
      />

      {/* Desktop Header */}
      <header
        className={`sticky top-4 z-[9999] mx-auto hidden w-full max-w-5xl items-center justify-between self-start rounded-full border bg-black/60 transition-colors duration-300 md:flex ${
          isScrolled
            ? "border-white/20 shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
            : "border-white/15 shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
        } backdrop-blur-md px-6 py-3`}
      >
        <a className="flex items-center gap-3 text-white" href="https://modelcast.fit">
          <Logo priority className="h-10 w-10" />
          <span className="text-[1.08rem] font-semibold tracking-[0.03em] text-zinc-50">ModelCast</span>
        </a>

        <div className="absolute inset-0 hidden flex-1 items-center justify-center space-x-2 text-[1.02rem] font-medium text-zinc-300 tracking-[0.025em] transition-colors duration-200 hover:text-zinc-100 md:flex pointer-events-none">
          <a
            className="relative px-4 py-2 text-zinc-400 transition-all duration-200 hover:text-[var(--brand-green)] cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("features")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                })
              }
            }}
          >
            <span className="relative z-20">Features</span>
          </a>
          <a
            className="relative px-4 py-2 text-zinc-400 transition-all duration-200 hover:text-[var(--brand-green)] cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("pricing")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                })
              }
            }}
          >
            <span className="relative z-20">Pricing</span>
          </a>
          <a
            className="relative px-4 py-2 text-zinc-400 transition-all duration-200 hover:text-[var(--brand-green)] cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("early-access")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                })
              }
            }}
          >
            <span className="relative z-20">Early Access</span>
          </a>
          <a
            className="relative px-4 py-2 text-zinc-400 transition-all duration-200 hover:text-[var(--brand-green)] cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("faq")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset

                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                })
              }
            }}
          >
            <span className="relative z-20">FAQ</span>
          </a>
        </div>

        <div className="relative z-10 flex min-h-[2.75rem] items-center">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <div className="h-9 w-20 animate-pulse rounded-full bg-muted/20" />
              <div className="h-9 w-24 animate-pulse rounded-full bg-muted/20" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToDashboard}
                className={cn(desktopNavActionClass, "font-semibold text-foreground")}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(desktopNavActionClass, "font-medium")}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className={cn(
                  desktopNavActionClass,
                  "cursor-pointer border-transparent bg-transparent text-[1.02rem] font-medium tracking-[0.02em]",
                )}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="relative inline-block cursor-pointer rounded-md bg-gradient-to-r from-[#00FF87] to-[#A6FF00] px-5 py-2.5 text-[1.02rem] font-semibold tracking-[0.02em] text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.25)_inset] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,255,135,0.4)]"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full border border-white/15 bg-black/60 px-5 py-3 text-zinc-50 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md md:hidden">
        <a className="flex items-center justify-center gap-3" href="https://modelcast.fit">
          <Logo priority className="h-9 w-9" sizes="(max-width: 768px) 2.25rem, 2.5rem" />
          <span className="text-[1.04rem] font-semibold tracking-[0.03em] text-zinc-50">ModelCast</span>
        </a>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.05] transition-colors hover:border-white/30 hover:bg-white/[0.08]"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            ></span>
          </div>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md md:hidden">
          <div className="absolute top-20 left-4 right-4 rounded-2xl border border-white/15 bg-black/90 p-6 shadow-2xl backdrop-blur-lg">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleMobileNavClick("features")}
                className="text-left rounded-lg px-4 py-3 text-lg font-medium text-zinc-300 transition-all duration-200 hover:text-[var(--brand-green)] hover:bg-white/[0.05]"
              >
                Features
              </button>
              <button
                onClick={() => handleMobileNavClick("pricing")}
                className="text-left rounded-lg px-4 py-3 text-lg font-medium text-zinc-300 transition-all duration-200 hover:text-[var(--brand-green)] hover:bg-white/[0.05]"
              >
                Pricing
              </button>
              <button
                onClick={() => handleMobileNavClick("early-access")}
                className="text-left rounded-lg px-4 py-3 text-lg font-medium text-zinc-300 transition-all duration-200 hover:text-[var(--brand-green)] hover:bg-white/[0.05]"
              >
                Early Access
              </button>
              <button
                onClick={() => handleMobileNavClick("faq")}
                className="text-left rounded-lg px-4 py-3 text-lg font-medium text-zinc-300 transition-all duration-200 hover:text-[var(--brand-green)] hover:bg-white/[0.05]"
              >
                FAQ
              </button>
              <div className="border-t border-border/50 pt-4 mt-4 flex flex-col space-y-3">
                {isLoading ? (
                  <div className="flex flex-col space-y-3">
                    <div className="h-12 animate-pulse rounded-lg bg-muted/20" />
                    <div className="h-12 animate-pulse rounded-lg bg-muted/20" />
                  </div>
                ) : user ? (
                  <>
                    <button
                      onClick={goToDashboard}
                      className={cn(mobileNavActionClass, "text-foreground")}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className={mobileNavActionClass}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(mobileNavActionClass, "cursor-pointer")}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg px-4 py-3 text-lg font-bold text-center text-black shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,255,135,0.4)] bg-gradient-to-r from-[#00FF87] to-[#A6FF00]"
                    >
                      Join
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Model Styles Section */}
      <ModelStyles />

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Early Access Section */}
      <div id="early-access">
        <EarlyAccessSection />
      </div>

      {/* FAQ Section */}
      <div id="faq">
        <FAQSection />
      </div>

      {/* Sticky Footer */}
      <StickyFooter />
    </div>
  )
}
