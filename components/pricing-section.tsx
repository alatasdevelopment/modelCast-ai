"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Loader2, Sparkles } from "lucide-react"

import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type PlanTier = 'free' | 'pro' | 'studio'

type PricingPlan = {
  id: PlanTier
  name: string
  price: number
  oldPrice: number | null
  subtitle: string
  discountNote?: string | null
  features: string[]
  cta: string
  highlight?: boolean
  credits: number
  badge?: string | null
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    oldPrice: null,
    subtitle: 'Kick off with 2 free credits and watermarked previews.',
    discountNote: null,
    features: ['2 free credits', 'Watermarked outputs', 'Single upload only', 'Standard resolution'],
    cta: 'Start Free',
    credits: 2,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 14,
    oldPrice: 19,
    subtitle: 'Perfect for creators and boutique brands.',
    discountNote: 'Early launch discount — 25% off for first adopters.',
    features: [
      '30 credits / month',
      'HD resolution with no watermark',
      'Dual upload (tryon-v1.6)',
      'Commercial license',
      'Priority queue',
    ],
    cta: 'Get Pro Pack',
    highlight: true,
    credits: 30,
    badge: 'Most Popular',
  },
  {
    id: 'studio',
    name: 'Studio Pack',
    price: 49,
    oldPrice: 69,
    subtitle: 'For studios and e-commerce teams.',
    discountNote: 'Early launch pricing — save $20 monthly.',
    features: [
      '150 credits / month',
      'Batch generation & API access',
      'All Pro features included',
      'White-label exports',
    ],
    cta: 'Upgrade to Studio',
    credits: 150,
  },
]

export function PricingSection() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading } = useSupabaseAuth()
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null)

  const handlePlanSelect = useCallback(
    async (plan: PricingPlan) => {
      if (isLoading) {
        return
      }

      if (plan.id === "free") {
        router.push("/auth/signin")
        return
      }

      if (!user) {
        router.push(`/auth/signin?plan=${encodeURIComponent(plan.id)}`)
        return
      }

      setLoadingPlan(plan.id)
      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId: plan.id }),
        })

        const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null

        if (!response.ok || !payload?.url) {
          const message = payload?.error ?? "Checkout session could not be created."
          throw new Error(message)
        }

        window.location.href = payload.url
      } catch (error) {
        console.error("[pricing] checkout initiation failed", error)
        toast({
          title: "Checkout failed",
          description: error instanceof Error ? error.message : "Unable to reach Stripe checkout.",
          variant: "destructive",
        })
        setLoadingPlan(null)
      }
    },
    [isLoading, router, toast, user],
  )

  const handleAddOnCredits = useCallback(() => {
    if (isLoading) {
      return
    }
    if (user) {
      router.push("/dashboard?dialog=credits")
    } else {
      router.push("/auth/signin?intent=credits")
    }
  }, [isLoading, router, user])

  return (
    <section id="pricing" className="relative py-24 px-4">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-[#9FFF57]" />
            <span className="text-sm font-medium text-white/80">Pricing</span>
          </motion.div>

          <h2 className="mb-4 text-4xl font-bold text-transparent md:text-5xl">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text">
              Credits that scale with you
            </span>
          </h2>

          <p className="mx-auto mb-2 max-w-2xl text-lg text-white/60">
            Choose a plan that fits your workflow. Your credits unlock every generation across ModelCast.
          </p>
          <p className="text-sm font-medium text-[#9FFF57]">
            Early access pricing — discounted for our first 1,000 users.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pricingPlans.map((plan, index) => {
            const formattedPrice = plan.price === 0 ? "$0" : `$${plan.price}`
            const isLoadingPlan = loadingPlan === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[#0b0b0b]/85 p-6 transition-all duration-300 hover:translate-y-[-6px] hover:border-white/20 hover:shadow-[0_0_25px_rgba(159,255,87,0.25)] md:hover:scale-[1.035]",
                    plan.highlight &&
                      "border-[#9FFF57]/70 shadow-[0_0_28px_-6px_rgba(159,255,87,0.3)] hover:border-[#9FFF57] hover:shadow-[0_0_32px_-4px_rgba(159,255,87,0.45)]",
                  )}
                >
                  {plan.highlight && plan.badge ? (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border border-[#9FFF57]/40 bg-[#121212]/80 text-[#9FFF57] shadow-[0_0_20px_rgba(159,255,87,0.2)]">
                      {plan.badge}
                    </Badge>
                  ) : null}

                  <div>
                    <h3 className="mb-2 text-xl font-semibold tracking-tight text-white">{plan.name}</h3>
                    <div className="flex items-baseline space-x-2">
                      {plan.oldPrice ? (
                        <>
                          <span className="text-sm text-neutral-500 line-through">${plan.oldPrice}</span>
                          <span className="text-3xl font-bold text-[#9FFF57]">{formattedPrice}</span>
                          <span className="text-sm text-muted-foreground">/month</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-white">{formattedPrice}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-neutral-400">{plan.subtitle}</p>
                    <p className="mt-1 text-xs italic text-neutral-500">
                      {plan.discountNote ?? "Early access pricing — discounted for our first 1,000 users."}
                    </p>
                    <ul className="mt-5 space-y-3 text-sm font-medium text-neutral-200">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 flex-shrink-0 text-[#9FFF57]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={cn(
                      "relative mt-6 w-full overflow-hidden rounded-xl border border-white/10 py-3 text-base font-semibold transition-all duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-[#9FFF57] after:transition-transform after:duration-200 hover:after:scale-x-100",
                      plan.highlight
                        ? "border-transparent bg-gradient-to-r from-[#9FFF57] to-[#CFFF8A] text-black shadow-[0_10px_24px_rgba(159,255,87,0.25)] hover:from-[#B4FF6E] hover:to-[#DFFF9F]"
                        : "bg-neutral-900 text-neutral-100 hover:bg-neutral-800",
                    )}
                    disabled={isLoading || isLoadingPlan}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    {isLoadingPlan ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center text-sm text-white/70 md:flex-row md:justify-center md:text-left">
          <span className="font-semibold text-white/85">Need more credits mid-cycle?</span>
          <span>Add-on credit packs are available from your dashboard at any time.</span>
          <Button
            variant="outline"
            className="border-white/20 bg-black/40 text-xs font-semibold text-white/80 hover:border-[#9FFF57] hover:text-[#9FFF57]"
            onClick={handleAddOnCredits}
            disabled={isLoading}
          >
            Open add-on credits
          </Button>
        </div>
      </div>
    </section>
  )
}
