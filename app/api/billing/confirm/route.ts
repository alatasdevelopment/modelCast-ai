import { cookies } from "next/headers"

import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseClient"
import { apiResponse } from "@/lib/api-response"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

const PLAN_CONFIG: Record<
  string,
  {
    credits: number
    pro: boolean
    plan: string
    isStudio: boolean
  }
> = {
  pro: {
    credits: 30,
    pro: true,
    plan: "pro",
    isStudio: false,
  },
  studio: {
    credits: 150,
    pro: true,
    plan: "studio",
    isStudio: true,
  },
}

let adminClient: ReturnType<typeof getSupabaseAdminClient> | null = null
if (SUPABASE_SERVICE_ROLE_KEY) {
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.warn("[billing] unable to initialize admin client", error)
  }
}

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[billing] confirm missing Supabase env")
      return apiResponse({ error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
    }

    if (!STRIPE_SECRET_KEY) {
      console.error("[billing] confirm missing Stripe secret key")
      return apiResponse({ error: "Checkout confirmation unavailable." }, { status: 503 })
    }

    let payload: { sessionId?: string; planId?: string } | null = null
    try {
      payload = (await request.json()) as { sessionId?: string; planId?: string }
    } catch {
      payload = null
    }

    const sessionId = payload?.sessionId?.trim()
    const planId = payload?.planId?.trim()

    if (!sessionId || !planId) {
      return apiResponse({ error: "Missing checkout details." }, { status: 400 })
    }

    const plan = PLAN_CONFIG[planId]
    if (!plan) {
      return apiResponse({ error: "Unsupported plan." }, { status: 400 })
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
      console.warn("[billing] confirm missing access token")
      return apiResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(request, accessToken)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.warn("[billing] confirm requires authenticated session", userError)
      return apiResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    })

    const sessionInfo = await stripeResponse.json()
    if (!stripeResponse.ok) {
      const message =
        typeof sessionInfo?.error?.message === "string" ? sessionInfo.error.message : "Unable to verify payment."
      return apiResponse({ error: message }, { status: 502 })
    }

    const paymentStatus: string = sessionInfo.payment_status
    if (paymentStatus !== "paid") {
      return apiResponse({ error: "Payment not completed yet." }, { status: 409 })
    }

    const metadata = sessionInfo.metadata ?? {}
    const metadataUserId = typeof metadata.user_id === "string" ? metadata.user_id : null
    const metadataPlanId = typeof metadata.plan_id === "string" ? metadata.plan_id : null

    if (!metadataUserId || metadataUserId !== user.id) {
      console.error("[billing] metadata user mismatch during confirmation", {
        metadataUserId,
        sessionUserId: user.id,
      })
      return apiResponse({ error: "Unable to validate checkout owner." }, { status: 403 })
    }

    if (!metadataPlanId || metadataPlanId !== planId) {
      console.warn("[billing] metadata plan mismatch", { metadataPlanId, planId })
    }

    const client = adminClient ?? supabase
    const { error: updateError } = await client
      .from("profiles")
      .update({
        credits: plan.credits,
        is_pro: plan.pro,
        is_studio: plan.isStudio,
        plan: plan.plan,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[billing] failed to update profile after checkout", updateError)
      return apiResponse({ error: "Failed to activate plan." }, { status: 500 })
    }

    return apiResponse({ success: true, credits: plan.credits, plan: planId })
  } catch (error) {
    console.error("[ERROR] Billing confirmation failure:", error)
    return apiResponse({ error: "Unexpected error confirming checkout." }, { status: 502 })
  }
}
