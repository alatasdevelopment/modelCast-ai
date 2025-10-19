import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PRICE_PRO_ID = process.env.STRIPE_PRICE_PRO_ID
const STRIPE_PRICE_STUDIO_ID = process.env.STRIPE_PRICE_STUDIO_ID
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

const PLAN_CONFIG: Record<
  string,
  {
    priceId: string | undefined
    credits: number
  }
> = {
  pro: {
    priceId: STRIPE_PRICE_PRO_ID,
    credits: 30,
  },
  studio: {
    priceId: STRIPE_PRICE_STUDIO_ID,
    credits: 150,
  },
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[billing] missing Supabase configuration for checkout")
    return NextResponse.json({ error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    console.warn("[billing] checkout requires authentication", sessionError)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!STRIPE_SECRET_KEY) {
    console.error("[billing] Stripe secret key not configured")
    return NextResponse.json({ error: "Checkout unavailable. Contact support." }, { status: 503 })
  }

  let payload: { planId?: string } | null = null
  try {
    payload = (await request.json()) as { planId?: string }
  } catch {
    payload = null
  }

  const planId = payload?.planId ?? ""
  const plan = PLAN_CONFIG[planId]

  if (!plan || !plan.priceId) {
    return NextResponse.json({ error: "Invalid plan selection." }, { status: 400 })
  }

  const user = session.user
  const successUrl = `${PUBLIC_SITE_URL.replace(/\/$/, "")}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`
  const cancelUrl = `${PUBLIC_SITE_URL.replace(/\/$/, "")}/?checkout=cancelled`

  const params = new URLSearchParams()
  params.set("mode", "payment")
  params.append("payment_method_types[]", "card")
  params.set("success_url", successUrl)
  params.set("cancel_url", cancelUrl)
  params.append("line_items[0][price]", plan.priceId)
  params.append("line_items[0][quantity]", "1")
  params.set("customer_email", user.email ?? "")
  params.set("allow_promotion_codes", "true")
  params.set("metadata[user_id]", user.id)
  params.set("metadata[plan_id]", planId)
  params.set("metadata[credits]", String(plan.credits))

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    const result = await stripeResponse.json()
    if (!stripeResponse.ok) {
      const errorMessage =
        typeof result?.error?.message === "string" ? result.error.message : "Unable to initiate checkout."
      console.error("[billing] Stripe checkout error", errorMessage)
      return NextResponse.json({ error: errorMessage }, { status: 502 })
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error("[billing] unexpected stripe checkout failure", error)
    return NextResponse.json({ error: "Unexpected error initiating checkout." }, { status: 502 })
  }
}
