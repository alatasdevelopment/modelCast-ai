export interface GeneratedImage {
  id: string
  url: string
  timestamp: Date
  settings: {
    styleType: string
    gender: string
    ageGroup: string
    skinTone: string
    aspectRatio: string
  }
}
