"use client"

import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react'
import { Loader2, Lock, Sparkles, Upload, X } from 'lucide-react'

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
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  type CloudinaryUploadResult,
} from '@/lib/cloudinary'
import type { PlanTier } from '@/components/dashboard/types'

export interface GenerationSettings {
  styleType: string
  gender: string
  ageGroup: string
  skinTone: string
  aspectRatio: string
  garmentImageUrl: string
  modelImageUrl: string | null
  mode: 'basic' | 'advanced'
}

interface ModelGeneratorProps {
  onGenerate: (settings: GenerationSettings) => Promise<string | null | void> | string | null | void
  hasCredits: boolean
  modeLabel: string
  onUpgradeClick: () => void
  isPro: boolean
  plan: PlanTier
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

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '2:3', label: '2:3 (Portrait Classic)' },
  { value: '3:2', label: '3:2 (Landscape Classic)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '4:3', label: '4:3 (Landscape)' },
  { value: '4:5', label: '4:5 (Instagram Portrait)' },
  { value: '5:4', label: '5:4 (Magazine)' },
  { value: '9:16', label: '9:16 (Vertical Video)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
]

type GenerationFormState = Omit<GenerationSettings, 'garmentImageUrl' | 'modelImageUrl' | 'mode'>
type UploadSlot = 'garment' | 'model'

const uploadCopy: Record<UploadSlot, { title: string; subtitle: string }> = {
  garment: {
    title: 'Upload Product Image',
    subtitle: 'Use a product cut-out on transparent or plain background.',
  },
  model: {
    title: 'Upload Model Image',
    subtitle: 'Add the reference model photo to dress up.',
  },
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_UPLOAD_LABEL = `${(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)} MB`

export function ModelGenerator({
  onGenerate,
  hasCredits,
  modeLabel,
  onUpgradeClick,
  isPro,
  plan,
}: ModelGeneratorProps) {
  const [formValues, setFormValues] = useState<GenerationFormState>({
    styleType: 'street',
    gender: 'female',
    ageGroup: 'youth',
    skinTone: 'medium',
    aspectRatio: '3:4',
  })

  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null)
  const [modelPreviewUrl, setModelPreviewUrl] = useState<string | null>(null)
  const [garmentAsset, setGarmentAsset] = useState<CloudinaryUploadResult | null>(null)
  const [modelAsset, setModelAsset] = useState<CloudinaryUploadResult | null>(null)
  const [uploadingState, setUploadingState] = useState<{ garment: boolean; model: boolean }>({
    garment: false,
    model: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [poseGuidanceVisible, setPoseGuidanceVisible] = useState(false)
  const [poseExamplesOpen, setPoseExamplesOpen] = useState(false)

  const modelSlotEnabled = isPro && advancedMode
  const tryOnModeActive = modelSlotEnabled
  const showModelAppearanceControls = !tryOnModeActive

  const garmentFileInputRef = useRef<HTMLInputElement>(null)
  const modelFileInputRef = useRef<HTMLInputElement>(null)
  const garmentDeleteTokenRef = useRef<string | null>(null)
  const modelDeleteTokenRef = useRef<string | null>(null)
  const garmentDeleteTimerRef = useRef<number | null>(null)
  const modelDeleteTimerRef = useRef<number | null>(null)

  const AUTO_DELETE_DELAY_MS = 30 * 60 * 1000

  const getFileInputRef = (slot: UploadSlot) =>
    slot === 'garment' ? garmentFileInputRef : modelFileInputRef
  const getDeleteTokenRef = (slot: UploadSlot) =>
    slot === 'garment' ? garmentDeleteTokenRef : modelDeleteTokenRef
  const getDeleteTimerRef = (slot: UploadSlot) =>
    slot === 'garment' ? garmentDeleteTimerRef : modelDeleteTimerRef
  const setPreviewForSlot = (slot: UploadSlot, value: string | null) =>
    slot === 'garment' ? setGarmentPreviewUrl(value) : setModelPreviewUrl(value)
  const setAssetForSlot = (slot: UploadSlot, value: CloudinaryUploadResult | null) =>
    slot === 'garment' ? setGarmentAsset(value) : setModelAsset(value)
  const getPreviewForSlot = (slot: UploadSlot) =>
    slot === 'garment' ? garmentPreviewUrl : modelPreviewUrl
  const getAssetForSlot = (slot: UploadSlot) => (slot === 'garment' ? garmentAsset : modelAsset)

  const clearDeleteTimer = (slot: UploadSlot) => {
    if (typeof window === 'undefined') return
    const timerRef = getDeleteTimerRef(slot)
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const scheduleAutoDeletion = (slot: UploadSlot, deleteToken?: string | null) => {
    clearDeleteTimer(slot)
    if (!deleteToken || typeof window === 'undefined') {
      return
    }

    const timerRef = getDeleteTimerRef(slot)
    timerRef.current = window.setTimeout(() => {
      deleteFromCloudinary(deleteToken).catch((error) => {
        console.error('Failed to auto-delete Cloudinary upload', error)
      })
      const tokenRef = getDeleteTokenRef(slot)
      tokenRef.current = null
      timerRef.current = null
    }, AUTO_DELETE_DELAY_MS)
  }

  const deleteExistingAsset = async (slot: UploadSlot) => {
    clearDeleteTimer(slot)
    const tokenRef = getDeleteTokenRef(slot)
    const deleteToken = tokenRef.current
    tokenRef.current = null

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
      ;(['garment', 'model'] as UploadSlot[]).forEach((slot) => {
        clearDeleteTimer(slot)
        const tokenRef = getDeleteTokenRef(slot)
        const deleteToken = tokenRef.current
        tokenRef.current = null
        if (deleteToken) {
          deleteFromCloudinary(deleteToken).catch((error) => {
            console.error('Failed to delete Cloudinary upload on cleanup', error)
          })
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!isPro) {
      setAdvancedMode(false)
      setModelAsset(null)
      setModelPreviewUrl(null)
      const fileInput = modelFileInputRef.current
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }, [isPro])

  const handleFileSelect = async (slot: UploadSlot, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Please upload an image file',
        description: 'Supported formats include PNG, JPG, and WEBP.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'Image exceeds size limit',
        description: `Please keep your ${slot === 'garment' ? 'product' : 'model'} photo under ${MAX_UPLOAD_LABEL}. Compress the file and try again.`,
        variant: 'destructive',
      })
      return
    }

    setUploadingState((state) => ({ ...state, [slot]: true }))
    setPreviewForSlot(slot, null)
    setAssetForSlot(slot, null)

    try {
      await deleteExistingAsset(slot)
      const result = await uploadToCloudinary(file)
      setAssetForSlot(slot, result)
      setPreviewForSlot(slot, result.secureUrl)
      const tokenRef = getDeleteTokenRef(slot)
      tokenRef.current = result.deleteToken ?? null
      scheduleAutoDeletion(slot, result.deleteToken)
    } catch (error) {
      const userMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Could not upload your image. Please try again.'
      const normalizedMessage = userMessage.toLowerCase()
      const friendlyMessage = normalizedMessage.includes('file size too large') || normalizedMessage.includes('maximum is')
        ? `Images must be under ${MAX_UPLOAD_LABEL}. Compress your file and try again.`
        : userMessage
      console.warn('[cloudinary] upload failed', error)
      toast({
        title: 'Upload failed',
        description: friendlyMessage,
        variant: 'destructive',
      })
      setAssetForSlot(slot, null)
      setPreviewForSlot(slot, null)
      const tokenRef = getDeleteTokenRef(slot)
      tokenRef.current = null
    } finally {
      const fileInput = getFileInputRef(slot).current
      if (fileInput) {
        fileInput.value = ''
      }
      setUploadingState((state) => ({ ...state, [slot]: false }))
    }
  }

  const handleFileChange = (slot: UploadSlot, event: ChangeEvent<HTMLInputElement>) => {
    if (uploadingState.garment || uploadingState.model) return
    if (slot === 'model' && !modelSlotEnabled) return
    const file = event.target.files?.[0]
    if (file) void handleFileSelect(slot, file)
  }

  const handleDrop = (slot: UploadSlot, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (uploadingState.garment || uploadingState.model) return
    if (slot === 'model' && !modelSlotEnabled) return
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFileSelect(slot, file)
  }

  const handleRemoveImage = async (slot: UploadSlot) => {
    setPreviewForSlot(slot, null)
    setAssetForSlot(slot, null)
    const fileInput = getFileInputRef(slot).current
    if (fileInput) {
      fileInput.value = ''
    }
    await deleteExistingAsset(slot)
  }

  const handleAdvancedToggle = (value: boolean) => {
    if (!isPro) {
      return
    }

    if (!value) {
      void handleRemoveImage('model')
      setPoseGuidanceVisible(false)
    }

    setAdvancedMode(value)
  }

  useEffect(() => {
    if (modelSlotEnabled) {
      console.log('[DEBUG] Aspect ratio disabled (try-on mode)')
    } else {
      setPoseGuidanceVisible(false)
      setPoseExamplesOpen(false)
    }
  }, [modelSlotEnabled])

  const previousTryOnRef = useRef(tryOnModeActive)

  useEffect(() => {
    if (previousTryOnRef.current !== tryOnModeActive) {
      if (tryOnModeActive) {
        console.log('[DEBUG] Try-On mode detected → style/background controls disabled.')
      }
      previousTryOnRef.current = tryOnModeActive
    }
  }, [tryOnModeActive])

  const isUploading = uploadingState.garment || uploadingState.model
  const upgradeTooltip = !hasCredits && plan === 'free'
    ? 'You’ve used your 2 free credits. Upgrade to Pro for more.'
    : undefined

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
        description: 'Wait until both images finish uploading.',
        variant: 'destructive',
      })
      return
    }

    if (!garmentAsset?.secureUrl) {
      toast({
        title: 'Product image required',
        description: 'Upload the product photo before generating.',
        variant: 'destructive',
      })
      return
    }

    if (advancedMode && !modelAsset?.secureUrl) {
      toast({
        title: 'Model image required',
        description: 'Upload your model reference photo or switch off Pro mode.',
        variant: 'destructive',
      })
      return
    }

    const startedAt = Date.now()
    setIsGenerating(true)

    try {
      const result = await onGenerate({
        ...formValues,
        garmentImageUrl: garmentAsset.secureUrl,
        modelImageUrl: advancedMode && modelAsset?.secureUrl ? modelAsset.secureUrl : null,
        mode: advancedMode ? 'advanced' : 'basic',
      })
      if (result === 'POSE_DETECTION_FAILED') {
        setPoseGuidanceVisible(true)
        toast({
          title: 'Body not detected in photo',
          description:
            'Recommended: full-body photo, standing pose, simple background. We opened a quick guide with examples.',
          duration: 15000,
        })
        setPoseExamplesOpen(true)
        return
      }
      if (typeof result === 'string') {
        setPoseGuidanceVisible(false)
      }
    } catch (error) {
      console.error('Model generation failed', error)
    } finally {
      const fashnEnabled =
        typeof process.env.NEXT_PUBLIC_FASHN_ENABLED === 'string'
          ? process.env.NEXT_PUBLIC_FASHN_ENABLED === 'true'
          : false
      const minSpinnerDurationMs = fashnEnabled ? 0 : 900
      const elapsed = Date.now() - startedAt
      const remainingDelay = Math.max(minSpinnerDurationMs - elapsed, 0)

      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay))
      }

      setIsGenerating(false)
    }
  }

  const renderUploadSection = (slot: UploadSlot, options: { hidden?: boolean } = {}) => {
    const { hidden = false } = options
    const previewUrl = getPreviewForSlot(slot)
    const isUploadingSlot = uploadingState[slot]
    const { title, subtitle } = uploadCopy[slot]
    const isLocked = slot === 'model' && !modelSlotEnabled
    const showUpgradeCTA = slot === 'model' && !isPro
    const visibilityClasses = hidden
      ? 'pointer-events-none opacity-0 scale-95 max-h-0 overflow-hidden'
      : 'pointer-events-auto opacity-100 scale-100 max-h-[640px]'

    return (
      <div
        aria-hidden={hidden}
        className={`space-y-2.5 transition-all duration-300 ease-out ${visibilityClasses}`}
      >
        <Label className="flex items-center gap-2 text-sm font-medium text-neutral-400">
          {slot === 'model' ? (
            <>
              {isLocked ? <Lock className="h-3.5 w-3.5 text-neutral-500" /> : null}
              <span>{isLocked ? 'Pro Feature – Upload your model photo' : title}</span>
            </>
          ) : (
            title
          )}
        </Label>
        <div className="space-y-1">
          <p className={`text-xs ${isLocked ? 'text-neutral-600' : 'text-neutral-500'}`}>
            {isLocked ? 'Upgrade to Pro to try clothes on real models.' : subtitle}
          </p>
          {slot === 'model' ? (
            modelSlotEnabled ? (
              <>
                <p className="text-xs text-neutral-500">
                  Recommended: full-body photo, standing pose, simple background.
                </p>
              </>
            ) : (
              <p className="text-xs text-transparent select-none" aria-hidden>
                Placeholder to preserve layout
              </p>
            )
          ) : (
            <p className="text-xs text-transparent select-none" aria-hidden>
              Placeholder to preserve layout
            </p>
          )}
        </div>
        <div
          onDrop={(event) => handleDrop(slot, event)}
          onDragOver={(event) => event.preventDefault()}
          onClick={() => {
            if (!isUploading && !(slot === 'model' && !modelSlotEnabled)) {
              getFileInputRef(slot).current?.click()
            }
          }}
          className={`relative flex min-h-[18rem] w-full ${
            isUploading || (slot === 'model' && !modelSlotEnabled)
              ? 'cursor-not-allowed opacity-70'
              : 'cursor-pointer'
          } flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition-colors sm:p-7 ${
            previewUrl
              ? 'border-[var(--brand-green)]/55 bg-[var(--brand-green-muted)] shadow-[0_0_22px_rgba(159,255,87,0.18)] ring-2 ring-[var(--brand-green)] ring-offset-2 ring-offset-[#0b0b0b]'
              : isLocked
                ? 'border-white/8 bg-black/30'
                : 'border-white/12 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]'
          }`}
        >
          {!previewUrl && !isUploadingSlot ? (
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.04] bg-[radial-gradient(circle_at_20%_20%,rgba(159,255,87,0.08),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(159,255,87,0.05),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(15,15,15,0.55)_90%)]"
              aria-hidden
            />
          ) : null}
          {isLocked ? (
            <div className="relative z-10 flex flex-col items-center gap-3 text-neutral-400">
              <Lock className="h-6 w-6 text-neutral-500" />
              <p className="text-sm font-medium text-neutral-300">
                {showUpgradeCTA ? 'Upgrade to unlock Pro try-on.' : 'Toggle Pro mode to enable uploads.'}
              </p>
              {showUpgradeCTA ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    onUpgradeClick()
                  }}
                  className="mt-1 rounded-lg border-white/20 bg-black/40 text-xs font-semibold text-neutral-200 hover:border-white/30 hover:bg-black/55"
                >
                  Upgrade to Pro
                </Button>
              ) : null}
            </div>
          ) : null}
          {isUploadingSlot ? (
            <div className="relative z-10 flex flex-col items-center gap-3 text-neutral-300">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
              <p className="text-sm text-neutral-200">Uploading to secure storage…</p>
            </div>
          ) : previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="max-h-44 w-auto rounded-xl object-cover shadow-[0_0_20px_rgba(159,255,87,0.16)]"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  void handleRemoveImage(slot)
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
            ref={getFileInputRef(slot)}
            type="file"
            accept="image/*"
            onChange={(event) => handleFileChange(slot, event)}
            className="hidden"
            disabled={slot === 'model' && !modelSlotEnabled}
          />
        </div>
      </div>
    )
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

      <div className="space-y-6">
        {isPro ? (
          <div
            className={`grid gap-6 sm:grid-cols-1 ${modelSlotEnabled ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
          >
            {renderUploadSection('garment')}
            {renderUploadSection('model', { hidden: !modelSlotEnabled })}
          </div>
        ) : (
          <>
            {renderUploadSection('garment')}
            <div className="mt-3 flex items-center justify-between text-sm text-neutral-400">
              <span>Want to upload your own model photo?</span>
              <Button
                variant="link"
                className="text-[#9FFF57] hover:text-[#CFFF8A] p-0"
                onClick={onUpgradeClick}
              >
                Upgrade to Pro
              </Button>
            </div>
          </>
        )}

        {isPro ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-200">
            <div className="flex items-center gap-2">
              <Switch
                id="advanced-mode"
                checked={modelSlotEnabled}
                onCheckedChange={handleAdvancedToggle}
                disabled={!isPro}
              />
              <Label htmlFor="advanced-mode" className="text-sm text-neutral-300">
                Upload my own model photo (Pro only)
              </Label>
            </div>
            {modelSlotEnabled ? (
              <span className="text-xs text-neutral-500">
                Using your own model locks appearance controls for consistency.
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Style Type</Label>
          {tryOnModeActive ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-neutral-400">
              Style and background options are disabled when using your own photo. The final image keeps your original background.
            </div>
          ) : (
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
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2 text-sm text-neutral-200 transition ${
                    formValues.styleType === style.id
                      ? 'border-transparent bg-white/[0.06] text-neutral-50 shadow-[0_0_18px_rgba(159,255,87,0.12)] ring-2 ring-[#9FFF57] ring-offset-2 ring-offset-[#0b0b0b]'
                      : 'border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-neutral-50'
                  }`}
                >
                  <RadioGroupItem value={style.id} id={style.id} className="sr-only" />
                  <span className="text-xl" aria-hidden>
                    {style.icon}
                  </span>
                  {style.label}
                </Label>
              ))}
            </RadioGroup>
          )}
        </div>

        {showModelAppearanceControls ? (
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
                  className={`flex cursor-pointer items-center justify-center rounded-xl border p-2 text-sm capitalize text-neutral-200 transition ${
                    formValues.gender === gender
                      ? 'border-transparent bg-white/[0.06] text-neutral-50 shadow-[0_0_18px_rgba(159,255,87,0.12)] ring-2 ring-[#9FFF57] ring-offset-2 ring-offset-[#0b0b0b]'
                      : 'border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-neutral-50'
                  }`}
                >
                  <RadioGroupItem value={gender} id={gender} className="sr-only" />
                  {gender}
                </Label>
              ))}
            </RadioGroup>
          </div>
        ) : null}

        {showModelAppearanceControls ? (
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
                  className={`flex cursor-pointer items-center justify-center rounded-xl border p-2 text-sm font-medium uppercase tracking-wide text-neutral-300 transition ${
                    formValues.ageGroup === age
                      ? 'border-transparent bg-white/[0.06] text-neutral-50 shadow-[0_0_18px_rgba(159,255,87,0.12)] ring-2 ring-[#9FFF57] ring-offset-2 ring-offset-[#0b0b0b]'
                      : 'border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:text-neutral-50'
                  }`}
                >
                  <RadioGroupItem value={age} id={age} className="sr-only" />
                  {age}
                </Label>
              ))}
            </RadioGroup>
          </div>
        ) : null}

        {showModelAppearanceControls ? (
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
                  className={`h-10 rounded-xl border transition hover:scale-[1.02] ${
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
        ) : null}

        {modelSlotEnabled ? (
          <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-sm font-medium text-neutral-400">Aspect Ratio</p>
            <p className="text-xs text-neutral-500">Aspect ratio is fixed for Try-On mode.</p>
          </div>
        ) : (
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
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="group">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              isUploading ||
              !hasCredits ||
              !garmentAsset?.secureUrl ||
              (advancedMode && !modelAsset?.secureUrl)
            }
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-[#9FFF57] focus-visible:ring-offset-1 focus-visible:ring-offset-black disabled:translate-y-0 disabled:opacity-60 ${
              advancedMode && isPro
                ? 'bg-[#9FFF57] text-black hover:bg-[#AEFF6B] hover:shadow-[0_8px_20px_rgba(159,255,87,0.22)]'
                : 'bg-white/12 text-neutral-100 hover:bg-white/18 hover:shadow-[0_6px_18px_rgba(159,255,87,0.18)]'
            }`}
            title={upgradeTooltip}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {advancedMode && isPro ? 'Generate with Try-On Pro' : 'Generate Basic Preview'}
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.18em] text-[#9FFF57]/90">
            {modeLabel}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-neutral-400">
            {modeLabel.startsWith('Preview')
              ? 'Preview mode delivers one standard-resolution image and uses 1 credit ($1).'
              : 'HD mode delivers two high-res images and uses 1 credit ($1).'}
          </p>
          {!hasCredits ? (
            <div className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.03] to-black/60 px-5 py-4 text-sm text-neutral-100 shadow-[0_0_22px_rgba(0,0,0,0.35)]">
              <p className="font-medium text-neutral-200">You’ve used all your free previews.</p>
              <p className="mt-1 text-xs text-neutral-400">Unlock HD mode to keep generating fresh looks.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full justify-center rounded-lg border-[#9FFF57]/60 bg-black/60 text-sm font-semibold text-[#9FFF57] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#9FFF57] hover:bg-[#9FFF57]/10 hover:text-[#9FFF57]"
                onClick={onUpgradeClick}
              >
                Buy another credit
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <Dialog open={poseExamplesOpen} onOpenChange={setPoseExamplesOpen}>
        <DialogContent className="max-w-md border-white/10 bg-[#101010]/95 text-neutral-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Full-body photo tips</DialogTitle>
            <DialogDescription className="text-sm text-neutral-400">
              Use these guidelines to help the AI detect body pose correctly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-neutral-200">
            <ul className="space-y-2 list-disc pl-4 text-neutral-300">
              <li>Frame the person from head to toe with arms and legs fully visible.</li>
              <li>Ask them to stand upright, facing slightly toward the camera.</li>
              <li>Use even lighting and a simple, uncluttered background.</li>
            </ul>
            <p className="text-xs text-neutral-500">
              Avoid close-up portraits, seated poses, or busy backdrops—the AI needs the full silhouette to fit outfits accurately.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
