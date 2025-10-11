'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { GeneratedImage } from '@/components/dashboard/types'

interface LatestPreviewCardProps {
  image: GeneratedImage | null
  isGenerating: boolean
}

export function LatestPreviewCard({ image, isGenerating }: LatestPreviewCardProps) {
  const [isBroken, setIsBroken] = useState(false)
  useEffect(() => {
    setIsBroken(false)
  }, [image?.id])

  const hasPreview = Boolean(image) && !isBroken
  const label =
    hasPreview && image?.mode !== 'preview' ? 'HD Result' : 'Preview Result (Watermarked)'

  return (
    <Card className="group relative mt-2 flex min-h-[460px] flex-col rounded-2xl border border-white/10 bg-[#111112] p-5 md:p-6 text-neutral-300 transition-all duration-200 ease-out hover:shadow-[0_0_12px_rgba(159,255,87,0.25)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/60">
          <Image
            src="/logos/img-generation.png"
            alt="ModelCast logo"
            width={28}
            height={28}
            className="h-7 w-7 object-contain brightness-0 invert"
          />
        </span>
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-[#9FFF57]">Preview</p>
          <h2 className="text-lg font-semibold text-neutral-100">Latest Model Shot</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="relative flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-black/50 p-4 transition-all duration-200 ease-out hover:ring-1 hover:ring-[#9FFF57]/20">
          {hasPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image?.url}
              alt="Latest generated model shot"
              className={`h-full w-full rounded-lg object-cover transition-all duration-200 ease-out ${
                isGenerating ? 'scale-105 blur-[2px] brightness-95' : 'group-hover:scale-[1.03]'
              }`}
              onError={() => setIsBroken(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
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
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-black/55 text-neutral-100 backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin text-[#9FFF57]" />
              <span className="text-sm font-medium">Generating…</span>
            </div>
          ) : null}
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      </div>
    </Card>
  )
}
