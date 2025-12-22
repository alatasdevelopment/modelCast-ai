export function getRequiredEnv(nameCandidates: string[]): string {
  for (const candidate of nameCandidates) {
    const value = process.env[candidate]
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }

  const formatted = nameCandidates.join(", ")
  throw new Error(`Missing required environment variable. Set one of: ${formatted}`)
}
