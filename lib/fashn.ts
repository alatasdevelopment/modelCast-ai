import {
  assemblePrompt,
  type PromptFormSelections,
  type PromptOptions,
} from '@/lib/promptUtils'

export type { PromptOptions } from '@/lib/promptUtils'

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
  'product-to-model': ['product_image', 'output_format', 'prompt'],
  'tryon-v1.6': ['model_image', 'garment_image', 'output_format', 'prompt'],
  'tryon-v1.5': ['model_image', 'garment_image', 'output_format', 'prompt'],
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
