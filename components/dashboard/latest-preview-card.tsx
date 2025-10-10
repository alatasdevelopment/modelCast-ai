'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

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

  const label = image?.mode === 'preview' ? 'Preview Result (watermarked)' : 'HD Result'

  return (
    <Card className="relative mt-2 flex min-h-[560px] flex-col gap-4 overflow-hidden rounded-2xl border-white/12 bg-[#111111]/58 p-6 shadow-[0_0_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(159,255,87,0.45)] to-transparent" />
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-green-muted)]">
          <Sparkles className="h-4 w-4 text-[var(--brand-green)]" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">Preview</p>
          <h2 className="text-lg font-semibold tracking-[0.18em] text-neutral-50">Latest Model Shot</h2>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-black/40 shadow-[0_0_24px_rgba(0,0,0,0.35)]">
        <div className="relative h-full w-full">
          {image && !isBroken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt="Latest generated model shot"
              className={`h-full w-full rounded-2xl object-contain transition duration-500 ${
                isGenerating ? 'scale-105 blur-sm brightness-95' : ''
              }`}
              onError={() => setIsBroken(true)}
            />
          ) : null}

          {(!image || isBroken) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] text-center text-neutral-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                <Sparkles className="h-7 w-7 text-[var(--brand-green)]" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-neutral-100">No preview available</p>
                <p className="text-sm text-neutral-400">Generate a model shot to see it instantly.</p>
              </div>
            </div>
          )}
        </div>

        {isGenerating && (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-70"
              style={{
                animation: 'shimmer 1.6s linear infinite',
                backgroundSize: '200% 100%',
                backgroundImage:
                  'linear-gradient(110deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.04) 100%)',
              }}
            />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/45 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
              <span className="text-sm font-medium text-neutral-100">Generating…</span>
            </div>
          </>
        )}
      </div>

      {image ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(159,255,87,0.75)]">{label}</p>
      ) : null}
    </Card>
  )
}
