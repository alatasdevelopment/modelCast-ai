"use client"

import Link from "next/link"

import { Logo } from "@/components/logo"
import { PricingSection } from "@/components/pricing-section"
import { Button } from "@/components/ui/button"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"

export default function PricingPage() {
  const { user } = useSupabaseAuth()

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-neutral-50">
            <Logo className="h-10 w-10" />
            <span className="text-lg font-semibold tracking-[0.035em]">ModelCast</span>
          </Link>
          {user ? (
            <Button asChild className="bg-lime-400 text-black hover:bg-lime-300">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="text-sm text-neutral-300 hover:text-white">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-lime-400 text-black hover:bg-lime-300">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-8 pt-16 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-lime-300/70">Plans</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Choose the credit pack that fits your workflow
            </h1>
            <p className="mt-3 text-base text-neutral-300 md:max-w-xl">
              Start for free, then upgrade whenever you are ready for HD, dual uploads, and faster generations.
            </p>
          </div>
          <p className="flex items-center justify-center text-sm text-neutral-400 md:justify-end">
            Need more than 150 credits? Email support@modelcast.fit.
          </p>
        </div>
        <PricingSection />
      </main>
    </div>
  )
}
