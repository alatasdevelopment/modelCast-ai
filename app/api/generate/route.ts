import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import {
  applyWatermark,
  buildFashnInputs,
  enforceInputWhitelist,
  getFashnCapabilities,
  getModelCandidates,
} from "@/lib/fashn"
import { assemblePrompt, type PromptAssemblyResult, type PromptOptions } from "@/lib/promptUtils"
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabaseClient"

const PLAN_CREDIT_LIMITS = {
  free: 2,
  pro: 30,
  studio: 150,
} as const

type PlanId = keyof typeof PLAN_CREDIT_LIMITS

const resolvePlan = (profile: { plan?: string | null; is_pro?: boolean | null; is_studio?: boolean | null }): PlanId => {
  const rawPlan = typeof profile.plan === "string" ? profile.plan.toLowerCase() : null
  if (rawPlan === "studio") return "studio"
  if (rawPlan === "pro") return "pro"
  if (profile.is_studio) return "studio"
  if (profile.is_pro) return "pro"
  return "free"
}

const isProduction = process.env.NODE_ENV === "production"
const RAW_DEV_MODE = process.env.DEV_MODE === "true"
const DEV_MODE = !isProduction && RAW_DEV_MODE

const FASHN_BASE_URL = process.env.FASHN_API_BASE?.replace(/\/+$/, "") ?? "https://api.fashn.ai/v1"
const FASHN_RUN_ENDPOINT = `${FASHN_BASE_URL}/run`
const FASHN_STATUS_ENDPOINT = `${FASHN_BASE_URL}/status`
const MOCK_OUTPUT_URL = "https://placehold.co/600x800/111111/9FFF57?text=Mock+ModelCast+Shot"
const CLOUDINARY_PREFIX = "https://res.cloudinary.com/"
const FASHN_TIMEOUT_MS = 60_000
const FASHN_STATUS_POLL_INTERVAL_MS = 2000
const FASHN_STATUS_TIMEOUT_MS = 60_000

type FashnCapabilitySummary = {
  aspect_ratio: boolean
  style: boolean
  width: boolean
  height: boolean
  raw: Record<string, unknown>
}

const ASPECT_RATIO_ALIAS_MAP: Record<string, string> = {
  square: "1:1",
  portrait: "3:4",
  landscape: "16:9",
  vertical: "3:4",
  horizontal: "16:9",
  "4x5": "4:5",
  "5x4": "5:4",
  "3x4": "3:4",
  "4x3": "4:3",
  "16x9": "16:9",
  "9x16": "9:16",
}

const ASPECT_RATIO_RESOLUTION_MAP: Record<string, [number, number]> = {
  "1:1": [1024, 1024],
  "3:4": [768, 1024],
  "4:3": [1024, 768],
  "4:5": [1024, 1280],
  "5:4": [1280, 1024],
  "16:9": [1280, 720],
  "9:16": [720, 1280],
}

const summarizeFashnCapabilities = (raw: Record<string, unknown>): FashnCapabilitySummary => {
  const has = (key: string) => Object.prototype.hasOwnProperty.call(raw, key)

  const aspectSupported =
    has("aspect_ratio") || has("aspectRatio") || has("aspect-ratio") || raw["aspect_ratio"] != null

  const styleSupported =
    has("style") || has("style_type") || has("styleType") || raw["style_type"] != null

  const widthSupported =
    has("width") || has("image_width") || has("output_width") || raw["width"] != null

  const heightSupported =
    has("height") || has("image_height") || has("output_height") || raw["height"] != null

  return {
    aspect_ratio: Boolean(aspectSupported),
    style: Boolean(styleSupported),
    width: Boolean(widthSupported),
    height: Boolean(heightSupported),
    raw,
  }
}

const normalizeAspectRatioValue = (value?: string) => {
  if (!value) {
    return { requested: undefined, normalized: undefined, numeric: undefined }
  }
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) {
    return { requested: undefined, normalized: undefined, numeric: undefined }
  }
  const aliasResolved = ASPECT_RATIO_ALIAS_MAP[trimmed] ?? trimmed.replace("x", ":")
  const ratioMatch = aliasResolved.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/)
  if (!ratioMatch) {
    return { requested: value, normalized: aliasResolved, numeric: undefined }
  }
  const width = Number.parseFloat(ratioMatch[1])
  const height = Number.parseFloat(ratioMatch[2])
  if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) {
    return { requested: value, normalized: aliasResolved, numeric: undefined }
  }
  const numeric = Number((width / height).toFixed(2))
  return { requested: value, normalized: aliasResolved, numeric }
}

const computeRatioFromDimensions = (width?: number, height?: number) => {
  if (!width || !height || width <= 0 || height <= 0) {
    return undefined
  }
  return Number((width / height).toFixed(2))
}

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

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

type ProfileRow = {
  credits: number | null
  is_pro: boolean | null
  is_studio: boolean | null
  plan: string | null
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
  aspectRatio?: string
}

interface ParsedPayload {
  garmentImageUrl: string
  modelImageUrl?: string
  options: GenerateOptions
  mode?: string
  formSettings?: {
    styleType?: string
    gender?: string
    ageGroup?: string
    skinTone?: string
    aspectRatio?: string
  }
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

  const inlineImagePlaceholder =
    typeof payload.image === "string" && payload.image.length > 0
      ? `[inline-image:${payload.image.length}b]`
      : undefined

  const normalizedOptions = normalizeOptions(payload)

  const derivedImageUrl =
    typeof payload.imageUrl === "string"
      ? payload.imageUrl
      : typeof payload.garmentImageUrl === "string"
        ? payload.garmentImageUrl
        : typeof payload.garment_image === "string"
          ? payload.garment_image
          : inlineImagePlaceholder

  const optionsGender =
    typeof payload.options === "object" && payload.options !== null
      ? (payload.options as Record<string, unknown>).gender
      : undefined

  console.log("[DEBUG] Incoming UI Params:", {
    styleType: payload.styleType ?? null,
    aspectRatio: payload.aspectRatio ?? null,
    mode: payload.mode ?? null,
    environment: normalizedOptions.environment ?? null,
    modelType: normalizedOptions.modelType ?? null,
    modelGender:
      typeof payload.gender === "string"
        ? payload.gender
        : typeof optionsGender === "string"
          ? optionsGender
          : null,
    ageGroup: payload.ageGroup ?? payload.age ?? null,
    skinTone: payload.skinTone ?? payload.tone ?? normalizedOptions.skinTone ?? null,
    style: normalizedOptions.style ?? null,
    imageUrl: derivedImageUrl ?? null,
  })

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

  const formSettings = {
    styleType: typeof payload.styleType === "string" ? payload.styleType : undefined,
    gender: typeof payload.gender === "string" ? payload.gender : undefined,
    ageGroup: typeof payload.ageGroup === "string" ? payload.ageGroup : undefined,
    skinTone: typeof payload.skinTone === "string" ? payload.skinTone : undefined,
    aspectRatio: typeof payload.aspectRatio === "string" ? payload.aspectRatio : undefined,
  }

  return {
    modelImageUrl,
    garmentImageUrl,
    options: normalizedOptions,
    mode,
    formSettings,
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type FashnCallResult = {
  outputUrl: string
  creditsRemaining?: number
  promptDetails: PromptAssemblyResult
  modelName: string
  capabilities: FashnCapabilitySummary
  outputMetadata?: Record<string, unknown> | null
  outputDimensions?: {
    width?: number
    height?: number
    ratio?: number
  }
  inputsSent: Record<string, unknown>
  warnings: string[]
}

const callFashnApi = async ({ modelImageUrl, garmentImageUrl, options, formSettings }: ParsedPayload): Promise<FashnCallResult> => {
  if (!FASHN_API_KEY) {
    throw new Error("FASHN_API_KEY_MISSING")
  }

  const hasModelImage = typeof modelImageUrl === "string" && modelImageUrl.length > 0

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${FASHN_API_KEY}`,
  }

  const promptOptions: PromptOptions = {
    environment: options.environment,
    modelType: options.modelType,
    ageGroup: formSettings?.ageGroup ?? options.ageGroup,
    gender: formSettings?.gender ?? options.gender,
    style: options.style,
    skinTone: formSettings?.skinTone ?? options.skinTone,
    styleType: formSettings?.styleType,
    aspectRatio: formSettings?.aspectRatio,
  }

  const promptDetails = assemblePrompt(promptOptions, formSettings)
  const finalPrompt = promptDetails.prompt

  console.log("[DEBUG] Final Prompt Sent to Model:", finalPrompt)

  if (!isProduction) {
    console.log("[generate] Prompt context", promptDetails)
  }

  const modelCandidates = getModelCandidates(hasModelImage)
  let lastError: unknown = null
  const capabilityCache = new Map<string, FashnCapabilitySummary>()
  const aspectRatioInfo = normalizeAspectRatioValue(formSettings?.aspectRatio)
  const resolvedStyleInput = options.style ?? mapStyleTypeToStyle(formSettings?.styleType)
  let resolvedCapabilities: FashnCapabilitySummary | null = null

  for (const modelName of modelCandidates) {
    const attemptWarnings: string[] = []
    const recordWarning = (message: string) => {
      console.warn(message)
      attemptWarnings.push(message)
    }

    const isTryOnModel = modelName.startsWith("tryon-v")
    if (!isProduction) {
      console.log("[DEBUG] isTryOnModel:", isTryOnModel)
    }

    let inputs: ReturnType<typeof buildFashnInputs>
    try {
      inputs = buildFashnInputs(modelName, {
        garmentImageUrl,
        modelImageUrl,
        prompt: finalPrompt,
      }, { includePrompt: !isTryOnModel })
      if (isTryOnModel && !isProduction) {
        console.log("[DEBUG] Omitted prompt (try-on model)")
      }
    } catch (error) {
      lastError = error
      continue
    }

    let capabilitySummary = capabilityCache.get(modelName)
    if (!capabilitySummary) {
      const rawCapabilities = await getFashnCapabilities(modelName)
      capabilitySummary = summarizeFashnCapabilities(rawCapabilities)
      capabilityCache.set(modelName, capabilitySummary)
    }
    resolvedCapabilities = capabilitySummary

    console.log(`[DEBUG] Fashn capabilities (${modelName}):`, {
      aspect_ratio: capabilitySummary.aspect_ratio,
      style: capabilitySummary.style,
      width: capabilitySummary.width,
      height: capabilitySummary.height,
    })

    const enrichedInputs: Record<string, unknown> = { ...inputs }

    if (aspectRatioInfo.normalized) {
      if (!aspectRatioInfo.normalized.includes(":")) {
        recordWarning(`[WARN] Unsupported aspect ratio format "${aspectRatioInfo.normalized}", skipping.`)
      } else if (capabilitySummary.aspect_ratio) {
        enrichedInputs.aspect_ratio = aspectRatioInfo.normalized
      } else {
        recordWarning("[WARN] aspect_ratio not supported by this model, skipping.")
        const resolution = ASPECT_RATIO_RESOLUTION_MAP[aspectRatioInfo.normalized]
        if (resolution && (capabilitySummary.width || capabilitySummary.height)) {
          enrichedInputs.width = resolution[0]
          enrichedInputs.height = resolution[1]
          console.log("[DEBUG] Enforced aspect via resolution:", resolution[0], "x", resolution[1])
        } else if (resolution) {
          recordWarning("[WARN] width/height not supported by this model, unable to enforce aspect via resolution.")
        }
      }
    }

    if (resolvedStyleInput) {
      if (capabilitySummary.style) {
        enrichedInputs.style = resolvedStyleInput
      } else {
        recordWarning("[WARN] style not supported by this model, skipping.")
      }
    }

    const sanitizedInputs = enforceInputWhitelist(modelName, enrichedInputs)
    const removedKeys = Object.keys(enrichedInputs).filter((key) => !(key in sanitizedInputs))

    if (removedKeys.length > 0) {
      recordWarning(`[generate] Dropped unsupported FASHN input keys for ${modelName}: ${removedKeys.join(", ")}`)
    }

    console.log("[DEBUG] Final Fashn Inputs Sent:", sanitizedInputs)
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

          const statusRecord = statusPayload as unknown as Record<string, unknown>
          const metadataCandidate =
            (statusRecord.metadata as Record<string, unknown> | undefined) ??
            (statusRecord.output_metadata as Record<string, unknown> | undefined) ??
            (statusRecord.output_meta as Record<string, unknown> | undefined) ??
            undefined

          const arrayMeta =
            Array.isArray(statusPayload.output) && typeof statusPayload.output[0] === "object"
              ? (statusPayload.output[0] as Record<string, unknown>)
              : undefined

          const combinedMetadata = metadataCandidate ?? arrayMeta ?? null

          const derivedWidth =
            toNumberOrUndefined(statusRecord.width) ??
            toNumberOrUndefined(statusRecord.output_width) ??
            (combinedMetadata ? toNumberOrUndefined(combinedMetadata.width) : undefined) ??
            (combinedMetadata && typeof combinedMetadata.dimensions === "object"
              ? toNumberOrUndefined((combinedMetadata.dimensions as Record<string, unknown>).width)
              : undefined)

          const derivedHeight =
            toNumberOrUndefined(statusRecord.height) ??
            toNumberOrUndefined(statusRecord.output_height) ??
            (combinedMetadata ? toNumberOrUndefined(combinedMetadata.height) : undefined) ??
            (combinedMetadata && typeof combinedMetadata.dimensions === "object"
              ? toNumberOrUndefined((combinedMetadata.dimensions as Record<string, unknown>).height)
              : undefined)

          const dimensionSummary = {
            width: derivedWidth,
            height: derivedHeight,
            ratio: computeRatioFromDimensions(derivedWidth, derivedHeight),
          }

          return {
            outputUrl,
            creditsRemaining: creditsRemainingValue,
            promptDetails,
            modelName,
            capabilities: resolvedCapabilities ?? summarizeFashnCapabilities({}),
            outputMetadata: combinedMetadata,
            outputDimensions: dimensionSummary,
            inputsSent: sanitizedInputs,
            warnings: attemptWarnings,
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

let adminClient: ReturnType<typeof getSupabaseAdminClient> | null = null
if (SUPABASE_SERVICE_ROLE_KEY) {
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    console.warn("[generate] failed to initialize admin client", error)
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[generate] Missing Supabase environment variables.")
    return NextResponse.json({ success: false, error: "SERVER_CONFIGURATION_ERROR" }, { status: 500 })
  }

  if (isProduction && RAW_DEV_MODE) {
    console.error("[generate] DEV_MODE cannot be active in production!")
    throw new Error("DEV_MODE cannot be active in production!")
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
    console.warn("[generate] Missing access token")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseServerClient(request, accessToken)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken)

  if (userError || !user) {
    console.warn("[generate] Unable to authenticate user", userError)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select<ProfileRow>("credits, is_pro, is_studio, plan")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("[generate] failed to fetch credits", profileError)
    return NextResponse.json({ success: false, error: "Unable to verify credits" }, { status: 500 })
  }

  let profile: ProfileRow | null = profileData ?? null

  if (!profile) {
    const defaultProfile = {
      id: user.id,
      credits: PLAN_CREDIT_LIMITS.free,
      plan: "free",
      is_pro: false,
      is_studio: false,
    } as const

    const profileClient = adminClient ?? supabase
    const { data: createdProfile, error: createError } = await profileClient
      .from("profiles")
      .upsert(defaultProfile, { onConflict: "id" })
      .select<ProfileRow>("credits, is_pro, is_studio, plan")
      .single()

    if (createError) {
      console.error("[generate] failed to initialize profile", createError)
      return NextResponse.json({ success: false, error: "PROFILE_INIT_FAILED" }, { status: 500 })
    }

    profile =
      createdProfile ?? {
        credits: defaultProfile.credits,
        is_pro: defaultProfile.is_pro,
        is_studio: defaultProfile.is_studio,
        plan: defaultProfile.plan,
      }

    console.log("[generate] auto-created profile for user", {
      userId: user.id,
      plan: profile.plan,
    })
  }

  if (DEV_MODE && profile) {
    profile = {
      ...profile,
      plan: "pro",
      is_pro: true,
      credits: 999,
    }
    console.log("[DEBUG] Dev Mode active: skipping credit checks, using Pro features.")
    console.log("[DEBUG] Profile credits = 999 (temporary)")
  }

  const plan = resolvePlan(profile)
  const planCreditLimit = DEV_MODE ? 999 : PLAN_CREDIT_LIMITS[plan]
  const rawCredits = typeof profile.credits === "number" ? profile.credits : 0
  const normalizedCredits = DEV_MODE ? planCreditLimit : Math.min(Math.max(rawCredits, 0), planCreditLimit)
  const isProTier = plan !== "free"

  if (!isProTier && (parsedPayload.modelImageUrl || parsedPayload.mode === "advanced")) {
    return NextResponse.json({ error: "Pro plan required for dual-image try-on." }, { status: 403 })
  }

  if (parsedPayload.mode === "advanced" && !parsedPayload.modelImageUrl) {
    return NextResponse.json({ error: "Model image required for advanced mode." }, { status: 400 })
  }

  if (!DEV_MODE && normalizedCredits <= 0) {
    return NextResponse.json({ error: "Out of credits" }, { status: 402 })
  }

  let fashnResult: FashnCallResult

  try {
    fashnResult = await callFashnApi(parsedPayload)
  } catch (error) {
    console.error("[generate] FASHN request failed", error)
    const message = error instanceof Error ? error.message : "FASHN_API_ERROR"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }

  const requestedAspectSummary = normalizeAspectRatioValue(parsedPayload.formSettings?.aspectRatio)
  const capabilityLog = {
    aspect_ratio: fashnResult.capabilities.aspect_ratio,
    style: fashnResult.capabilities.style,
    width: fashnResult.capabilities.width,
    height: fashnResult.capabilities.height,
  }
  const debugWarnings = [...fashnResult.warnings]
  const aspectChecks: Array<{ message: string; status: "pass" | "warn" | "info" }> = []
  console.log(`[DEBUG] Fashn Capabilities (${fashnResult.modelName}):`, capabilityLog)

  if (fashnResult.outputDimensions) {
    console.log("[DEBUG] Output Meta (if available):", fashnResult.outputDimensions)
  } else {
    console.log("[DEBUG] Output Meta (if available): null")
  }

  const formatRatio = (value?: number) => (typeof value === "number" ? value.toFixed(2) : "unknown")
  if (requestedAspectSummary.numeric && typeof fashnResult.outputDimensions?.ratio === "number") {
    const requestedRatioFormatted = formatRatio(requestedAspectSummary.numeric)
    const outputRatioFormatted = formatRatio(fashnResult.outputDimensions.ratio)
    const ratioDelta = Math.abs(fashnResult.outputDimensions.ratio - requestedAspectSummary.numeric)
    if (ratioDelta > 0.05) {
      const mismatchMessage = `[CHECK] Output ratio ${outputRatioFormatted} != requested ${requestedRatioFormatted} → mismatch`
      console.log(mismatchMessage)
      debugWarnings.push(mismatchMessage)
      aspectChecks.push({ message: mismatchMessage, status: "warn" })
    } else {
      const matchMessage = `[CHECK] Output ratio ${outputRatioFormatted} ≈ requested ${requestedRatioFormatted}`
      console.log(matchMessage)
      aspectChecks.push({ message: matchMessage, status: "pass" })
    }
  } else if (requestedAspectSummary.normalized) {
    const unavailableMessage = `[CHECK] Output ratio unavailable to compare against requested ${requestedAspectSummary.normalized}`
    console.log(unavailableMessage)
    aspectChecks.push({ message: unavailableMessage, status: "info" })
  }

  const requestedStyleType = parsedPayload.formSettings?.styleType ?? undefined
  const requestedStyleNormalized = requestedStyleType?.trim().toLowerCase()
  if (requestedStyleNormalized) {
    const metadataSignals: string[] = []
    const outputMetadata = fashnResult.outputMetadata ?? undefined
    if (outputMetadata && typeof outputMetadata === "object") {
      const record = outputMetadata as Record<string, unknown>
      ;["style", "style_type", "environment"].forEach((key) => {
        const value = record[key]
        if (typeof value === "string") {
          metadataSignals.push(value.toLowerCase())
        }
      })
    }
    const promptSignal = fashnResult.promptDetails.prompt.toLowerCase()
    const hasMetadataMatch = metadataSignals.some((entry) => entry.includes(requestedStyleNormalized))
    const metadataSuggestsStudio = metadataSignals.some((entry) => entry.includes("studio"))
    if (metadataSignals.length > 0 && !hasMetadataMatch) {
      let warningMessage: string
      if (metadataSuggestsStudio && requestedStyleNormalized === "street") {
        warningMessage = '[VERIFY WARNING] Output style metadata leans "studio" while "street" was requested.'
        console.warn(warningMessage)
      } else {
        warningMessage = `[VERIFY WARNING] Output style inconsistent with requested "${requestedStyleType}".`
        console.warn(warningMessage)
      }
      debugWarnings.push(warningMessage)
      console.log('[SUGGESTION] Try adding "urban environment, natural light" to prompt context.')
    } else if (
      requestedStyleNormalized === "street" &&
      !metadataSignals.length &&
      !promptSignal.includes("street")
    ) {
      const warningMessage = '[VERIFY WARNING] Unable to confirm "street" styling in generated output.'
      console.warn(warningMessage)
      debugWarnings.push(warningMessage)
      console.log('[SUGGESTION] Try adding "urban environment, natural light" to prompt context.')
    }
  }

  const updateClient = adminClient ?? supabase
  let creditsRemaining: number

  if (DEV_MODE) {
    creditsRemaining = planCreditLimit
  } else {
    creditsRemaining = Math.max(normalizedCredits - 1, 0)
    const { error: updateError } = await updateClient
      .from("profiles")
      .update({ credits: creditsRemaining })
      .eq("id", user.id)

    if (updateError) {
      console.error("[generate] failed to decrement credits", updateError)
      return NextResponse.json({ success: false, error: "Unable to update credits" }, { status: 500 })
    }
  }

  const previewModeActive = !isProTier
  // TODO: Revisit watermark handling to return true preview-quality assets for non-pro tiers.
  if (previewModeActive) {
    console.log("[TODO] Watermark mode not yet implemented")
  }

  const finalOutputUrl = previewModeActive
    ? applyWatermark(fashnResult.outputUrl, { width: 1024, cacheBust: true })
    : fashnResult.outputUrl

  const outputSummary = {
    width: fashnResult.outputDimensions?.width ?? null,
    height: fashnResult.outputDimensions?.height ?? null,
    ratio: fashnResult.outputDimensions?.ratio ?? null,
    metadata: fashnResult.outputMetadata ?? null,
  }

  const aspectDebug = {
    model: fashnResult.modelName,
    ui: {
      requested: parsedPayload.formSettings?.aspectRatio ?? null,
      normalized: requestedAspectSummary.normalized ?? null,
      numeric: requestedAspectSummary.numeric ?? null,
    },
    capabilities: capabilityLog,
    inputs: fashnResult.inputsSent,
    output: outputSummary,
    warnings: debugWarnings,
    checks: aspectChecks,
  }

  const metadata = {
    options: parsedPayload.options,
    form: parsedPayload.formSettings,
    modelImageProvided: Boolean(parsedPayload.modelImageUrl),
    delivery: isProTier ? "hd" : "preview",
    prompt: {
      text: fashnResult.promptDetails.prompt,
      resolved: fashnResult.promptDetails.resolved,
      missing: fashnResult.promptDetails.missing,
    },
    api: {
      model: fashnResult.modelName,
      capabilities: capabilityLog,
      inputs: fashnResult.inputsSent,
      output: outputSummary,
      warnings: debugWarnings,
      checks: aspectChecks,
      ui: aspectDebug.ui,
    },
  }

  const missingMappings = fashnResult.promptDetails.missing

  if (missingMappings.length > 0) {
    const mappingWarning = "[VERIFY WARNING] Model attributes do not match prompt inputs."
    console.warn(mappingWarning, {
      missing: missingMappings,
    })
    debugWarnings.push(`${mappingWarning} Missing: ${missingMappings.join(", ")}`)
  }

  const mappingSummary =
    missingMappings.length === 0
      ? "[SUCCESS] Parameters mapped correctly ✅"
      : `[SUCCESS] Parameters mapped correctly ❌ Missing mappings: ${missingMappings.join(", ")}`

  console.log(mappingSummary)

  const promptCoherenceStatus =
    missingMappings.length === 0
      ? "PASS (heuristic - awaiting image verification)"
      : "FAIL (missing mapped attributes)"

  console.log(`[CHECK] Prompt -> Image coherence: ${promptCoherenceStatus}`)
  if (DEV_MODE) {
    console.log("[INFO] User credits deducted properly (dev override active)")
  } else {
    console.log(`[INFO] User credits deducted properly (remaining: ${creditsRemaining}/${planCreditLimit})`)
  }

  if (missingMappings.length > 0) {
    const suggestions: string[] = []
    if (missingMappings.includes("skinTone")) {
      suggestions.push("Expand skin tone mappings to cover this selection for clearer tone guidance.")
    }
    if (missingMappings.includes("styleType")) {
      suggestions.push("Add descriptive keywords for the selected style type to tighten the visual guidance.")
      if (parsedPayload.formSettings?.styleType === "street") {
        suggestions.push('Add "clear view of upper body" when style=street and top wear is important.')
      }
    }
    if (missingMappings.includes("ageGroup")) {
      suggestions.push("Include additional age group aliases (e.g., youth, middle-aged) in the mapping table.")
    }
    suggestions.forEach((suggestion) => console.log(`[SUGGEST] ${suggestion}`))
  }

  const { data: insertedGeneration, error: generationInsertError } = await updateClient
    .from("generations")
    .insert({
      user_id: user.id,
      image_url: finalOutputUrl,
      plan,
      metadata,
    })
    .select("id, image_url, plan, created_at, metadata")
    .single()

  if (generationInsertError) {
    console.error("[generate] failed to persist generation", generationInsertError)
  }

  logInfo("[generate] FASHN completed", {
    userId: user.id,
    outputUrl: finalOutputUrl,
  })

  return NextResponse.json({
    success: true,
    outputUrl: finalOutputUrl,
    creditsRemaining: fashnResult.creditsRemaining ?? creditsRemaining,
    totalCredits: planCreditLimit,
    plan,
    debug: aspectDebug,
    generation: insertedGeneration
      ? {
          id: insertedGeneration.id,
          url: insertedGeneration.image_url,
          plan: insertedGeneration.plan,
          createdAt: insertedGeneration.created_at,
          metadata: insertedGeneration.metadata,
        }
      : null,
  })
}
