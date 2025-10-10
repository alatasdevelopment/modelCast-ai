export type GenerationMode = "preview" | "hd"

export interface GeneratedImage {
  id: string
  url: string
  urls: string[]
  mode: GenerationMode
  timestamp: Date
  settings: {
    styleType: string
    gender: string
    ageGroup: string
    skinTone: string
    aspectRatio: string
  }
}
