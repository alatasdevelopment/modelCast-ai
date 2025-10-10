'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Sparkles, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type CloudinaryUploadResult,
} from '@/lib/cloudinary'

export interface GenerationSettings {
  styleType: string
  gender: string
  ageGroup: string
  skinTone: string
  aspectRatio: string
  imageUrl: string
}

interface ModelGeneratorProps {
  onGenerate: (settings: GenerationSettings) => Promise<string | null | void> | string | null | void
  hasCredits: boolean
  modeLabel: string
  onUpgradeClick: () => void
}

const styleTypes = [
  { id: 'street', label: 'Street', icon: '🏙️' },
  { id: 'studio', label: 'Studio', icon: '📸' },
  { id: 'editorial', label: 'Editorial', icon: '📰' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
]

const skinTones = [
  { id: 'light', color: '#FFE0BD' },
  { id: 'medium', color: '#D4A574' },
  { id: 'tan', color: '#B8794E' },
  { id: 'dark', color: '#6B4423' },
]

type GenerationFormState = Omit<GenerationSettings, 'imageUrl'>

export function ModelGenerator({
  onGenerate,
  hasCredits,
  modeLabel,
  onUpgradeClick,
}: ModelGeneratorProps) {
  const [formValues, setFormValues] = useState<GenerationFormState>({
    styleType: 'street',
    gender: 'female',
    ageGroup: 'youth',
    skinTone: 'medium',
    aspectRatio: '3:4',
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cloudinaryAsset, setCloudinaryAsset] = useState<CloudinaryUploadResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const deleteTokenRef = useRef<string | null>(null)
  const deleteTimerRef = useRef<number | null>(null)

  const AUTO_DELETE_DELAY_MS = 30 * 60 * 1000

  const clearDeleteTimer = () => {
    if (typeof window === 'undefined') return
    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
    }
  }

  const scheduleAutoDeletion = (deleteToken?: string | null) => {
    clearDeleteTimer()

    if (!deleteToken || typeof window === 'undefined') {
      return
    }

    deleteTimerRef.current = window.setTimeout(() => {
      deleteFromCloudinary(deleteToken).catch((error) => {
        console.error('Failed to auto-delete Cloudinary upload', error)
      })
      deleteTokenRef.current = null
      deleteTimerRef.current = null
    }, AUTO_DELETE_DELAY_MS)
  }

  const deleteExistingAsset = async () => {
    clearDeleteTimer()
    const deleteToken = deleteTokenRef.current
    deleteTokenRef.current = null

    if (deleteToken) {
      try {
        await deleteFromCloudinary(deleteToken)
      } catch (error) {
        console.error('Failed to delete previous Cloudinary upload', error)
      }
    }
  }

  useEffect(() => {
    return () => {
      clearDeleteTimer()
      const deleteToken = deleteTokenRef.current
      if (deleteToken) {
        deleteFromCloudinary(deleteToken).catch((error) => {
          console.error('Failed to delete Cloudinary upload on cleanup', error)
        })
      }
    }
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Please upload an image file',
        description: 'Supported formats include PNG, JPG, and WEBP.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setPreviewUrl(null)
    setCloudinaryAsset(null)

    try {
      await deleteExistingAsset()
      const result = await uploadToCloudinary(file)
      setCloudinaryAsset(result)
      setPreviewUrl(result.secureUrl)
      deleteTokenRef.current = result.deleteToken ?? null
      scheduleAutoDeletion(result.deleteToken)
    } catch (error) {
      console.error('Cloudinary upload failed', error)
      toast({
        title: 'Upload failed',
        description: 'Could not upload your product image. Please try again.',
        variant: 'destructive',
      })
      setCloudinaryAsset(null)
      setPreviewUrl(null)
      deleteTokenRef.current = null
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return
    const file = event.target.files?.[0]
    if (file) void handleFileSelect(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (isUploading) return
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFileSelect(file)
  }

  const handleRemoveImage = async () => {
    setPreviewUrl(null)
    setCloudinaryAsset(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    await deleteExistingAsset()
  }

  const handleGenerate = async () => {
    if (isGenerating) return

    if (!hasCredits) {
      toast({
        title: 'Out of credits',
        description: 'You’ve used all your free previews. Upgrade to HD to continue.',
        variant: 'destructive',
      })
      return
    }

    if (isUploading) {
      toast({
        title: 'Upload in progress',
        description: 'Wait until your product image finishes uploading.',
        variant: 'destructive',
      })
      return
    }

    if (!cloudinaryAsset?.secureUrl) {
      toast({
        title: 'Product image required',
        description: 'Upload a product photo before generating.',
        variant: 'destructive',
      })
      return
    }

    const startedAt = Date.now()
    setIsGenerating(true)

    try {
      await onGenerate({ ...formValues, imageUrl: cloudinaryAsset.secureUrl })
    } catch (error) {
      console.error('Model generation failed', error)
    } finally {
      const replicateEnabled =
        typeof process.env.NEXT_PUBLIC_REPLICATE_ENABLED === 'string'
          ? process.env.NEXT_PUBLIC_REPLICATE_ENABLED === 'true'
          : false
      const minSpinnerDurationMs = replicateEnabled ? 0 : 900
      const elapsed = Date.now() - startedAt
      const remainingDelay = Math.max(minSpinnerDurationMs - elapsed, 0)

      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay))
      }

      setIsGenerating(false)
    }
  }

  return (
    <Card className="relative gap-6 overflow-hidden rounded-2xl border-white/12 bg-[#111111]/60 p-5 shadow-[0_0_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-7 lg:p-9">
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(159,255,87,0.55)] to-transparent" />

      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-green-muted)]">
          <Sparkles className="h-4 w-4 text-[var(--brand-green)]" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">ModelCast Studio</p>
          <h2 className="text-lg font-semibold tracking-[0.18em] text-neutral-50">Generate Model Shot</h2>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Upload Product Image</Label>
          <div
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onClick={() => {
              if (!isUploading) {
                fileInputRef.current?.click()
              }
            }}
            className={`relative flex ${isUploading ? 'cursor-progress opacity-80' : 'cursor-pointer'} flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition-colors sm:p-7 ${
              previewUrl
                ? 'border-[var(--brand-green)]/55 bg-[var(--brand-green-muted)] shadow-[0_0_22px_rgba(159,255,87,0.18)] ring-2 ring-[var(--brand-green)] ring-offset-2 ring-offset-[#0b0b0b]'
                : 'border-white/12 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]'
            }`}
          >
            {!previewUrl && !isUploading ? (
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.04] bg-[radial-gradient(circle_at_20%_20%,rgba(159,255,87,0.08),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(159,255,87,0.05),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(15,15,15,0.55)_90%)]" aria-hidden />
            ) : null}
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 text-neutral-300">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
                <p className="text-sm text-neutral-200">Uploading to secure storage…</p>
              </div>
            ) : previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="max-h-44 w-auto rounded-xl object-cover shadow-[0_0_20px_rgba(159,255,87,0.16)]"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleRemoveImage()
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
                  <Upload className="h-7 w-7 text-neutral-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-neutral-100">Click or drag to upload</p>
                  <p className="text-sm text-neutral-400">Supports PNG, JPG, WEBP up to 10MB.</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Style Type</Label>
          <RadioGroup
            value={formValues.styleType}
            onValueChange={(value) =>
              setFormValues((current) => ({ ...current, styleType: value }))
            }
            className="grid gap-3 sm:grid-cols-2"
          >
            {styleTypes.map((style) => (
              <Label
                key={style.id}
                htmlFor={style.id}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 text-base text-neutral-200 transition ${
                  formValues.styleType === style.id
                    ? 'border-transparent bg-white/[0.06] text-neutral-50 shadow-[0_0_22px_rgba(159,255,87,0.18)] ring-2 ring-[var(--brand-green)] ring-offset-2 ring-offset-[#0b0b0b]'
                    : 'border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-neutral-50'
                }`}
              >
                <RadioGroupItem value={style.id} id={style.id} className="sr-only" />
                <span className="text-2xl">{style.icon}</span>
                {style.label}
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Model Gender</Label>
          <RadioGroup
            value={formValues.gender}
            onValueChange={(value) =>
              setFormValues((current) => ({ ...current, gender: value }))
            }
            className="grid grid-cols-2 gap-3"
          >
            {['female', 'male'].map((gender) => (
              <Label
                key={gender}
                htmlFor={gender}
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-4 text-base capitalize text-neutral-200 transition ${
                  formValues.gender === gender
                    ? 'border-transparent bg-white/[0.06] text-neutral-50 shadow-[0_0_22px_rgba(159,255,87,0.18)] ring-2 ring-[var(--brand-green)] ring-offset-2 ring-offset-[#0b0b0b]'
                    : 'border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-neutral-50'
                }`}
              >
                <RadioGroupItem value={gender} id={gender} className="sr-only" />
                {gender}
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Age Group</Label>
          <RadioGroup
            value={formValues.ageGroup}
            onValueChange={(value) =>
              setFormValues((current) => ({ ...current, ageGroup: value }))
            }
            className="grid grid-cols-3 gap-3"
          >
            {['children', 'youth', 'elderly'].map((age) => (
              <Label
                key={age}
                htmlFor={age}
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-sm font-medium uppercase tracking-wide text-neutral-300 transition ${
                  formValues.ageGroup === age
                    ? 'border-transparent bg-white/[0.06] text-neutral-50 shadow-[0_0_22px_rgba(159,255,87,0.18)] ring-2 ring-[var(--brand-green)] ring-offset-2 ring-offset-[#0b0b0b]'
                    : 'border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-neutral-50'
                }`}
              >
                <RadioGroupItem value={age} id={age} className="sr-only" />
                {age}
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Skin Tone</Label>
          <div className="grid grid-cols-4 gap-4">
            {skinTones.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() =>
                  setFormValues((current) => ({ ...current, skinTone: tone.id }))
                }
                className={`h-12 rounded-xl border transition hover:scale-[1.02] ${
                  formValues.skinTone === tone.id
                    ? 'border-transparent shadow-[0_0_18px_rgba(159,255,87,0.18)] ring-2 ring-[var(--brand-green)] ring-offset-2 ring-offset-[#0b0b0b]'
                    : 'border-white/15 hover:border-white/25'
                }`}
                style={{ backgroundColor: tone.color }}
                aria-label={tone.id}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Aspect Ratio</Label>
          <Select
            value={formValues.aspectRatio}
            onValueChange={(value) =>
              setFormValues((current) => ({ ...current, aspectRatio: value }))
            }
          >
            <SelectTrigger className="border-white/12 bg-white/[0.025] text-neutral-200 transition hover:border-white/25 hover:bg-white/[0.05]">
              <SelectValue placeholder="Select an aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
              <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
              <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
              <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="group">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || isUploading || !hasCredits || !cloudinaryAsset?.secureUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-green)] to-[var(--brand-green-hover)] py-5 text-base font-semibold text-black shadow-[0_0_22px_rgba(159,255,87,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(159,255,87,0.35)] focus-visible:shadow-[0_0_30px_rgba(159,255,87,0.4)] disabled:translate-y-0 disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Image
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.18em] text-[rgba(159,255,87,0.72)]">
            {modeLabel}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-neutral-400">
            {modeLabel.startsWith('Preview')
              ? 'Preview mode delivers one watermarked image and uses 1 credit ($1).'
              : 'HD mode delivers two high-res images and uses 1 credit ($1).'}
          </p>
          {!hasCredits ? (
            <div className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.03] to-black/60 px-5 py-4 text-sm text-neutral-100 shadow-[0_0_22px_rgba(0,0,0,0.35)]">
              <p className="font-medium text-neutral-200">You’ve used all your free previews.</p>
              <p className="mt-1 text-xs text-neutral-400">Unlock HD mode to keep generating fresh looks.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full justify-center rounded-lg border-[var(--brand-green)]/65 bg-black/60 text-sm font-semibold text-[var(--brand-green)] transition hover:-translate-y-0.5 hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
                onClick={onUpgradeClick}
              >
                Buy another credit
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
