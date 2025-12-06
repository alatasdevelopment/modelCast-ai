import { cookies } from "next/headers"

import { apiResponse } from "@/lib/api-response"
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseClient"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[billing] grant-free missing Supabase configuration")
      return apiResponse({ success: false, error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
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
      return apiResponse({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseServerClient(request, accessToken)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      console.warn("[billing] grant-free requires authentication", userError)
      return apiResponse({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Use admin client for reliable profile lookup/update to avoid RLS edge cases during billing ops
    let adminClient
    try {
      adminClient = getSupabaseAdminClient()
    } catch (error) {
      console.error("[billing] grant-free admin client init failed", error)
      return apiResponse({ success: false, error: "SERVER_ERROR" }, { status: 500 })
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("credits, is_pro, plan")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) {
      console.error("[billing] failed to load profile", profileError)
      return apiResponse({ success: false, error: "PROFILE_LOOKUP_FAILED" }, { status: 500 })
    }

    if (!profile) {
      return apiResponse({ success: false, error: "PROFILE_NOT_FOUND" }, { status: 404 })
    }

    if (profile.is_pro) {
      return apiResponse(
        { success: false, error: "Pro members already have unlimited access." },
        { status: 400 },
      )
    }

    const currentCredits = typeof profile.credits === "number" ? profile.credits : 0
    
    // Strict check: Only grant if strictly less than 2
    if (currentCredits >= 2) {
      return apiResponse({ success: true, credits: currentCredits })
    }

    const targetCredits = 2
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({ credits: targetCredits, plan: "free" }) // Ensure plan stays/becomes free
      .eq("id", userId)
      .select("credits")
      .maybeSingle()

    if (updateError) {
      console.error("[billing] failed to grant free credits", updateError)
      return apiResponse({ success: false, error: "FAILED_TO_GRANT_CREDITS" }, { status: 500 })
    }

    return apiResponse({
      success: true,
      credits: updatedProfile?.credits ?? targetCredits,
    })
  } catch (error) {
    console.error("[ERROR] grant-free route failure:", error)
    return apiResponse({ success: false, error: "Unexpected server error." }, { status: 500 })
  }
}
