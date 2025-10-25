export type PromptOptions = {
  environment?: string
  modelType?: string
  ageGroup?: string
  gender?: string
  style?: string
  skinTone?: string
}

export const buildPrompt = (options: PromptOptions): string => {
  const parts: string[] = []

  switch (options.modelType) {
    case 'fashion':
      parts.push('full-body fashion model photo')
      break
    case 'portrait':
      parts.push('professional studio portrait')
      break
    case 'street':
      parts.push('street style fashion photo')
      break
    default:
      if (options.modelType) {
        parts.push(`${options.modelType} fashion photo`)
      }
  }

  switch (options.environment) {
    case 'outdoor':
      parts.push('shot outdoors with natural lighting')
      break
    case 'studio':
      parts.push('shot in a studio with neutral background')
      break
    case 'urban':
      parts.push('urban city background')
      break
    default:
      if (options.environment) {
        parts.push(`${options.environment} background`)
      }
  }

  switch (options.ageGroup) {
    case 'young':
      parts.push('young adult model')
      break
    case 'middle-aged':
      parts.push('middle-aged person')
      break
    case 'senior':
      parts.push('elderly person')
      break
    default:
      if (options.ageGroup) {
        parts.push(`${options.ageGroup} model`)
      }
  }

  if (options.gender) {
    parts.push(options.gender)
  }

  if (options.style) {
    parts.push(`${options.style} outfit`)
  }

  if (options.skinTone) {
    parts.push(`${options.skinTone} skin tone`)
  }

  if (parts.length === 0) {
    parts.push('professional fashion photography')
  }

  return parts.join(', ')
}

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

const INPUT_WHITELIST: Record<string, readonly string[]> = {
  'product-to-model': ['product_image', 'output_format', 'prompt'],
  'tryon-v1.6': ['model_image', 'garment_image', 'output_format', 'prompt'],
  'tryon-v1.5': ['model_image', 'garment_image', 'output_format', 'prompt'],
}

export const buildFashnInputs = (
  modelName: string,
  context: FashnInputContext,
) => {
  const base = {
    output_format: 'png',
    prompt: context.prompt,
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
