import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

import {
  applyWatermark,
  buildFashnInputs,
  buildPrompt,
  enforceInputWhitelist,
  getModelCandidates,
} from "@/lib/fashn"

const isProduction = process.env.NODE_ENV === "production"

const FASHN_BASE_URL = process.env.FASHN_API_BASE?.replace(/\/+$/, "") ?? "https://api.fashn.ai/v1"
const FASHN_RUN_ENDPOINT = `${FASHN_BASE_URL}/run`
const FASHN_STATUS_ENDPOINT = `${FASHN_BASE_URL}/status`
const MOCK_OUTPUT_URL = "https://placehold.co/600x800/111111/9FFF57?text=Mock+ModelCast+Shot"
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/"
const FASHN_TIMEOUT_MS = 60_000
const FASHN_STATUS_POLL_INTERVAL_MS = 2000
const FASHN_STATUS_TIMEOUT_MS = 60_000

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const FASHN_ENABLED = process.env.FASHN_ENABLED === "true"
const FASHN_API_KEY = process.env.FASHN_API_KEY

const logInfo = (...args: unknown[]) => {
  if (!isProduction) {
    console.info(...args)
  }
}

type GenerateOptions = {
  environment?: string
  modelType?: string
  ageGroup?: string
  gender?: string
  style?: string
  skinTone?: string
}

interface GenerateRequestBody {
  imageUrl?: string
  image?: string
  modelImage?: string
  modelImageUrl?: string
  model_image?: string
  garmentImage?: string
  garmentImageUrl?: string
  garment_image?: string
  options?: Record<string, unknown>
  environment?: string
  modelType?: string
  ageGroup?: string
  gender?: string
  style?: string
  styleType?: string
  age?: string
  tone?: string
  skinTone?: string
  mode?: string
}

interface ParsedPayload {
  garmentImageUrl: string
  modelImageUrl?: string
  options: GenerateOptions
  mode?: string
}

interface FashnRunResponse {
  id?: string
  error?: string | null
  message?: string | null
}

interface FashnStatusResponse {
  status: "starting" | "processing" | "completed" | "failed" | string
  output?: string[]
  error?: string | { message?: string } | null
  credits_remaining?: number
}

const sanitizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : undefined
}

const mapStyleTypeToModelType = (styleType?: string): string | undefined => {
  switch (styleType) {
    case "street":
      return "street"
    case "studio":
    case "editorial":
      return "fashion"
    case "outdoor":
      return "fashion"
    default:
      return undefined
  }
}

const mapStyleTypeToEnvironment = (styleType?: string): string | undefined => {
  switch (styleType) {
    case "outdoor":
      return "outdoor"
    case "street":
      return "urban"
    case "studio":
      return "studio"
    default:
      return undefined
  }
}

const mapStyleTypeToStyle = (styleType?: string): string | undefined => {
  switch (styleType) {
    case "street":
      return "streetwear"
    case "editorial":
      return "formal"
    case "outdoor":
      return "casual"
    case "studio":
      return "formal"
    default:
      return undefined
  }
}

const normalizeEnvironment = (value?: string): string | undefined => {
  if (!value) return undefined
  if (value === "outdoor" || value === "studio" || value === "urban") return value
  if (value === "street") return "urban"
  return value
}

const normalizeModelType = (value?: string): string | undefined => {
  if (!value) return undefined
  if (value === "fashion" || value === "portrait" || value === "street") return value
  if (value === "studio") return "portrait"
  return value
}

const normalizeAgeGroup = (value?: string): string | undefined => {
  if (!value) return undefined

  switch (value) {
    case "young":
    case "youth":
    case "teen":
    case "teenager":
    case "child":
    case "children":
      return "young"
    case "middle-aged":
    case "middle":
    case "adult":
      return "middle-aged"
    case "senior":
    case "elderly":
    case "older":
      return "senior"
    default:
      return value
  }
}

const normalizeGender = (value?: string): string | undefined => {
  if (!value) return undefined

  switch (value) {
    case "female":
    case "woman":
      return "female"
    case "male":
    case "man":
      return "male"
    case "unisex":
    case "androgynous":
    case "neutral":
      return "unisex"
    default:
      return value
  }
}

const normalizeStyle = (value?: string): string | undefined => {
  if (!value) return undefined
  if (value === "casual" || value === "formal" || value === "sporty") return value
  return value
}

const normalizeOptions = (payload: GenerateRequestBody): GenerateOptions => {
  const rawOptions =
    typeof payload.options === "object" && payload.options !== null
      ? (payload.options as Record<string, unknown>)
      : {}

  const styleType = sanitizeString(payload.styleType)

  const environment = normalizeEnvironment(
    sanitizeString(rawOptions.environment) ??
      sanitizeString(payload.environment) ??
      mapStyleTypeToEnvironment(styleType ?? undefined),
  )

  const modelType = normalizeModelType(
    sanitizeString(rawOptions.modelType) ??
      sanitizeString(payload.modelType) ??
      mapStyleTypeToModelType(styleType ?? undefined),
  )

  const ageGroup = normalizeAgeGroup(
    sanitizeString(rawOptions.ageGroup) ??
      sanitizeString(payload.ageGroup ?? payload.age),
  )

  const gender = normalizeGender(
    sanitizeString(rawOptions.gender) ?? sanitizeString(payload.gender),
  )

  const style = normalizeStyle(
    sanitizeString(rawOptions.style) ??
      sanitizeString(payload.style) ??
      mapStyleTypeToStyle(styleType ?? undefined),
  )

  const skinTone = sanitizeString(payload.skinTone ?? payload.tone)

  return {
    environment,
    modelType,
    ageGroup,
    gender,
    style,
    skinTone,
  }
}

const parseRequestPayload = async (request: Request): Promise<ParsedPayload> => {
  let payload: GenerateRequestBody

  try {
    payload = (await request.json()) as GenerateRequestBody
  } catch {
    throw new Error("INVALID_PAYLOAD")
  }

  const normalizeUrl = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined

  const modelImageUrl =
    normalizeUrl(payload.modelImageUrl) ??
    normalizeUrl(payload.model_image) ??
    normalizeUrl(payload.modelImage) ??
    normalizeUrl(
      typeof payload.options === "object" && payload.options !== null
        ? (payload.options as Record<string, unknown>).modelImageUrl
        : undefined,
    )

  const garmentImageUrl =
    normalizeUrl(payload.garmentImageUrl) ??
    normalizeUrl(payload.garment_image) ??
    normalizeUrl(payload.garmentImage) ??
    normalizeUrl(payload.imageUrl) ??
    normalizeUrl(payload.image)

  if (!garmentImageUrl) {
    throw new Error("MISSING_GARMENT_IMAGE")
  }

  if (!garmentImageUrl.startsWith(CLOUDINARY_PREFIX)) {
    throw new Error("INVALID_IMAGE_URL")
  }

  if (modelImageUrl && !modelImageUrl.startsWith(CLOUDINARY_PREFIX)) {
    throw new Error("INVALID_IMAGE_URL")
  }

  const rawMode = sanitizeString(payload.mode)
  const mode = rawMode === "advanced" || rawMode === "basic" ? rawMode : undefined

  if (mode === "advanced" && !modelImageUrl) {
    throw new Error("ADVANCED_MODE_REQUIRES_MODEL_IMAGE")
  }

  return {
    modelImageUrl,
    garmentImageUrl,
    options: normalizeOptions(payload),
    mode,
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const callFashnApi = async ({ modelImageUrl, garmentImageUrl, options }: ParsedPayload) => {
  if (!FASHN_API_KEY) {
    throw new Error("FASHN_API_KEY_MISSING")
  }

  const hasModelImage = typeof modelImageUrl === "string" && modelImageUrl.length > 0

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${FASHN_API_KEY}`,
  }

  const prompt = buildPrompt(options)
  if (!isProduction && prompt) {
    console.log("[generate] Prompt context", prompt)
  }

  const modelCandidates = getModelCandidates(hasModelImage)
  let lastError: unknown = null

  for (const modelName of modelCandidates) {
    let inputs: ReturnType<typeof buildFashnInputs>
    try {
      inputs = buildFashnInputs(modelName, {
        garmentImageUrl,
        modelImageUrl,
        prompt,
      })
    } catch (error) {
      lastError = error
      continue
    }

    const sanitizedInputs = enforceInputWhitelist(modelName, inputs)
    const removedKeys = Object.keys(inputs).filter((key) => !(key in sanitizedInputs))

    if (removedKeys.length > 0) {
      console.warn(`[generate] Dropped unsupported FASHN input keys for ${modelName}`, removedKeys)
    }

    if (!isProduction) {
      console.log("[generate] FASHN inputs", { model: modelName, inputs: sanitizedInputs })
    }

    const runRequestPayload = {
      model_name: modelName,
      inputs: sanitizedInputs,
    }

    if (!isProduction) {
      console.log("[generate] FASHN run request", {
        url: FASHN_RUN_ENDPOINT,
        model: modelName,
        headers: {
          "Content-Type": requestHeaders["Content-Type"],
          Authorization: "Bearer ***",
        },
        body: runRequestPayload,
      })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FASHN_TIMEOUT_MS)

    try {
      const runResponse = await fetch(FASHN_RUN_ENDPOINT, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(runRequestPayload),
        signal: controller.signal,
      })

      const runBody = await runResponse.text()
      if (!isProduction) {
        console.log("[generate] FASHN run response", {
          model: modelName,
          status: runResponse.status,
          body: runBody.slice(0, 500),
        })
      }

      if (!runResponse.ok) {
        let message: string | undefined
        try {
          const parsed = runBody ? (JSON.parse(runBody) as { message?: string; error?: string }) : null
          message = parsed?.message ?? parsed?.error ?? undefined
        } catch {
          message = undefined
        }
        lastError = new Error(
          message ?? `FASHN_API_HTTP_${runResponse.status}${runBody ? `: ${runBody.slice(0, 200)}` : ""}`,
        )
        continue
      }

      let runResult: FashnRunResponse | null = null
      try {
        runResult = runBody ? (JSON.parse(runBody) as FashnRunResponse) : null
      } catch {
        runResult = null
      }

      if (!runResult || typeof runResult.id !== "string") {
        const message = runResult?.error ?? runResult?.message ?? "FASHN_API_NO_ID"
        lastError = new Error(message)
        continue
      }

      const predictionId = runResult.id
      const startedAt = Date.now()

      while (Date.now() - startedAt < FASHN_STATUS_TIMEOUT_MS) {
        const statusResponse = await fetch(`${FASHN_STATUS_ENDPOINT}/${predictionId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${FASHN_API_KEY}`,
          },
        })

        const statusBody = await statusResponse.text()
        if (!isProduction) {
          console.log("[generate] FASHN status response", {
            model: modelName,
            status: statusResponse.status,
            body: statusBody.slice(0, 500),
          })
        }

        if (!statusResponse.ok) {
          let statusMessage: string | undefined
          try {
            const parsed = statusBody
              ? (JSON.parse(statusBody) as { message?: string; error?: string; status?: string })
              : null
            statusMessage = parsed?.message ?? parsed?.error ?? undefined
          } catch {
            statusMessage = undefined
          }
          throw new Error(
            statusMessage ??
              `FASHN_STATUS_HTTP_${statusResponse.status}${statusBody ? `: ${statusBody.slice(0, 200)}` : ""}`,
          )
        }

        let statusPayload: FashnStatusResponse | null = null
        try {
          statusPayload = statusBody ? (JSON.parse(statusBody) as FashnStatusResponse) : null
        } catch {
          statusPayload = null
        }

        if (!statusPayload) {
          throw new Error("FASHN_STATUS_PARSE_ERROR")
        }

        if (statusPayload.status === "completed") {
          const outputUrl = Array.isArray(statusPayload.output) ? statusPayload.output[0] : undefined
          if (typeof outputUrl !== "string" || outputUrl.length === 0) {
            throw new Error("FASHN_API_NO_OUTPUT")
          }

          const creditsRemainingValue =
            typeof statusPayload.credits_remaining === "number" ? statusPayload.credits_remaining : undefined

          return {
            outputUrl,
            creditsRemaining: creditsRemainingValue,
          }
        }

        if (statusPayload.status === "failed") {
          const errorMessage =
            typeof statusPayload.error === "string"
              ? statusPayload.error
              : statusPayload.error?.message ?? "FASHN_API_FAILED"
          throw new Error(errorMessage)
        }

        await delay(FASHN_STATUS_POLL_INTERVAL_MS)
      }

      throw new Error("FASHN_STATUS_TIMEOUT")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("FASHN_API_TIMEOUT")
      }
      lastError = error
    } finally {
      controller.abort()
      clearTimeout(timeout)
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error("FASHN_API_UNAVAILABLE")
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
    console.error("[generate] Missing Supabase environment variables.")
    return NextResponse.json({ success: false, error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
  }

  console.log("[generate] env status", {
    hasSupabaseUrl: Boolean(SUPABASE_URL),
    hasSupabaseAnon: Boolean(SUPABASE_ANON_KEY),
    hasSupabaseServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    hasFashnKey: Boolean(FASHN_API_KEY),
    fashnEnabled: FASHN_ENABLED,
  })

  const cookieStore = await cookies()
  let parsedPayload: ParsedPayload

  try {
    parsedPayload = await parseRequestPayload(request)
  } catch (error) {
    const err = error as Error
    let errorDetail: string | null = null
    switch (err.message) {
      case "INVALID_IMAGE_URL":
        errorDetail = "Invalid image input"
        break
      case "INVALID_PAYLOAD":
        errorDetail = "Invalid input"
        break
      case "MISSING_REQUIRED_IMAGES":
      case "MISSING_GARMENT_IMAGE":
        errorDetail = "Garment image is required."
        break
      case "ADVANCED_MODE_REQUIRES_MODEL_IMAGE":
        errorDetail = "Model image required for advanced mode."
        break
      default:
        errorDetail = null
    }

    if (errorDetail) {
      return NextResponse.json({ error: errorDetail }, { status: 400 })
    }

    console.error("[generate] payload parsing failed", error)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  if (!FASHN_ENABLED) {
    logInfo("[generate] Mock mode active — returning placeholder image.")
    return NextResponse.json({
      success: true,
      outputUrl: MOCK_OUTPUT_URL,
      creditsRemaining: 999,
    })
  }

  if (!isProduction) {
    console.log("[generate] FASHN env", {
      baseUrl: FASHN_BASE_URL,
      runEndpoint: FASHN_RUN_ENDPOINT,
      statusEndpoint: FASHN_STATUS_ENDPOINT,
      hasKey: Boolean(FASHN_API_KEY),
    })
  }

  if (!isProduction) {
    const cookieKeys = cookieStore.getAll().map((cookie) => cookie.name)
    console.log("[generate] cookie keys", cookieKeys)
  }

  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    console.warn("[generate] Unable to authenticate user", sessionError)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = session.user

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits, is_pro")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("[generate] failed to fetch credits", profileError)
    return NextResponse.json({ success: false, error: "Unable to verify credits" }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ success: false, error: "PROFILE_NOT_FOUND" }, { status: 404 })
  }

  const isPro = profile.is_pro === true

  if (!isPro && (parsedPayload.modelImageUrl || parsedPayload.mode === "advanced")) {
    return NextResponse.json({ error: "Pro plan required for dual-image try-on." }, { status: 403 })
  }

  if (parsedPayload.mode === "advanced" && !parsedPayload.modelImageUrl) {
    return NextResponse.json({ error: "Model image required for advanced mode." }, { status: 400 })
  }

  const credits = typeof profile.credits === "number" ? profile.credits : 0

  if (credits <= 0) {
    return NextResponse.json({ error: "Out of credits" }, { status: 402 })
  }

  let fashnResult: { outputUrl: string; creditsRemaining?: number }

  try {
    fashnResult = await callFashnApi(parsedPayload)
  } catch (error) {
    console.error("[generate] FASHN request failed", error)
    const message = error instanceof Error ? error.message : "FASHN_API_ERROR"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }

  const creditsRemaining = Math.max(credits - 1, 0)
  const updateClient = adminClient ?? supabase
  const { error: updateError } = await updateClient
    .from("profiles")
    .update({ credits: creditsRemaining })
    .eq("id", user.id)

  if (updateError) {
    console.error("[generate] failed to decrement credits", updateError)
    return NextResponse.json({ success: false, error: "Unable to update credits" }, { status: 500 })
  }

  const finalOutputUrl = isPro ? fashnResult.outputUrl : applyWatermark(fashnResult.outputUrl)

  logInfo("[generate] FASHN completed", {
    userId: user.id,
    outputUrl: finalOutputUrl,
  })

  return NextResponse.json({
    success: true,
    outputUrl: finalOutputUrl,
    creditsRemaining: fashnResult.creditsRemaining ?? creditsRemaining,
  })
}
