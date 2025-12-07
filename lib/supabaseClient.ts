import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js"

function requireEnvVar(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message)
  }

  return value
}

const SUPABASE_URL = requireEnvVar(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "Missing NEXT_PUBLIC_SUPABASE_URL environment variable.",
)
const SUPABASE_ANON_KEY = requireEnvVar(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.",
)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (
  SUPABASE_URL.includes("<") ||
  SUPABASE_ANON_KEY.includes("<") ||
  SUPABASE_URL.trim().length === 0 ||
  SUPABASE_ANON_KEY.trim().length === 0
) {
  throw new Error(
    "Supabase environment variables are placeholders. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with real project credentials.",
  )
}

type SupabaseGlobal = typeof globalThis & {
  __supabaseClient?: SupabaseClient
}

const supabaseGlobal = globalThis as SupabaseGlobal

export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  if (!supabaseGlobal.__supabaseClient) {
    supabaseGlobal.__supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return supabaseGlobal.__supabaseClient
}

// Server-side client (API routes / middleware)
export function getSupabaseServerClient(req?: Request, accessToken?: string | null): SupabaseClient {
  const headers: Record<string, string> = {}

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  } else if (req) {
    const authHeader = req?.headers.get("Authorization")
    if (authHeader) {
      headers.Authorization = authHeader
    }
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Admin client (service role)
export function getSupabaseAdminClient(): SupabaseClient {
  const serviceKey = SUPABASE_SERVICE_KEY

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
  }

  return createClient(SUPABASE_URL, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

const GENERATIONS_SELECT_FIELDS = "id,image_url,plan,created_at,metadata"

type GenerationRow = {
  id: string
  image_url: string
  plan: string | null
  created_at: string | null
  metadata?: {
    form?: Record<string, unknown> | null
    delivery?: string | null
  } | null
}

type FetchGenerationsParams = {
  supabase: SupabaseClient
  userId: string
  limit?: number
  signal?: AbortSignal
}

type FetchGenerationsResult = {
  data: GenerationRow[] | null
  error: PostgrestError | null
  source: "primary" | "rpc" | "view" | null
  missingRpc: boolean
  missingView: boolean
}

export async function fetchGenerationsSafe({
  supabase,
  userId,
  limit = 20,
  signal,
}: FetchGenerationsParams): Promise<FetchGenerationsResult> {
  const orderOptions = { ascending: false, nullsFirst: false }
  const primaryQuery = supabase
    .from("generations")
    .select(GENERATIONS_SELECT_FIELDS)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: orderOptions.ascending,
      nullsFirst: orderOptions.nullsFirst,
    })
    .limit(limit)

  if (signal) {
    primaryQuery.abortSignal(signal)
  }

  const { data: primaryData, error: primaryError } = (await primaryQuery) as {
    data: GenerationRow[] | null
    error: PostgrestError | null
  }

  if (!primaryError && primaryData) {
    return {
      data: primaryData,
      error: null,
      source: "primary",
      missingRpc: false,
      missingView: false,
    }
  }

  if (primaryError) {
    console.warn("[WARN] Primary generations query failed:", primaryError.message)
  }

  let missingRpc = false
  let missingView = false

  // Fallback #1: dedicated RPC that bypasses PostgREST ordering semantics.
  const rpcResponse = await supabase.rpc("get_generations_safe", { p_user_id: userId })

  if (!rpcResponse.error && rpcResponse.data) {
    return {
      data: rpcResponse.data as GenerationRow[],
      error: null,
      source: "rpc",
      missingRpc,
      missingView,
    }
  }

  if (rpcResponse.error) {
    console.warn("[WARN] RPC fallback failed:", rpcResponse.error.message)
    if (rpcResponse.error.message?.toLowerCase().includes("function get_generations_safe")) {
      missingRpc = true
    }
  }

  // Fallback #2: optional view to isolate READ operations from reserved keywords.
  const viewQuery = supabase
    .from("generations_view")
    .select(GENERATIONS_SELECT_FIELDS)
    .eq("user_id", userId)
    .order("created_at", {
      ascending: orderOptions.ascending,
      nullsFirst: orderOptions.nullsFirst,
    })
    .limit(limit)

  if (signal) {
    viewQuery.abortSignal(signal)
  }

  const { data: viewData, error: viewError } = (await viewQuery) as {
    data: GenerationRow[] | null
    error: PostgrestError | null
  }

  if (!viewError && viewData) {
    return {
      data: viewData,
      error: null,
      source: "view",
      missingRpc,
      missingView,
    }
  }

  if (viewError) {
    console.error("[FATAL] View fallback failed:", viewError.message)
    if (viewError.message?.toLowerCase().includes('relation "generations_view"')) {
      missingView = true
    }
  }

  if (typeof window !== "undefined") {
    console.error(
      "⚠️ Database setup missing: please run get_generations_safe() and generations_view SQL in Supabase.",
    )
  }

  return {
    data: null,
    error: viewError ?? rpcResponse.error ?? primaryError ?? null,
    source: null,
    missingRpc,
    missingView,
  }
}

export type { GenerationRow, FetchGenerationsParams, FetchGenerationsResult }
