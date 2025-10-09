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

export interface GenerationSettings {
  styleType: string
  gender: string
  ageGroup: string
  skinTone: string
  aspectRatio: string
  productImage?: File
}

interface ModelGeneratorProps {
  onGenerate: (settings: GenerationSettings) => Promise<void> | void
  isGenerating: boolean
  hasCredits: boolean
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

export function ModelGenerator({
  onGenerate,
  isGenerating,
  hasCredits,
}: ModelGeneratorProps) {
  const [settings, setSettings] = useState<GenerationSettings>({
    styleType: 'street',
    gender: 'female',
    ageGroup: 'youth',
    skinTone: 'medium',
    aspectRatio: '3:4',
  })
  const [productImage, setProductImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Please upload an image file',
        description: 'Supported formats include PNG, JPG, and WEBP.',
        variant: 'destructive',
      })
      return
    }

    setProductImage(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return url
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleRemoveImage = () => {
    setProductImage(null)
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!hasCredits) {
      toast({
        title: 'No credits remaining',
        description: 'Upgrade your plan to continue generating model shots.',
        variant: 'destructive',
      })
      return
    }

    if (!productImage) {
      toast({
        title: 'Product image required',
        description: 'Upload a product photo before generating.',
        variant: 'destructive',
      })
      return
    }

    await onGenerate({ ...settings, productImage })
  }

  return (
    <Card className="gap-6 rounded-xl border-white/10 bg-white/[0.04] p-4 shadow-[0_0_25px_#00FF87]/10 backdrop-blur-xl sm:p-6 lg:p-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ff87]/10">
          <Sparkles className="h-4 w-4 text-[#00ff87]" />
        </span>
        <h2 className="text-lg font-semibold tracking-[0.015em] text-neutral-50">Generate Model Shot</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-2.5">
          <Label className="text-sm font-medium text-neutral-400">Upload Product Image</Label>
          <div
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors ${
              previewUrl
                ? 'border-[#00ff87]/60 bg-[#00ff87]/8 shadow-[0_0_25px_#00FF87]/10'
                : 'border-white/12 bg-white/[0.03] hover:border-white/25'
            }`}
          >
            {previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="max-h-40 w-auto rounded-lg object-cover shadow-[0_0_25px_#00FF87]/10"
                />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRemoveImage()
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-neutral-400" />
                <p className="text-base text-neutral-200">
                  Click or drag to upload
                </p>
              </>
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
            value={settings.styleType}
            onValueChange={(value) =>
              setSettings((current) => ({ ...current, styleType: value }))
            }
            className="grid gap-3 sm:grid-cols-2"
          >
            {styleTypes.map((style) => (
              <Label
                key={style.id}
                htmlFor={style.id}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 text-base text-neutral-200 transition ${
                  settings.styleType === style.id
                    ? 'border-[#00ff87]/80 bg-[#00ff87]/12 text-neutral-50 shadow-[0_0_25px_#00FF87]/10'
                    : 'border-white/12 bg-white/[0.03] hover:border-white/20 hover:text-neutral-50'
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
            value={settings.gender}
            onValueChange={(value) =>
              setSettings((current) => ({ ...current, gender: value }))
            }
            className="grid grid-cols-2 gap-3"
          >
            {['female', 'male'].map((gender) => (
              <Label
                key={gender}
                htmlFor={gender}
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-4 text-base capitalize text-neutral-200 transition ${
                  settings.gender === gender
                    ? 'border-[#00ff87]/80 bg-[#00ff87]/12 text-neutral-50 shadow-[0_0_25px_#00FF87]/10'
                    : 'border-white/12 bg-white/[0.03] hover:border-white/20 hover:text-neutral-50'
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
            value={settings.ageGroup}
            onValueChange={(value) =>
              setSettings((current) => ({ ...current, ageGroup: value }))
            }
            className="grid grid-cols-3 gap-3"
          >
            {['children', 'youth', 'elderly'].map((age) => (
              <Label
                key={age}
                htmlFor={age}
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-sm font-medium uppercase tracking-wide text-neutral-300 transition ${
                  settings.ageGroup === age
                    ? 'border-[#00ff87]/80 bg-[#00ff87]/12 text-neutral-50 shadow-[0_0_25px_#00FF87]/10'
                    : 'border-white/12 bg-white/[0.03] hover:border-white/20 hover:text-neutral-50'
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
                  setSettings((current) => ({ ...current, skinTone: tone.id }))
                }
                className={`h-12 rounded-xl border transition hover:scale-[1.02] ${
                  settings.skinTone === tone.id
                    ? 'border-[#00ff87]/80 shadow-[0_0_25px_#00FF87]/10'
                    : 'border-white/15'
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
            value={settings.aspectRatio}
            onValueChange={(value) =>
              setSettings((current) => ({ ...current, aspectRatio: value }))
            }
          >
            <SelectTrigger className="border-white/12 bg-white/[0.03] text-neutral-200 hover:border-white/20">
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
            disabled={isGenerating || !hasCredits}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#a6ff00] py-5 text-base font-semibold text-black shadow-[0_0_20px_#00FF87]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_#00FF87]/30 focus-visible:shadow-[0_0_22px_#00FF87]/35 disabled:translate-y-0 disabled:opacity-60"
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
        </div>
      </div>
    </Card>
  )
}
