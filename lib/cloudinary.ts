export interface CloudinaryUploadResult {
  secureUrl: string
  deleteToken?: string
  publicId: string
}

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudinaryUploadError'
  }
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const DEFAULT_UPLOAD_FOLDER = 'modelcast/uploads'

const parseCloudinaryErrorMessage = (rawBody: string | null, fallback: string) => {
  if (!rawBody) return fallback
  try {
    const parsed = JSON.parse(rawBody)
    if (typeof parsed?.error === 'string') return parsed.error
    if (typeof parsed?.error?.message === 'string') return parsed.error.message
    if (typeof parsed?.message === 'string') return parsed.message
  } catch {
    // Not JSON — fall through to raw text
  }
  return rawBody
}

const resolveFolder = (folder?: string) => {
  if (typeof folder !== 'string') return DEFAULT_UPLOAD_FOLDER
  const trimmed = folder.trim()
  return trimmed || DEFAULT_UPLOAD_FOLDER
}

export async function uploadToCloudinary(
  file: File,
  options: { folder?: string } = {},
): Promise<CloudinaryUploadResult> {
  const { folder } = options
  const normalizedFolder = resolveFolder(folder)
  let response: Response
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', normalizedFolder)
    response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    throw new CloudinaryUploadError(
      error instanceof Error ? error.message : 'Failed to reach upload endpoint.',
    )
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new CloudinaryUploadError(parseCloudinaryErrorMessage(errorText, 'Upload failed.'))
  }

  const data = await response.json().catch(() => {
    throw new CloudinaryUploadError('Invalid upload response received.')
  })

  if (typeof data?.secureUrl !== 'string' || typeof data?.publicId !== 'string') {
    throw new CloudinaryUploadError('Upload response missing required fields.')
  }

  return {
    secureUrl: data.secureUrl,
    deleteToken: data.deleteToken ?? undefined,
    publicId: data.publicId,
  }
}

export async function deleteFromCloudinary(deleteToken: string): Promise<void> {
  if (!cloudName) {
    throw new Error('Cloudinary is not configured. Check NEXT_PUBLIC_CLOUDINARY_* env vars.')
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`
  const formData = new FormData()
  formData.append('token', deleteToken)

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (errorText.toLowerCase().includes('stale request')) {
      console.warn('[cloudinary] Ignoring stale delete token response.')
      return
    }
    throw new CloudinaryUploadError(parseCloudinaryErrorMessage(errorText, 'Cloudinary deletion failed.'))
  }
}

const WATERMARK_TEXT = 'ModelCast Preview'
const WATERMARK_TEXT_ENCODED = encodeURIComponent(WATERMARK_TEXT)

const isAlreadyWatermarked = (url: string) => url.includes(WATERMARK_TEXT_ENCODED)

export function buildWatermarkedPreviewUrl(sourceUrl: string): string {
  if (!cloudName || !sourceUrl || isAlreadyWatermarked(sourceUrl)) {
    return sourceUrl
  }

  const encodedSource = encodeURIComponent(sourceUrl)
  const transformation = `l_text:Montserrat_44_bold:${WATERMARK_TEXT_ENCODED},co_rgb:ffffff,opacity_30,g_south,y_40`

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transformation}/${encodedSource}`
}

const MODELCAST_OVERLAY = 'l_modelcast_watermark,o_25,g_south_east,x_10,y_10'

const hasModelcastOverlay = (url: string): boolean => url.includes('l_modelcast_watermark')

const appendCacheBuster = (url: string) => {
  try {
    const next = new URL(url)
    next.searchParams.set('cb', Date.now().toString())
    return next.toString()
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}cb=${Date.now()}`
  }
}

export const ensureModelcastWatermark = (
  url: string,
  options: { cacheBust?: boolean } = {},
): string => {
  if (!url || !url.includes('/upload/')) {
    return url
  }

  const alreadyHasOverlay = hasModelcastOverlay(url)
  const transformed = alreadyHasOverlay
    ? url
    : url.replace('/upload/', `/upload/${MODELCAST_OVERLAY}/`)

  if (options.cacheBust && !alreadyHasOverlay) {
    return appendCacheBuster(transformed)
  }

  return transformed
}

export const hasModelcastWatermark = (url: string): boolean => hasModelcastOverlay(url)
