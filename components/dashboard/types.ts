export type GenerationMode = "preview" | "hd"
export type PlanTier = "free" | "pro" | "studio"

export interface GeneratedImage {
  id: string
  url: string
  urls: string[]
  mode: GenerationMode
  timestamp: Date
  plan: PlanTier
  settings?: {
    styleType: string
    gender: string
    ageGroup: string
    skinTone: string
    aspectRatio: string
  }
}

export interface FlattenedGeneratedImage {
  id: string
  url: string
  mode: GenerationMode
  timestamp: Date
  plan: PlanTier
}
