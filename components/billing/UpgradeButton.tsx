"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabaseClient"

type UpgradeButtonProps = {
  priceId: string
  label?: string
}

export function UpgradeButton({ priceId, label = "Upgrade now" }: UpgradeButtonProps) {
  const router = useRouter()
  const { user, isLoading } = useSupabaseAuth()
  const { toast } = useToast()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (isLoading || isProcessing) return

    if (!user) {
      router.push(`/login?intent=checkout&priceId=${encodeURIComponent(priceId)}`)
      return
    }

    setIsProcessing(true)
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error("Session expired. Please sign in again.")
      }

      const baseUrl = window.location.origin
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${baseUrl}/billing/success`,
          cancelUrl: `${baseUrl}/billing/cancel`,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null

      if (!response.ok || !payload?.url) {
        const message = payload?.error ?? "Unable to start checkout."
        throw new Error(message)
      }

      window.location.href = payload.url
    } catch (error) {
      console.error("[billing] upgrade checkout failed", error)
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Unexpected error. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <Button
      type="button"
      className="mt-8 w-full rounded-xl bg-lime-400/90 py-3 text-base font-semibold text-black transition hover:bg-lime-300 disabled:opacity-60"
      disabled={isProcessing || isLoading}
      onClick={() => void handleCheckout()}
    >
      {isProcessing ? "Redirecting…" : label}
    </Button>
  )
}
