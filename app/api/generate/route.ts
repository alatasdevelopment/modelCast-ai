import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
const REPLICATE_MODEL_VERSION = process.env.REPLICATE_MODEL_VERSION
const REPLICATE_ENABLED = process.env.REPLICATE_ENABLED === "true"
const isProduction = process.env.NODE_ENV === "production"

interface GenerateRequestBody {
  imageUrl?: string
  image?: string
  style?: string
  styleType?: string
  gender?: string
  age?: string
  ageGroup?: string
  tone?: string
  skinTone?: string
}

const CLOUDINARY_PREFIX = "https://res.cloudinary.com/"
const POLL_DELAYS = [2000, 3000, 5000, 8000]
const POLL_TIMEOUT_MS = 60 * 1000

const logInfo = (...args: unknown[]) => {
  if (!isProduction) {
    console.info(...args)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type ParsedPayload = {
  imageUrl: string
  style: string
  gender: string
  age: string
  tone: string
}

const parseRequestPayload = async (request: Request): Promise<ParsedPayload> => {
  let payload: GenerateRequestBody

  try {
    payload = (await request.json()) as GenerateRequestBody
  } catch {
    throw new Error('INVALID_PAYLOAD')
  }

  const imageUrl = payload.imageUrl ?? payload.image
  const style = payload.style ?? payload.styleType
  const gender = payload.gender
  const age = payload.age ?? payload.ageGroup
  const tone = payload.tone ?? payload.skinTone

  if (
    typeof imageUrl !== 'string' ||
    typeof style !== 'string' ||
    typeof gender !== 'string' ||
    typeof age !== 'string' ||
    typeof tone !== 'string'
  ) {
    throw new Error('INVALID_PAYLOAD')
  }

  if (!imageUrl.startsWith(CLOUDINARY_PREFIX)) {
    throw new Error('INVALID_IMAGE_URL')
  }

  return {
    imageUrl,
    style,
    gender,
    age,
    tone,
  }
}

const buildPrompt = ({
  style,
  gender,
  age,
  tone,
}: {
  style: string
  gender: string
  age: string
  tone: string
}) => `AI model shot, ${style} style, ${gender} model, ${age} group, ${tone} tone`

const callReplicate = async ({
  imageUrl,
  prompt,
}: {
  imageUrl: string
  prompt: string
}) => {
  if (!REPLICATE_MODEL_VERSION || !REPLICATE_API_TOKEN) {
    throw new Error('Replicate environment variables are not configured.')
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: {
        image: imageUrl,
        prompt,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Replicate request failed (${response.status})`)
  }

  return (await response.json()) as { id: string }
}

const fetchPredictionStatus = async (predictionId: string) => {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('Replicate API token missing')
  }

  const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Replicate status failed (${response.status})`)
  }

  return (await response.json()) as {
    status: string
    output?: unknown
    error?: string
  }
}

const extractOutputUrl = (output: unknown): string | null => {
  if (Array.isArray(output) && typeof output[0] === 'string') {
    return output[0]
  }

  if (typeof output === 'string') {
    return output
  }

  return null
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[generate] Unauthorized request', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let parsedPayload: ParsedPayload

    try {
      parsedPayload = await parseRequestPayload(request)
    } catch (error) {
      if ((error as Error).message === 'INVALID_IMAGE_URL' || (error as Error).message === 'INVALID_PAYLOAD') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
      }
      console.error('[generate] payload parsing failed', error)
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[generate] failed to fetch credits', profileError)
      return NextResponse.json({ error: 'Unable to verify credits' }, { status: 500 })
    }

    const credits = typeof profile?.credits === 'number' ? profile.credits : 0

    if (credits <= 0) {
      return NextResponse.json({ error: 'Out of credits' }, { status: 402 })
    }

    if (!REPLICATE_ENABLED) {
      const mockResponse = {
        success: true,
        mock: true,
        outputUrl: '/placeholder/mock-preview.png',
        outputUrls: ['/placeholder/mock-preview.png'],
        status: 'succeeded',
        creditsUsed: 1,
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: credits - 1 })
        .eq('id', user.id)

      if (updateError) {
        console.error('[generate] failed to decrement credits (mock)', updateError)
        return NextResponse.json({ error: 'Unable to update credits' }, { status: 500 })
      }

      return NextResponse.json(mockResponse)
    }

    const prompt = buildPrompt(parsedPayload)
    const prediction = await callReplicate({
      imageUrl: parsedPayload.imageUrl,
      prompt,
    })

    logInfo('[generate] replicate start', { predictionId: prediction.id })

    const start = Date.now()
    let attempt = 0

    while (Date.now() - start < POLL_TIMEOUT_MS) {
      const status = await fetchPredictionStatus(prediction.id)

      if (status.status === 'succeeded') {
        const outputUrl = extractOutputUrl(status.output)

        if (!outputUrl) {
          throw new Error('Prediction succeeded without output URL')
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ credits: credits - 1 })
          .eq('id', user.id)

        if (updateError) {
          console.error('[generate] failed to decrement credits', updateError)
          return NextResponse.json({ error: 'Unable to update credits' }, { status: 500 })
        }

        logInfo('[generate] replicate completed', { predictionId: prediction.id })

        return NextResponse.json({
          success: true,
          outputUrl,
          outputUrls: [outputUrl],
          creditsUsed: 1,
        })
      }

      if (status.status === 'failed' || status.status === 'canceled') {
        console.error('[generate] prediction failed', status)
        return NextResponse.json(
          { success: false, error: 'Generation failed' },
          { status: 500 },
        )
      }

      const delay = POLL_DELAYS[Math.min(attempt, POLL_DELAYS.length - 1)]
      attempt += 1
      await sleep(delay)
    }

    console.error('[generate] prediction timeout exceeded', { predictionId: prediction.id })
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  } catch (error) {
    console.error('[generate] server error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
