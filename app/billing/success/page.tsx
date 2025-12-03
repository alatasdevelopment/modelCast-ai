"use client"

import { useEffect } from "react"
import { CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BillingSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard")
    }, 2500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050505] via-[#080808] to-[#0b0b0b] px-4 py-16 text-white">
      <Card className="w-full max-w-md border border-white/10 bg-black/70 px-8 py-12 text-center shadow-[0_0_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#9FFF57]/30 bg-[#9FFF57]/10">
          <CheckCircle2 className="h-8 w-8 text-[#9FFF57]" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-[0.12em] text-white">Payment successful</h1>
        <p className="mt-3 text-sm text-neutral-300">Your new credits are on the way. Redirecting you to the dashboard…</p>

        <Button
          type="button"
          className="mt-8 w-full rounded-xl bg-[#9FFF57] text-black hover:bg-[#9FFF57]/90"
          onClick={() => router.replace("/dashboard")}
        >
          Go to dashboard now
        </Button>
      </Card>
    </div>
  )
}
