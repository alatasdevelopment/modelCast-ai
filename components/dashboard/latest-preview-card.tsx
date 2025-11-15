'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, Loader2, Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { GeneratedImage } from '@/components/dashboard/types'
import { ensureModelcastWatermark } from '@/lib/cloudinary'

interface LatestPreviewCardProps {
  image: GeneratedImage | null
  isGenerating: boolean
  onDownload?: (url: string, isWatermarked: boolean) => void | Promise<void>
}

export function LatestPreviewCard({ image, isGenerating, onDownload }: LatestPreviewCardProps) {
  const [isBroken, setIsBroken] = useState(false)
  useEffect(() => {
    setIsBroken(false)
  }, [image?.id])

  const hasPreview = Boolean(image) && !isBroken
  const label = hasPreview
    ? image?.plan === 'free'
      ? 'Preview (Standard Resolution)'
      : 'HD Result'
    : 'Preview (Standard Resolution)'
  const shouldWatermark = image?.plan === 'free'

  const downloadUrl = useMemo(() => {
    if (!hasPreview) return null
    const baseUrl = image?.url ?? null
    if (!baseUrl) return null
    return shouldWatermark ? ensureModelcastWatermark(baseUrl) : baseUrl
  }, [hasPreview, image?.url, shouldWatermark])

  return (
    <Card className="group relative mt-2 flex min-h-[460px] flex-col rounded-2xl border border-white/10 bg-[#111112] p-5 text-neutral-300 transition-all duration-200 ease-out hover:shadow-[0_0_12px_rgba(159,255,87,0.25)] md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9FFF57]/30 bg-[#9FFF57]/15 text-[#9FFF57]">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-[#9FFF57]">Preview</p>
          <h2 className="text-lg font-semibold text-neutral-100">Latest Model Shot</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="relative">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-black/50 transition-all duration-200 ease-out hover:ring-1 hover:ring-[#9FFF57]/20">
            {hasPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image?.url}
                alt="Latest generated model shot"
                className={`h-full w-full object-cover transition-all duration-200 ease-out ${
                  isGenerating ? 'scale-105 blur-[2px] brightness-95' : 'group-hover:scale-[1.03]'
                }`}
                onError={() => setIsBroken(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0b0b0b]/70 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#9FFF57]/25 bg-[#111111] ring-1 ring-[#9FFF57]/20">
                  <Image
                    src="/logos/img-generation.png"
                    alt="ModelCast logo placeholder"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain brightness-0 invert"
                  />
                </span>
                <p className="text-base font-semibold text-neutral-100">No preview yet</p>
                <p className="max-w-[240px] text-sm text-neutral-400">
                  Generate an image to see your latest model shot here.
                </p>
              </div>
            )}

            {isGenerating ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 text-neutral-100 backdrop-blur-sm">
                <Loader2 className="h-5 w-5 animate-spin text-[#9FFF57]" />
                <span className="text-sm font-medium">Generating…</span>
              </div>
            ) : null}
          </div>

          {hasPreview && onDownload && downloadUrl ? (
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white py-2 text-xs font-semibold uppercase tracking-wide text-black transition-colors duration-200 ease-out hover:bg-neutral-200"
              onClick={() => {
                void onDownload(downloadUrl, shouldWatermark)
              }}
              aria-label="Download latest model shot"
              title="Download"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </button>
          ) : null}
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      </div>
    </Card>
  )
}
