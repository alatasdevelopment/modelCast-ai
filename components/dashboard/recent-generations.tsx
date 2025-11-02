'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, Loader2, Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { GeneratedImage, FlattenedGeneratedImage } from '@/components/dashboard/types'
import { ensureModelcastWatermark } from '@/lib/cloudinary'

import { AllGenerationsDialog } from './all-generations-dialog'

interface RecentGenerationsProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownload: (url: string, isWatermarked: boolean) => void | Promise<void>
}

export function RecentGenerations({ images, isGenerating = false, onDownload }: RecentGenerationsProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({})

  const flattened: FlattenedGeneratedImage[] = useMemo(
    () =>
      images.flatMap((image) =>
        (image.urls?.length ? image.urls : [image.url]).map((url, index) => ({
          id: `${image.id}-${index}`,
          url,
          mode: image.mode,
          timestamp: image.timestamp,
          plan: image.plan,
        })),
      ),
    [images],
  )

  const previewItems = flattened.slice(0, 2)

  const handleImageError = (id: string) =>
    setBrokenIds((previous) => ({
      ...previous,
      [id]: true,
    }))
  const cardBaseClass =
    'group flex w-full flex-col items-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-center shadow-inner shadow-black/30 transition-all duration-200 ease-out hover:scale-[1.02] hover:border-[#9FFF57]/40 hover:ring-1 hover:ring-[#9FFF57]/20'

  const PlaceholderContent = ({
    title,
    subtitle,
    icon,
  }: {
    title: string
    subtitle: string
    icon: 'logo' | 'spinner'
  }) => (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-white/10 bg-neutral-950/70">
      {icon === 'spinner' ? (
        <Loader2 className="h-7 w-7 animate-spin text-[#9FFF57]" />
      ) : (
        <Image
          src="/logos/img-generation.png"
          alt="ModelCast logo placeholder"
          width={44}
          height={44}
          className="h-11 w-11 object-contain brightness-0 invert"
        />
      )}
      <p className="text-sm font-semibold text-neutral-200">{title}</p>
      <p className="max-w-[200px] text-[11px] uppercase tracking-wide text-neutral-500">{subtitle}</p>
    </div>
  )

  const loadingStateCard = (
    <div className={cardBaseClass}>
      <PlaceholderContent
        title="Preparing previews…"
        subtitle="Preview (Watermarked · Standard Resolution)"
        icon="spinner"
      />
      <div className="invisible mt-3 h-9 w-[70%] rounded-xl sm:w-[60%]" />
    </div>
  )

  const emptyStateCard = (
    <div className={cardBaseClass}>
      <PlaceholderContent
        title="No generations yet"
        subtitle="Preview (Watermarked · Standard Resolution)"
        icon="logo"
      />
      <div className="invisible mt-3 h-9 w-[70%] rounded-xl sm:w-[60%]" />
    </div>
  )

  const renderPreviewCard = (image: FlattenedGeneratedImage) => {
    const isBroken = brokenIds[image.id] ?? false

    const shouldWatermark = image.plan === 'free'
    const displayUrl = shouldWatermark ? ensureModelcastWatermark(image.url) : image.url
    const downloadUrl = shouldWatermark ? ensureModelcastWatermark(image.url) : image.url

    return (
      <div key={image.id} className="group flex flex-col text-center">
        <div className={cardBaseClass}>
          {isBroken ? (
            <PlaceholderContent
              title="Preview not available"
              subtitle="Preview (Watermarked · Standard Resolution)"
              icon="logo"
            />
          ) : (
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/10 bg-neutral-950/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="Generated model"
                className="h-full w-full object-cover transition-all duration-200 ease-out group-hover:scale-[1.02]"
                onError={() => handleImageError(image.id)}
              />
            </div>
          )}
          <div className="mt-3 flex w-full flex-col items-center gap-2">
            <p className="text-[11px] uppercase tracking-wide text-neutral-600">
              {image.plan === 'free'
                ? 'Preview (Watermarked · Standard Resolution)'
                : 'HD Result'}
            </p>
            {isBroken ? (
              <div className="h-9 w-[70%] rounded-xl border border-white/10 sm:w-[60%]" />
            ) : (
              <button
                type="button"
                className="inline-flex w-[70%] items-center justify-center rounded-xl bg-white py-1.5 text-xs text-black transition-colors duration-200 ease-out hover:bg-neutral-200 sm:w-[60%]"
                onClick={() => {
                  void onDownload(downloadUrl, shouldWatermark)
                }}
                aria-label="Download"
                title={shouldWatermark ? 'Download (watermarked)' : 'Download'}
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-col items-center justify-center space-y-2">
          <p className="text-xs text-neutral-500">
            {image.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  const galleryContent =
    previewItems.length === 0
      ? isGenerating
        ? loadingStateCard
        : emptyStateCard
      : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isGenerating ? loadingStateCard : null}
          {previewItems.map((image) => renderPreviewCard(image))}
        </div>
      )

  return (
    <>
      <Card className="flex flex-col space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 text-neutral-300 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9FFF57]/30 bg-[#9FFF57]/15 text-[#9FFF57]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm uppercase tracking-wider text-[#9FFF57]">Recent Generations</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="text-sm font-medium text-[#9FFF57] transition-colors hover:text-[#9FFF57]/80"
          >
            View all →
          </button>
        </div>

        {galleryContent}
      </Card>

      <AllGenerationsDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        images={flattened}
        brokenIds={brokenIds}
        onImageError={handleImageError}
        onDownload={onDownload}
      />
    </>
  )
}
