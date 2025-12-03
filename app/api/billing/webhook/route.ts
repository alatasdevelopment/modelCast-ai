import type { NextRequest } from "next/server"
import Stripe from "stripe"

import { apiResponse } from "@/lib/api-response"
import { getSupabaseAdminClient } from "@/lib/supabaseClient"

export const runtime = "nodejs"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const PRO_PRICE_IDS = new Set(
  [process.env.STRIPE_PRICE_PRO, process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO].filter(Boolean) as string[],
)
const STUDIO_PRICE_IDS = new Set(
  [process.env.STRIPE_PRICE_STUDIO, process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO].filter(Boolean) as string[],
)

type PlanTier = "free" | "pro" | "studio"

type ProfileRow = {
  id: string
  credits: number | null
  plan: string | null
  is_pro: boolean | null
  is_studio: boolean | null
}

const planRank: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  studio: 2,
}

const resolvePlan = (profile?: ProfileRow | null): PlanTier => {
  if (!profile) return "free"
  const normalized = typeof profile.plan === "string" ? profile.plan.toLowerCase() : null
  if (profile.is_studio || normalized === "studio") return "studio"
  if (profile.is_pro || normalized === "pro") return "pro"
  return "free"
}

const higherPlan = (current: PlanTier, incoming: PlanTier): PlanTier => {
  return planRank[incoming] > planRank[current] ? incoming : current
}

const determineCreditsFromPrice = (priceId?: string | null): number => {
  if (!priceId) return 0
  if (PRO_PRICE_IDS.has(priceId)) return 30
  if (STUDIO_PRICE_IDS.has(priceId)) return 150
  return 0
}

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("[billing] webhook missing Stripe configuration")
    return apiResponse({ ok: false, error: "STRIPE_CONFIG_MISSING" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return apiResponse({ ok: false, error: "MISSING_SIGNATURE" }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error("[billing] invalid webhook signature", error)
    return apiResponse({ ok: false, error: "INVALID_SIGNATURE" }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return apiResponse({ ok: true })
  }

  const sessionObject = event.data.object as Stripe.Checkout.Session
  const sessionId = sessionObject.id

  if (!sessionId) {
    console.error("[billing] checkout session missing id", event.id)
    return apiResponse({ ok: false, error: "INVALID_SESSION" }, { status: 400 })
  }

  let checkoutSession: Stripe.Checkout.Session
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    })
  } catch (error) {
    console.error("[billing] failed to load checkout session", error)
    return apiResponse({ ok: false, error: "SESSION_LOOKUP_FAILED" }, { status: 500 })
  }

  const priceId = checkoutSession.line_items?.data?.[0]?.price?.id ?? null
  const creditsToAdd = determineCreditsFromPrice(priceId)

  if (creditsToAdd <= 0) {
    console.warn("[billing] unrecognized price for checkout", priceId)
    return apiResponse({ ok: true })
  }

  const metadataUserId = checkoutSession.metadata?.userId ?? sessionObject.metadata?.userId
  if (!metadataUserId) {
    console.error("[billing] missing user metadata on checkout session", sessionId)
    return apiResponse({ ok: false, error: "MISSING_USER" }, { status: 400 })
  }

  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.error("[billing] admin client unavailable", error)
    return apiResponse({ ok: false, error: "SUPABASE_ADMIN_ERROR" }, { status: 500 })
  }

  const { data: existingEvent, error: historyLookupError } = await adminClient
    .from("credit_history")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle()

  if (historyLookupError && historyLookupError.code !== "PGRST116") {
    console.error("[billing] failed to check credit history", historyLookupError)
    return apiResponse({ ok: false, error: "HISTORY_LOOKUP_FAILED" }, { status: 500 })
  }

  if (existingEvent) {
    return apiResponse({ ok: true })
  }

  const purchasedPlan: PlanTier = creditsToAdd === 150 ? "studio" : "pro"

  const historyRecord = {
    event_id: event.id,
    user_id: metadataUserId,
    credits_added: creditsToAdd,
    plan: purchasedPlan,
  }

  const { error: historyInsertError } = await adminClient.from("credit_history").insert(historyRecord)

  if (historyInsertError) {
    if (historyInsertError.code === "23505") {
      return apiResponse({ ok: true })
    }
    console.error("[billing] failed to record credit history", historyInsertError)
    return apiResponse({ ok: false, error: "HISTORY_INSERT_FAILED" }, { status: 500 })
  }

  const cleanupHistoryRecord = async () => {
    await adminClient.from("credit_history").delete().eq("event_id", event.id)
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select<ProfileRow>("id, credits, plan, is_pro, is_studio")
    .eq("id", metadataUserId)
    .maybeSingle()

  if (profileError && profileError.code !== "PGRST116") {
    console.error("[billing] failed to load profile during webhook", profileError)
    await cleanupHistoryRecord()
    return apiResponse({ ok: false, error: "PROFILE_LOOKUP_FAILED" }, { status: 500 })
  }

  const nextPlan = higherPlan(resolvePlan(profile), purchasedPlan)

  const profilePayload = {
    plan: nextPlan,
    is_pro: nextPlan !== "free",
    is_studio: nextPlan === "studio",
  }

  try {
    if (!profile) {
      const startingCredits = 2 + creditsToAdd
      const insertPayload = {
        id: metadataUserId,
        credits: startingCredits,
        ...profilePayload,
      }

      const { error: insertError } = await adminClient.from("profiles").insert(insertPayload)

      if (insertError) {
        throw insertError
      }
    } else {
      const currentCredits = typeof profile.credits === "number" ? profile.credits : 0
      const updatedCredits = currentCredits + creditsToAdd

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ credits: updatedCredits, ...profilePayload })
        .eq("id", metadataUserId)

      if (updateError) {
        throw updateError
      }
    }
  } catch (error) {
    console.error("[billing] failed to apply credits", error)
    await cleanupHistoryRecord()
    return apiResponse({ ok: false, error: "PROFILE_UPDATE_FAILED" }, { status: 500 })
  }

  return apiResponse({ ok: true })
}
