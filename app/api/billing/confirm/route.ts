import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

const PLAN_CONFIG: Record<
  string,
  {
    credits: number
    pro: boolean
  }
> = {
  pro: {
    credits: 30,
    pro: true,
  },
  studio: {
    credits: 150,
    pro: true,
  },
}

const adminClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[billing] confirm missing Supabase env")
    return NextResponse.json({ error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
  }

  if (!STRIPE_SECRET_KEY) {
    console.error("[billing] confirm missing Stripe secret key")
    return NextResponse.json({ error: "Checkout confirmation unavailable." }, { status: 503 })
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
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 })
  }

  const plan = PLAN_CONFIG[planId]
  if (!plan) {
    return NextResponse.json({ error: "Unsupported plan." }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    console.warn("[billing] confirm requires authenticated session")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const paymentStatus: string = sessionInfo.payment_status
    if (paymentStatus !== "paid") {
      return NextResponse.json({ error: "Payment not completed yet." }, { status: 409 })
    }

    const metadata = sessionInfo.metadata ?? {}
    const metadataUserId = typeof metadata.user_id === "string" ? metadata.user_id : null
    const metadataPlanId = typeof metadata.plan_id === "string" ? metadata.plan_id : null

    if (!metadataUserId || metadataUserId !== session.user.id) {
      console.error("[billing] metadata user mismatch during confirmation", {
        metadataUserId,
        sessionUserId: session.user.id,
      })
      return NextResponse.json({ error: "Unable to validate checkout owner." }, { status: 403 })
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
      })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("[billing] failed to update profile after checkout", updateError)
      return NextResponse.json({ error: "Failed to activate plan." }, { status: 500 })
    }

    return NextResponse.json({ success: true, credits: plan.credits, plan: planId })
  } catch (error) {
    console.error("[billing] checkout confirmation error", error)
    return NextResponse.json({ error: "Unexpected error confirming checkout." }, { status: 502 })
  }
}
