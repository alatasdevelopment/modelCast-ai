import 'server-only'

const replicateEnabled = process.env.REPLICATE_ENABLED === 'true'
const replicateToken = process.env.REPLICATE_API_TOKEN

if (replicateEnabled && !replicateToken) {
  console.warn('Missing REPLICATE_API_TOKEN environment variable. Replicate requests will fail.')
}

const replicateBaseUrl = 'https://api.replicate.com/v1'

export interface CreatePredictionPayload {
  image: string
  model: string
  style: string
  skinTone: string
  aspectRatio: string
  version: string
  numOutputs?: number
}

export interface ReplicatePrediction {
  id: string
  status: string
  output?: unknown
  error?: string
}

async function replicateFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  if (!replicateToken) {
    throw new Error('Replicate API token is not configured.')
  }

  const response = await fetch(`${replicateBaseUrl}${input}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${replicateToken}`,
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Replicate request failed (${response.status}).`)
  }

  return (await response.json()) as T
}

export async function createPrediction(payload: CreatePredictionPayload): Promise<ReplicatePrediction> {
  const numOutputs = payload.numOutputs ?? 2
  if (!replicateEnabled) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return {
      id: `mock-${Date.now()}`,
      status: 'succeeded',
      output: Array.from({ length: numOutputs }, () => `${siteUrl.replace(/\/$/, '')}/mock-results/sample-result.jpg`),
    }
  }

  const body = {
    version: payload.version,
    input: {
      image: payload.image,
      model: payload.model,
      style: payload.style,
      skin_tone: payload.skinTone,
      aspect_ratio: payload.aspectRatio,
      num_outputs: numOutputs,
    },
  }

  return replicateFetch<ReplicatePrediction>('/predictions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  if (!replicateEnabled) {
    return {
      id: predictionId,
      status: 'succeeded',
      output: [`${(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/mock-results/sample-result.jpg`],
    }
  }

  return replicateFetch<ReplicatePrediction>(`/predictions/${predictionId}`, {
    method: 'GET',
  })
}

export async function waitForPrediction(
  predictionId: string,
  { pollIntervalMs = 2000, timeoutMs = 120000, expectedOutputs = 1 } = {},
): Promise<ReplicatePrediction> {
  if (!replicateEnabled) {
    return {
      id: predictionId,
      status: 'succeeded',
      output: Array.from({ length: expectedOutputs }, () => `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/mock-results/sample-result.jpg`),
    }
  }

  const start = Date.now()

  while (true) {
    const prediction = await getPrediction(predictionId)

    if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
      return prediction
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error('Replicate prediction timed out.')
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }
}
