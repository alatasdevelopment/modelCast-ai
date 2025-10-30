type MappingCategory = keyof typeof PROMPT_MAPPINGS

const normalizeToken = (value?: string) => {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined
}

export const PROMPT_MAPPINGS = {
  skinTone: {
    light: "fair-skinned",
    fair: "fair-skinned",
    pale: "fair-skinned",
    medium: "medium-skinned",
    tan: "medium-skinned",
    olive: "olive-toned",
    dark: "dark-skinned",
    deep: "dark-skinned",
  },
  styleType: {
    street: "street fashion",
    studio: "studio photography",
    editorial: "editorial magazine style",
    outdoor: "outdoor natural light",
  },
  ageGroup: {
    children: "child",
    child: "child",
    kid: "child",
    kids: "child",
    youth: "young adult",
    young: "young adult",
    teen: "teen",
    teenager: "teen",
    adult: "adult",
    "middle-aged": "middle-aged",
    middle: "middle-aged",
    senior: "elderly",
    elderly: "elderly",
  },
} as const

const ENVIRONMENT_DESCRIPTORS: Record<string, string> = {
  studio: "studio lighting with neutral background",
  outdoor: "outdoors in natural daylight",
  urban: "urban city backdrop",
}

const MODEL_TYPE_DESCRIPTORS: Record<string, string> = {
  fashion: "fashion editorial setting",
  portrait: "portrait photography style",
  street: "street fashion setting",
}

const STYLE_DESCRIPTORS: Record<string, string> = {
  streetwear: "streetwear outfit",
  formal: "tailored formal look",
  casual: "casual everyday style",
  sporty: "sporty athleisure wear",
}

const ASPECT_RATIO_DESCRIPTORS: Record<string, string> = {
  "1:1": "a square aspect ratio",
  "3:4": "a portrait aspect ratio",
  "4:5": "a portrait aspect ratio",
  "9:16": "a vertical portrait aspect ratio",
  "16:9": "a widescreen landscape aspect ratio",
}

const mapAttribute = (category: MappingCategory, value?: string) => {
  const normalized = normalizeToken(value)
  if (!normalized) return undefined

  const mapping = PROMPT_MAPPINGS[category]
  return mapping[normalized as keyof typeof mapping] ?? undefined
}

const describeEnvironment = (environment?: string) => {
  const normalized = normalizeToken(environment)
  if (!normalized) return undefined
  return ENVIRONMENT_DESCRIPTORS[normalized] ?? undefined
}

const describeModelType = (modelType?: string) => {
  const normalized = normalizeToken(modelType)
  if (!normalized) return undefined
  return MODEL_TYPE_DESCRIPTORS[normalized] ?? undefined
}

const describeStyle = (style?: string, fallback?: string) => {
  const normalized = normalizeToken(style)
  if (!normalized) return fallback
  return STYLE_DESCRIPTORS[normalized] ?? fallback
}

const describeAspectRatio = (aspectRatio?: string) => {
  if (!aspectRatio) return undefined
  const trimmed = aspectRatio.trim()
  if (trimmed.length === 0) return undefined
  return ASPECT_RATIO_DESCRIPTORS[trimmed] ?? `${trimmed} aspect ratio`
}

export type PromptOptions = {
  environment?: string
  modelType?: string
  ageGroup?: string
  gender?: string
  style?: string
  skinTone?: string
  styleType?: string
  aspectRatio?: string
}

export type PromptFormSelections = {
  styleType?: string
  gender?: string
  ageGroup?: string
  skinTone?: string
  aspectRatio?: string
}

export type PromptAssemblyResult = {
  prompt: string
  resolved: {
    age?: string
    gender?: string
    skinTone?: string
    style?: string
    environment?: string
    modelType?: string
    aspectRatio?: string
  }
  missing: string[]
}

export const assemblePrompt = (
  options: PromptOptions,
  formSelections?: PromptFormSelections,
): PromptAssemblyResult => {
  const resolvedGender = normalizeToken(formSelections?.gender ?? options.gender)
  const resolvedAgeGroup = normalizeToken(formSelections?.ageGroup ?? options.ageGroup)
  const resolvedSkinTone = normalizeToken(formSelections?.skinTone ?? options.skinTone)
  const resolvedStyleType = normalizeToken(formSelections?.styleType ?? options.styleType)
  const resolvedAspectRatio = formSelections?.aspectRatio ?? options.aspectRatio

  const ageDescriptor = mapAttribute("ageGroup", resolvedAgeGroup ?? undefined)
  const toneDescriptor = mapAttribute("skinTone", resolvedSkinTone ?? undefined)
  const styleDescriptor = mapAttribute("styleType", resolvedStyleType ?? undefined)
  const environmentDescriptor = describeEnvironment(options.environment)
  const modelTypeDescriptor = describeModelType(options.modelType)
  const fallbackStyle = describeStyle(options.style, options.style ? `${options.style} outfit` : undefined)

  const subjectParts: string[] = []
  if (ageDescriptor) {
    subjectParts.push(ageDescriptor)
  } else if (resolvedAgeGroup) {
    subjectParts.push(resolvedAgeGroup)
  }

  if (resolvedGender) {
    subjectParts.push(resolvedGender)
  }

  const subjectLabel = subjectParts.length > 0 ? `${subjectParts.join(" ")} model` : "model"

  const toneClause = toneDescriptor
    ? `with ${toneDescriptor} skin`
    : resolvedSkinTone
      ? `with ${resolvedSkinTone} skin tone`
      : undefined

  const leadClause = toneClause ? `Full-body ${subjectLabel} ${toneClause}` : `Full-body ${subjectLabel}`

  const garmentClause = "wearing the uploaded garment, garment clearly visible"

  const photoDescriptors = [
    styleDescriptor ?? fallbackStyle,
    modelTypeDescriptor,
    environmentDescriptor,
  ].filter(Boolean)

  const aspectDescriptor = describeAspectRatio(resolvedAspectRatio)

  const assembledSegments = [
    `${leadClause}, ${garmentClause}`,
    photoDescriptors.length > 0 ? `${photoDescriptors.join(", ")}` : undefined,
    aspectDescriptor ? `Shot in ${aspectDescriptor}` : undefined,
    "neutral background, professional lighting, crisp details",
  ].filter(Boolean) as string[]

  const prompt = assembledSegments.join(", ").replace(/\s+/g, " ").trim()

  const missing: string[] = []
  if (resolvedSkinTone && !toneDescriptor) missing.push("skinTone")
  if (resolvedStyleType && !styleDescriptor) missing.push("styleType")
  if (resolvedAgeGroup && !ageDescriptor) missing.push("ageGroup")

  return {
    prompt,
    resolved: {
      age: ageDescriptor ?? resolvedAgeGroup ?? undefined,
      gender: resolvedGender ?? undefined,
      skinTone: toneDescriptor ?? resolvedSkinTone ?? undefined,
      style: styleDescriptor ?? fallbackStyle ?? undefined,
      environment: environmentDescriptor ?? options.environment ?? undefined,
      modelType: modelTypeDescriptor ?? options.modelType ?? undefined,
      aspectRatio: aspectDescriptor ?? resolvedAspectRatio ?? undefined,
    },
    missing,
  }
}
