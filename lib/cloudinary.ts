export interface CloudinaryUploadResult {
  secureUrl: string
  deleteToken?: string
  publicId: string
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured. Check NEXT_PUBLIC_CLOUDINARY_* env vars.')
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Cloudinary upload failed.')
  }

  const data = await response.json()

  return {
    secureUrl: data.secure_url,
    deleteToken: data.delete_token ?? undefined,
    publicId: data.public_id,
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
    throw new Error(errorText || 'Cloudinary deletion failed.')
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
