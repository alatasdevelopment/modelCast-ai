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
    throw new Error(errorText || 'Cloudinary deletion failed.')
  }
}
