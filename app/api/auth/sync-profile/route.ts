import { cookies } from "next/headers"

import { apiResponse } from "@/lib/api-response"
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseClient"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof getSupabaseAdminClient> | null = null
if (SUPABASE_SERVICE_ROLE_KEY) {
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.warn("[auth] sync-profile admin client init failed", error)
  }
}

const DEFAULT_STARTING_CREDITS = 2
const unauthorized = () => apiResponse({ ok: false, error: "UNAUTHORIZED" }, { status: 401 })

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[auth] sync-profile missing Supabase configuration")
      return apiResponse({ ok: false, error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
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
      console.warn("[auth] sync-profile rejected unauthorized request", userError)
      return unauthorized()
    }

    const profileClient = adminClient ?? supabase
    const { data: profile, error: profileError } = await profileClient
      .from("profiles")
      .select("id, credits, plan, is_pro, is_studio")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[auth] sync-profile lookup failed", profileError)
      return apiResponse({ ok: false, error: "PROFILE_SYNC_FAILED" }, { status: 500 })
    }

    const resolvePlan = (input?: { plan?: string | null; is_pro?: boolean | null; is_studio?: boolean | null }) => {
      if (!input) return "free"
      const normalized = typeof input.plan === "string" ? input.plan.toLowerCase() : null
      if (input.is_studio || normalized === "studio") return "studio"
      if (input.is_pro || normalized === "pro") return "pro"
      return "free"
    }

    if (!profile) {
      const insertPayload = {
        id: user.id,
        credits: DEFAULT_STARTING_CREDITS,
        plan: "free",
        is_pro: false,
        is_studio: false,
      }

      const { data: insertedProfile, error: insertError } = await profileClient
        .from("profiles")
        .upsert(insertPayload, { onConflict: "id" })
        .select("credits, plan")
        .single()

      if (insertError) {
        console.error("[auth] sync-profile failed to initialize profile", insertError)
        return apiResponse({ ok: false, error: "PROFILE_SYNC_FAILED" }, { status: 500 })
      }

      const credits = typeof insertedProfile?.credits === "number" ? insertedProfile.credits : DEFAULT_STARTING_CREDITS
      const plan = typeof insertedProfile?.plan === "string" ? insertedProfile.plan : "free"

      return apiResponse({ ok: true, credits, plan })
    }

    const credits = Math.max(typeof profile.credits === "number" ? profile.credits : DEFAULT_STARTING_CREDITS, 0)
    const plan = resolvePlan(profile)

    return apiResponse({ ok: true, credits, plan })
  } catch (error) {
    console.error("[ERROR] sync-profile route failure:", error)
    return apiResponse({ ok: false, error: "UNEXPECTED_ERROR" }, { status: 500 })
  }
}

export function GET() {
  return apiResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 })
}

export function PUT() {
  return apiResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 })
}

export function DELETE() {
  return apiResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 })
}
