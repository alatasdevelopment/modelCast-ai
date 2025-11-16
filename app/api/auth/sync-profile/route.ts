import { cookies } from "next/headers"

import { apiResponse } from "@/lib/api-response"
import { determineStartingCredits, normalizeEmail } from "@/lib/signup-credits"
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

const unauthorized = () => apiResponse({ success: false, error: "Unauthorized" }, { status: 401 })

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[auth] sync-profile missing Supabase configuration")
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

    if (!user.email) {
      return apiResponse(
        {
          success: false,
          error: "INVALID_EMAIL",
          message: "Valid email required to sync your profile.",
        },
        { status: 400 },
      )
    }

    let normalizedEmail: string
    try {
      normalizedEmail = normalizeEmail(user.email)
    } catch {
      return apiResponse(
        {
          success: false,
          error: "INVALID_EMAIL",
          message: "Valid email required to sync your profile.",
        },
        { status: 400 },
      )
    }

    const profileClient = adminClient ?? supabase
    let credits: number
    try {
      credits = await determineStartingCredits({
        supabase: profileClient,
        normalizedEmail,
      })
    } catch (error) {
      console.error("[auth] sync-profile credit lookup failed", error)
      return apiResponse({ success: false, error: "EMAIL_CREDIT_LOOKUP_FAILED" }, { status: 500 })
    }

    const { data: existingProfile, error: profileLookupError } = await profileClient
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileLookupError && profileLookupError.code !== "PGRST116") {
      console.error("[auth] sync-profile profile lookup failed", profileLookupError)
      return apiResponse({ success: false, error: "PROFILE_SYNC_FAILED" }, { status: 500 })
    }

    if (existingProfile) {
      const { error: updateError } = await profileClient.from("profiles").update({ credits }).eq("id", user.id)
      if (updateError) {
        console.error("[auth] sync-profile profile update failed", updateError)
        return apiResponse({ success: false, error: "PROFILE_SYNC_FAILED" }, { status: 500 })
      }
    } else {
      const defaultProfile = {
        id: user.id,
        credits,
        plan: "free",
        is_pro: false,
        is_studio: false,
      }

      const { error: insertError } = await profileClient.from("profiles").insert(defaultProfile)
      if (insertError) {
        if (insertError.code === "23505") {
          const { error: conflictUpdateError } = await profileClient
            .from("profiles")
            .update({ credits })
            .eq("id", user.id)

          if (conflictUpdateError) {
            console.error("[auth] sync-profile conflict update failed", conflictUpdateError)
            return apiResponse({ success: false, error: "PROFILE_SYNC_FAILED" }, { status: 500 })
          }
        } else {
          console.error("[auth] sync-profile profile create failed", insertError)
          return apiResponse({ success: false, error: "PROFILE_SYNC_FAILED" }, { status: 500 })
        }
      }
    }

    return apiResponse({ success: true, credits })
  } catch (error) {
    console.error("[ERROR] sync-profile route failure:", error)
    return apiResponse({ success: false, error: "UNEXPECTED_ERROR" }, { status: 500 })
  }
}

export function GET() {
  return apiResponse({ success: false, error: "Method Not Allowed" }, { status: 405 })
}

export function PUT() {
  return apiResponse({ success: false, error: "Method Not Allowed" }, { status: 405 })
}

export function DELETE() {
  return apiResponse({ success: false, error: "Method Not Allowed" }, { status: 405 })
}
