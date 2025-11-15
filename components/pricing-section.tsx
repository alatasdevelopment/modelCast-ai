"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"

import { useSupabaseAuth } from "@/components/auth/supabase-auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabaseClient"

type PlanTier = 'free' | 'pro' | 'studio'

type PricingPlan = {
  id: PlanTier
  name: string
  price: number
  oldPrice: number | null
  period?: string
  subtitle: string
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
    period: undefined,
    subtitle: 'Get started with 2 free credits — explore ModelCast with no commitment.',
    features: ['2 free credits', 'Standard HD outputs', 'Access to all style options', 'Try-on demo included'],
    cta: 'Start Free',
    credits: 2,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 14,
    oldPrice: 19,
    period: '/month',
    subtitle: 'Perfect for creators and small brands looking for consistent high-quality results.',
    features: [
      '30 credits / month',
      'Full HD resolution',
      'Dual upload (try-on)',
      'Commercial license',
      'Priority generation',
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
    period: '/month',
    subtitle: 'For studios and e-commerce teams producing large volumes of content.',
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

const planButtonStyles: Record<
  PlanTier,
  {
    variant: "outline" | "ghost" | "lime"
    className: string
  }
> = {
  free: {
    variant: "outline",
    className: "border-lime-400/50 text-lime-400 hover:bg-lime-400/10",
  },
  pro: {
    variant: "lime",
    className:
      "shadow-[0_0_15px_rgba(163,255,88,0.25)] hover:shadow-[0_0_25px_rgba(163,255,88,0.35)] transition",
  },
  studio: {
    variant: "ghost",
    className: "border border-neutral-700 bg-black/40 text-white hover:border-lime-400/30 hover:text-lime-200",
  },
}

export function PricingSection() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading } = useSupabaseAuth()
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null)
  const supabaseClient = useMemo(() => getSupabaseClient(), [])

  const handlePlanSelect = useCallback(
    async (plan: PricingPlan) => {
      if (isLoading) {
        return
      }

      if (plan.id === 'free') {
        router.push('/login')
        return
      }

      if (!user) {
        router.push(`/login?plan=${encodeURIComponent(plan.id)}`)
        return
      }

      setLoadingPlan(plan.id)
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session?.access_token) {
          throw new Error('Your session expired. Please sign in again.')
        }

        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planId: plan.id }),
        })

        const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null

        if (!response.ok || !payload?.url) {
          const message = payload?.error ?? 'Checkout session could not be created.'
          throw new Error(message)
        }

        window.location.href = payload.url
      } catch (error) {
        console.error('[pricing] checkout initiation failed', error)
        toast({
          title: 'Checkout failed',
          description: error instanceof Error ? error.message : 'Unable to reach Stripe checkout.',
          variant: 'destructive',
        })
        setLoadingPlan(null)
      }
    },
    [isLoading, router, supabaseClient, toast, user],
  )

  const handleAddOnCredits = useCallback(() => {
    if (isLoading) {
      return
    }
    if (user) {
      router.push('/dashboard?dialog=credits')
    } else {
      router.push('/login?intent=credits')
    }
  }, [isLoading, router, user])

  return (
    <section id="pricing" role="region" aria-labelledby="pricing-heading" className="relative py-24 bg-black text-center">
      <div className="mx-auto max-w-5xl px-4">
        <p className="text-xs uppercase tracking-widest text-lime-400/70 mb-3">Simple, flexible pricing</p>
        <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold text-white mb-4">Credits that scale with you</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-12">
          Choose a plan that fits your workflow. Your credits unlock every generation — pay only for what you use.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 text-left">
          {pricingPlans.map((plan, index) => {
            const formattedPrice = plan.price === 0 ? "$0" : `$${plan.price}`
            const isLoadingPlan = loadingPlan === plan.id
            const buttonStyle = planButtonStyles[plan.id]

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card
                  className={cn(
                    "relative flex h-full flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-lime-400/20 hover:bg-neutral-900/70",
                    plan.highlight && "border-lime-400/40 ring-1 ring-lime-400/20 bg-neutral-900/60",
                    "gap-0",
                  )}
                >
                  {plan.highlight && plan.badge ? (
                    <Badge className="pointer-events-none mb-4 inline-flex items-center justify-center rounded-full border border-lime-400/30 bg-black/60 px-3 py-1 text-xs font-semibold text-lime-300 shadow-[0_0_18px_rgba(163,255,88,0.15)] mx-auto md:mx-0">
                      {plan.badge}
                    </Badge>
                  ) : null}

                  <div>
                    <h3 className="mb-1 text-xl font-semibold tracking-tight text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-3">
                      {plan.oldPrice ? (
                        <span className="text-lg text-gray-600 line-through">${plan.oldPrice}</span>
                      ) : null}
                      <span className="text-4xl font-bold text-lime-400">{formattedPrice}</span>
                      {plan.period ? <span className="text-sm text-neutral-500">{plan.period}</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-neutral-400">{plan.subtitle}</p>
                    <p className="mt-1 text-xs text-gray-500">Early access discount</p>
                    <ul className="mt-5 space-y-3 text-sm text-gray-300">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 flex-shrink-0 text-lime-300" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={buttonStyle.variant}
                    className={cn(
                      "mt-8 w-full rounded-xl py-3 text-base font-semibold transition-all duration-200",
                      buttonStyle.className,
                    )}
                    disabled={isLoading || isLoadingPlan}
                    onClick={() => handlePlanSelect(plan)}
                    aria-label={`Select the ${plan.name} plan`}
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

        <div className="mt-12 flex flex-col items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 px-6 py-5 text-center text-sm text-white/70 md:flex-row md:justify-center md:text-left">
          <span className="font-semibold text-white">Need more credits mid-cycle?</span>
          <span className="text-gray-400">Add-on credit packs are available from your dashboard at any time.</span>
          <Button
            variant="outline"
            className="border-lime-400/30 bg-black/40 text-xs font-semibold text-white hover:text-lime-300 hover:bg-black/60"
            onClick={handleAddOnCredits}
            disabled={isLoading}
            aria-label="Open add-on credits dialog"
          >
            Open add-on credits
          </Button>
        </div>
      </div>
    </section>
  )
}
