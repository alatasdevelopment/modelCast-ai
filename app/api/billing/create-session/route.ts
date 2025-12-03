import { cookies } from "next/headers"
import Stripe from "stripe"

import { apiResponse } from "@/lib/api-response"
import { getSupabaseServerClient } from "@/lib/supabaseClient"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

const unauthorized = () => apiResponse({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

export async function POST(request: Request) {
  try {
    if (!STRIPE_SECRET_KEY) {
      console.error("[billing] STRIPE_SECRET_KEY missing")
      return apiResponse({ ok: false, error: "BILLING_DISABLED" }, { status: 503 })
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
      return unauthorized()
    }

    const supabase = getSupabaseServerClient(request, accessToken)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.warn("[billing] create-session missing user", userError)
      return unauthorized()
    }

    let payload: { priceId?: string } | null = null
    try {
      payload = (await request.json()) as { priceId?: string }
    } catch {
      payload = null
    }

    const priceId = payload?.priceId?.trim()

    if (!priceId) {
      return apiResponse({ ok: false, error: "MISSING_PRICE" }, { status: 400 })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
      },
      success_url: `${SITE_URL}/billing/success`,
      cancel_url: `${SITE_URL}/billing/cancel`,
    })

    if (!session.url) {
      console.error("[billing] missing checkout session url", session.id)
      return apiResponse({ ok: false, error: "SESSION_INIT_FAILED" }, { status: 502 })
    }

    return apiResponse({ ok: true, url: session.url })
  } catch (error) {
    console.error("[billing] create-session unknown failure", error)
    return apiResponse({ ok: false, error: "SESSION_INIT_FAILED" }, { status: 500 })
  }
}
