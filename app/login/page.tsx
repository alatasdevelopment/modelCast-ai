"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabaseClient = useMemo(() => getSupabaseClient(), [])
  const { user, isLoading: authLoading } = useSupabaseAuth()
  const { toast } = useToast()
  const showVerifyBanner = searchParams?.get("verify") === "1"

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (user) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[auth] signIn failed", error)
      setErrorMessage(error.message)
    } else {
      toast({
        title: "Welcome back",
      })
      router.replace("/dashboard")
    }

    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    const redirectHost = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectHost.replace(/\/$/, "")}/auth/callback`,
      },
    })

    if (error) {
      console.error("[auth] google sign-in failed", error)
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 text-zinc-400 opacity-70 hover:opacity-100 transition-opacity duration-200 ease-out flex items-center space-x-2 text-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </Link>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#22c55e]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#22c55e]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Logo
              priority
              sizes="(max-width: 768px) 4.5rem, 6.75rem"
              className="mx-auto h-[4.5rem] w-[4.5rem] md:h-[6rem] md:w-[6rem]"
            />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-zinc-400">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8"
        >
          {showVerifyBanner ? (
            <div className="mb-6 rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/10 p-4 text-sm text-lime-100">
              Confirm your account via the email we sent, then sign in. Check spam if you don’t see it.
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#22c55e] focus:ring-[#22c55e]/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-[#22c55e] focus:ring-[#22c55e]/20"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Link href="#" className="text-sm text-[#22c55e] hover:text-[#22c55e]/80">
                Forgot password?
              </Link>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-[#22c55e] hover:text-[#22c55e] transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#22c55e] hover:text-[#22c55e] transition-colors">
                Privacy Policy
              </Link>
              .
            </p>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full h-12 rounded-xl text-base font-medium"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {errorMessage ? <p className="mt-4 text-sm text-red-400">{errorMessage}</p> : null}

          <div className="mt-6 text-center">
            <p className="text-zinc-400">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#22c55e] hover:text-[#22c55e]/80 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>

          {/* Social Login */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-zinc-500">Or continue with</span>
              </div>
            </div>
            <div className="mt-6">
              <Button
                size="lg"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                type="button"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-base font-semibold text-black shadow-[0_6px_18px_rgba(0,0,0,0.15)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[#22c55e]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black disabled:translate-y-0 disabled:opacity-60"
              >
                <Image src="/logos/google.png" alt="Google" width={20} height={20} className="h-5 w-5" />
                Continue with Google
              </Button>
            </div>
          </motion.div>
      </motion.div>
    </div>
  )
}
