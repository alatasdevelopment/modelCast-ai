"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

type ConfirmationState = "idle" | "processing" | "success" | "error"

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<ConfirmationState>("idle")
  const [message, setMessage] = useState<string>("Validating your upgrade…")

  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams])
  const planId = useMemo(() => searchParams.get("plan"), [searchParams])

  useEffect(() => {
    if (!sessionId || !planId) {
      setStatus("error")
      setMessage("Missing Stripe checkout details. Please contact support if you were charged.")
      return
    }

    const confirmCheckout = async () => {
      setStatus("processing")
      try {
        const response = await fetch("/api/billing/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId, planId }),
        })

        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; error?: string; credits?: number }
          | null

        if (!response.ok || !payload?.success) {
          const errorMessage =
            payload?.error ?? "We could not verify your payment. Please reach out to support for help."
          throw new Error(errorMessage)
        }

        setStatus("success")
        setMessage("Plan activated! Redirecting you to your dashboard…")
        toast({
          title: "Upgrade complete",
          description: "Your new credits are ready inside ModelCast.",
        })

        setTimeout(() => {
          router.replace("/dashboard")
        }, 2200)
      } catch (error) {
        console.error("[billing] checkout confirmation failed", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Something went wrong confirming your payment.")
      }
    }

    void confirmCheckout()
  }, [planId, router, sessionId, toast])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050505] via-[#080808] to-[#0b0b0b] px-4 py-16 text-white">
      <Card className="w-full max-w-md border border-white/10 bg-black/70 px-8 py-10 text-center shadow-[0_0_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#9FFF57]/30 bg-[#9FFF57]/10">
          <Sparkles className="h-7 w-7 text-[#9FFF57]" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-[0.12em] text-white">Processing Upgrade</h1>
        <p className="mt-3 text-sm text-neutral-300">{message}</p>

        {status === "processing" ? (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#9FFF57]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Confirming with Stripe…
          </div>
        ) : null}

        {status === "success" ? (
          <Button
            type="button"
            className="mt-8 w-full rounded-xl bg-[#9FFF57] text-black hover:bg-[#9FFF57]/90"
            onClick={() => router.replace("/dashboard")}
          >
            Go to dashboard now
          </Button>
        ) : null}

        {status === "error" ? (
          <div className="mt-8 space-y-4">
            <p className="text-xs text-neutral-400">
              If you believe this is a mistake, contact support with your payment receipt and we&apos;ll help right
              away.
            </p>
            <Button
              variant="outline"
              className="w-full border-white/20 text-white hover:border-[#9FFF57] hover:text-[#9FFF57]"
              onClick={() => router.replace("/#pricing")}
            >
              Back to pricing
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
