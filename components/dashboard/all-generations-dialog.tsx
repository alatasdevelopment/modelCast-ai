'use client'

import Image from 'next/image'
import { Download, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { FlattenedGeneratedImage } from '@/components/dashboard/types'
import { ensureModelcastWatermark } from '@/lib/cloudinary'

interface AllGenerationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: FlattenedGeneratedImage[]
  brokenIds: Record<string, boolean>
  onImageError: (id: string) => void
  onDownload: (url: string, isWatermarked: boolean) => void | Promise<void>
}

export function AllGenerationsDialog({
  open,
  onOpenChange,
  images,
  brokenIds,
  onImageError,
  onDownload,
}: AllGenerationsDialogProps) {
  const cardBaseClass =
    'group flex w-full flex-col items-center rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-center shadow-inner shadow-black/30 transition-all duration-200 ease-out hover:scale-[1.02] hover:border-[#9FFF57]/40 hover:ring-1 hover:ring-[#9FFF57]/20'

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
        <Loader2 className="h-6 w-6 animate-spin text-[#9FFF57]" />
      ) : (
        <Image
          src="/logos/img-generation.png"
          alt="ModelCast logo placeholder"
          width={40}
          height={40}
          className="h-10 w-10 object-contain brightness-0 invert"
        />
      )}
      <p className="text-sm font-semibold text-neutral-200">{title}</p>
      <p className="max-w-[200px] text-[11px] uppercase tracking-wide text-neutral-500">{subtitle}</p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-neutral-950/80 px-6 py-6 text-neutral-200 shadow-[0_0_30px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-[fadeIn_0.2s_ease-out_forwards] sm:px-7 sm:py-7">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-sm uppercase tracking-wider text-[#9FFF57]">
            All Generations
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            Browse every generated preview with quick access to downloads.
          </DialogDescription>
        </DialogHeader>

        <div className="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[70vh] p-2 sm:grid-cols-2">
            {images.length === 0 ? (
              <div className={`col-span-full ${cardBaseClass}`}>
                <PlaceholderContent
                  title="No generations yet"
                  subtitle="Preview (Watermarked · Standard Resolution)"
                  icon="logo"
                />
                <div className="invisible mt-3 h-9 w-[70%] rounded-xl sm:w-[60%]" />
              </div>
            ) : (
              images.map((image) => {
                const isBroken = brokenIds[image.id] ?? false
                const shouldWatermark = image.plan === 'free'
                const displayUrl = shouldWatermark
                  ? ensureModelcastWatermark(image.url)
                  : image.url
                const downloadUrl = shouldWatermark
                  ? ensureModelcastWatermark(image.url)
                  : image.url
                return (
                  <div key={image.id} className="flex flex-col items-center">
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
                            onError={() => onImageError(image.id)}
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
                    <p className="mt-2 text-xs text-neutral-500">
                      {image.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 ease-out hover:bg-neutral-200"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
