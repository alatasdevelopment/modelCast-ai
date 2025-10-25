"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"

import { Logo } from "@/components/logo"
import { toast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabaseClient = useMemo(() => getSupabaseClient(), [])

  useEffect(() => {
    const handleAuth = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (session) {
        router.push("/dashboard")
        return
      }

      const currentUrl = window.location.href
      const hasCode = currentUrl.includes("code=")

      if (!hasCode) {
        router.push("/dashboard")
        return
      }

      const { error } = await supabaseClient.auth.exchangeCodeForSession(currentUrl)
      if (error) {
        if (!/code .* verifier/i.test(error.message)) {
          console.error("Auth callback error:", error.message)
          toast({
            title: "Sign-in failed",
            description: error.message,
          })
        }
        router.push("/login")
        return
      }

      toast({
        title: "Welcome back",
      })
      router.push("/dashboard")
    }

    handleAuth()
  }, [router, supabaseClient])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white">
      <Logo className="h-32 w-32" />
      <p className="text-sm text-zinc-400">Signing you in...</p>
    </div>
  )
}
