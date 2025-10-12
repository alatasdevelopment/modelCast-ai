'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Download, Loader2, Sparkles } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import type { GeneratedImage, FlattenedGeneratedImage } from '@/components/dashboard/types'

import { AllGenerationsDialog } from './all-generations-dialog'

interface RecentGenerationsProps {
  images: GeneratedImage[]
  isGenerating?: boolean
}

export function RecentGenerations({ images, isGenerating = false }: RecentGenerationsProps) {
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
        })),
      ),
    [images],
  )

  const previewItems = flattened.slice(0, 3)

  const handleImageError = (id: string) =>
    setBrokenIds((previous) => ({
      ...previous,
      [id]: true,
    }))

  const handleDownload = (url: string) => {
    toast({
      title: 'Download coming soon',
      description: 'Images will be available for download after generation is connected.',
    })
    console.log('Download image', url)
  }

  const cardBaseClass =
    'group rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 flex flex-col items-center justify-center text-center space-y-2 shadow-inner shadow-black/30 transition-all duration-200 ease-out hover:scale-[1.02] hover:border-[#9FFF57]/40 hover:ring-1 hover:ring-[#9FFF57]/20'

  const loadingStateCard = (
    <div className={cardBaseClass}>
      <Loader2 className="h-7 w-7 animate-spin text-[#9FFF57]" />
      <p className="text-sm text-neutral-300">Preparing previews…</p>
      <p className="text-[11px] uppercase tracking-wide text-neutral-600">Preview Result (Watermarked)</p>
    </div>
  )

  const emptyStateCard = (
    <div className={cardBaseClass}>
      <Image
        src="/logos/img-generation.png"
        alt="ModelCast logo placeholder"
        width={40}
        height={40}
        className="h-10 w-10 object-contain brightness-0 invert"
      />
      <p className="text-sm font-semibold text-neutral-200">No generations yet</p>
      <p className="text-[11px] uppercase tracking-wide text-neutral-600">Preview Result (Watermarked)</p>
    </div>
  )

  const renderPreviewCard = (image: FlattenedGeneratedImage) => {
    const isBroken = brokenIds[image.id] ?? false

    return (
      <div key={image.id} className="group flex flex-col text-center">
        <div className={cardBaseClass}>
          {isBroken ? (
            <>
              <Image
                src="/logos/img-generation.png"
                alt="ModelCast logo placeholder"
                width={40}
                height={40}
                className="h-10 w-10 object-contain brightness-0 invert"
              />
              <p className="text-sm font-semibold text-neutral-200">Preview not available</p>
              <p className="text-[11px] uppercase tracking-wide text-neutral-600">Preview Result (Watermarked)</p>
            </>
          ) : (
            <>
              <div className="w-full overflow-hidden rounded-lg bg-neutral-950/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Generated model"
                  className="aspect-[4/5] w-full object-cover transition-all duration-200 ease-out group-hover:scale-[1.02]"
                  onError={() => handleImageError(image.id)}
                />
              </div>
              <p className="text-[11px] uppercase tracking-wide text-neutral-600">
                {image.mode === 'preview' ? 'Preview Result (Watermarked)' : 'HD Result'}
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors duration-200 ease-out hover:bg-neutral-200"
                  onClick={() => handleDownload(image.url)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </button>
              </div>
            </>
          )}
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
        onDownload={handleDownload}
      />
    </>
  )
}
