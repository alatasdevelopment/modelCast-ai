import { cookies } from "next/headers"

import { getSupabaseServerClient } from "@/lib/supabaseClient"
import { apiResponse } from "@/lib/api-response"

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
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[billing] missing Supabase configuration for checkout")
      return apiResponse({ error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
    }

    const cookieStore = await cookies()
    let accessToken =
      cookieStore.get("sb-access-token")?.value ??
      cookieStore.get("supabase-auth-token")?.value ??
      null

    if (!accessToken) {
      const authHeader = request.headers.get("Authorization")
      if (authHeader?.startsWith("Bearer ")) {
        accessToken = authHeader.slice("Bearer ".length)
      }
    }

    if (!accessToken) {
      console.warn("[billing] checkout missing access token")
      return apiResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(request, accessToken)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.warn("[billing] checkout requires authentication", userError)
      return apiResponse({ error: "Unauthorized" }, { status: 401 })
    }

    if (!STRIPE_SECRET_KEY) {
      console.error("[billing] Stripe secret key not configured")
      return apiResponse({ error: "Checkout unavailable. Contact support." }, { status: 503 })
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
      return apiResponse({ error: "Invalid plan selection." }, { status: 400 })
    }

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
        return apiResponse({ error: errorMessage }, { status: 502 })
      }

      return apiResponse({ url: result.url })
    } catch (error) {
      console.error("[billing] unexpected stripe checkout failure", error)
      return apiResponse({ error: "Unexpected error initiating checkout." }, { status: 502 })
    }
  } catch (error) {
    console.error("[ERROR] Billing checkout failure:", error)
    return apiResponse({ error: "Unexpected server error." }, { status: 500 })
  }
}
