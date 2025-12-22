import { cookies } from "next/headers"

import { apiResponse } from "@/lib/api-response"
import { getRequiredEnv } from "@/lib/env"
import { EMAIL_PROVIDER_ERROR_MESSAGE, normalizeEmail, validateEmailProvider } from "@/lib/signup-credits"
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseClient"

const SUPABASE_URL = getRequiredEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"])
const SUPABASE_ANON_KEY = getRequiredEnv(["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type ProfileRow = {
  credits: number | null
  is_pro: boolean | null
  is_studio: boolean | null
  plan: string | null
}

let adminClient: ReturnType<typeof getSupabaseAdminClient> | null = null
if (SUPABASE_SERVICE_ROLE_KEY) {
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.warn("[auth] create-profile admin client init failed", error)
  }
}

const buildProfilePayload = (row: ProfileRow | null, fallbackCredits: number) => ({
  credits: typeof row?.credits === "number" ? row.credits : fallbackCredits,
  plan: row?.plan ?? "free",
  isPro: Boolean(row?.is_pro),
  isStudio: Boolean(row?.is_studio),
})

const unauthorized = () => apiResponse({ success: false, error: "Unauthorized" }, { status: 401 })

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[auth] create-profile missing Supabase configuration")
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
      console.warn("[auth] create-profile rejected unauthorized request", userError)
      return unauthorized()
    }

    if (!user.email) {
      return apiResponse(
        {
          success: false,
          error: "INVALID_EMAIL",
          message: "Valid email required to initialize your profile.",
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
          message: "Valid email required to initialize your profile.",
        },
        { status: 400 },
      )
    }

    if (!validateEmailProvider(normalizedEmail)) {
      return apiResponse(
        {
          success: false,
          error: "UNSUPPORTED_EMAIL_PROVIDER",
          message: EMAIL_PROVIDER_ERROR_MESSAGE,
        },
        { status: 400 },
      )
    }

    const profileClient = adminClient ?? supabase
    const { data: existingProfile, error: lookupError } = await profileClient
      .from("profiles")
      .select<ProfileRow>("credits, is_pro, is_studio, plan")
      .eq("id", user.id)
      .maybeSingle()

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("[auth] create-profile lookup failed", lookupError)
      return apiResponse({ success: false, error: "PROFILE_LOOKUP_FAILED" }, { status: 500 })
    }

    if (existingProfile) {
      return apiResponse({
        success: true,
        ...buildProfilePayload(existingProfile, 0),
      })
    }

    const defaultProfile = {
      id: user.id,
      credits: 0,
      plan: "free",
      is_pro: false,
      is_studio: false,
    }

    const { data: createdProfile, error: insertError } = await profileClient
      .from("profiles")
      .insert(defaultProfile)
      .select<ProfileRow>("credits, is_pro, is_studio, plan")
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: profileAfterConflict } = await profileClient
          .from("profiles")
          .select<ProfileRow>("credits, is_pro, is_studio, plan")
          .eq("id", user.id)
          .maybeSingle()

        if (profileAfterConflict) {
          return apiResponse({
            success: true,
            ...buildProfilePayload(profileAfterConflict, 0),
          })
        }
      }

      console.error("[auth] failed to create profile", insertError)
      return apiResponse({ success: false, error: "PROFILE_INIT_FAILED" }, { status: 500 })
    }

    return apiResponse({
      success: true,
      ...buildProfilePayload(createdProfile ?? null, 0),
    })
  } catch (error) {
    console.error("[ERROR] create-profile route failure:", error)
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
