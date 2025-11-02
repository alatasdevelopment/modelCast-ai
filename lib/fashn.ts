import {
  assemblePrompt,
  type PromptFormSelections,
  type PromptOptions,
} from '@/lib/promptUtils'

export type { PromptOptions } from '@/lib/promptUtils'

const FASHN_API_BASE =
  process.env.FASHN_API_BASE?.replace(/\/+$/, '') ?? 'https://api.fashn.ai/v1'

export const buildPrompt = (
  options: PromptOptions,
  formSelections?: PromptFormSelections,
): string => assemblePrompt(options, formSelections).prompt

export const applyWatermark = (
  url: string,
  options: { cacheBust?: boolean; width?: number } = {},
): string => {
  if (!url.includes('/upload/')) {
    return url
  }

  const widthPart = options.width ? `w_${options.width},` : ''
  const overlayPart = 'l_modelcast_watermark,o_25,g_south_east,x_10,y_10'

  const alreadyApplied = url.includes('l_modelcast_watermark')
  const transformed = alreadyApplied
    ? url
    : url.replace('/upload/', `/upload/${widthPart}${overlayPart}/`)

  if (options.cacheBust) {
    const separator = transformed.includes('?') ? '&' : '?'
    return `${transformed}${separator}cb=${Date.now()}`
  }

  return transformed
}

export type FashnInputContext = {
  garmentImageUrl: string
  modelImageUrl?: string | null
  prompt: string
}

export type BuildFashnInputOptions = {
  includePrompt?: boolean
}

const INPUT_WHITELIST: Record<string, readonly string[]> = {
  'product-to-model': [
    'product_image',
    'output_format',
    'prompt',
    'target_aspect_ratio',
    'aspect_ratio',
    'style',
  ],
  'tryon-v1.6': [
    'model_image',
    'garment_image',
    'output_format',
    'prompt',
    'target_aspect_ratio',
    'aspect_ratio',
    'style',
    'width',
    'height',
  ],
  'tryon-v1.5': [
    'model_image',
    'garment_image',
    'output_format',
    'prompt',
    'target_aspect_ratio',
    'aspect_ratio',
    'style',
    'width',
    'height',
  ],
}

export const buildFashnInputs = (
  modelName: string,
  context: FashnInputContext,
  options: BuildFashnInputOptions = {},
) => {
  const includePrompt = options.includePrompt ?? true

  const base: Record<string, unknown> = {
    output_format: 'png',
  }

  if (includePrompt && context.prompt) {
    base.prompt = context.prompt
  }

  if (modelName.startsWith('tryon')) {
    if (!context.modelImageUrl) {
      throw new Error('MODEL_IMAGE_REQUIRED')
    }

    return {
      ...base,
      model_image: context.modelImageUrl,
      garment_image: context.garmentImageUrl,
    }
  }

  if (modelName === 'product-to-model') {
    return {
      ...base,
      product_image: context.garmentImageUrl,
    }
  }

  return base
}

export const getModelCandidates = (hasModelImage: boolean) =>
  hasModelImage ? ['tryon-v1.6', 'tryon-v1.5'] : ['product-to-model']

export const enforceInputWhitelist = (
  modelName: string,
  inputs: Record<string, unknown>,
) => {
  const allowedKeys = INPUT_WHITELIST[modelName]
  if (!allowedKeys) {
    return inputs
  }

  const allowed = new Set(allowedKeys)
  const sanitized = Object.entries(inputs).filter(([key]) => allowed.has(key))

  return Object.fromEntries(sanitized)
}

export const getFashnCapabilities = async (model: string) => {
  const url = `${FASHN_API_BASE}/models/${model}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.FASHN_API_KEY}` },
    })

    if (!res.ok) {
      console.warn(
        `[WARN] Failed to fetch Fashn capabilities for ${model}: ${res.status}`,
      )
      return {}
    }

    const data = await res.json()
    const inputsSource = data?.inputs ?? data ?? {}
    const inputs =
      Array.isArray(inputsSource) && inputsSource.every((value) => typeof value === 'string')
        ? Object.fromEntries(inputsSource.map((key: string) => [key, true]))
        : (inputsSource as Record<string, unknown>)

    const includesAspectRatio =
      Object.prototype.hasOwnProperty.call(inputs, 'aspect_ratio') ||
      Object.prototype.hasOwnProperty.call(inputs, 'target_aspect_ratio') ||
      Object.prototype.hasOwnProperty.call(inputs, 'aspectRatio') ||
      Object.prototype.hasOwnProperty.call(inputs, 'targetAspectRatio')

    return inputs
  } catch (error) {
    console.warn(
      `[WARN] Error during Fashn capability probe for ${model}`,
      error,
    )
    return {}
  }
}
