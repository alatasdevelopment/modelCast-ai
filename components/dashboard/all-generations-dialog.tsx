'use client'

import Image from 'next/image'
import { Download } from 'lucide-react'

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

interface AllGenerationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: FlattenedGeneratedImage[]
  brokenIds: Record<string, boolean>
  onImageError: (id: string) => void
  onDownload: (url: string) => void
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
    'group rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 flex flex-col items-center justify-center text-center space-y-2 shadow-inner shadow-black/30 transition-all duration-200 ease-out hover:scale-[1.02] hover:border-[#9FFF57]/40 hover:ring-1 hover:ring-[#9FFF57]/20'

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
                <Image
                  src="/logos/img-generation.png"
                  alt="ModelCast logo placeholder"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain brightness-0 invert"
                />
                <p className="text-sm font-semibold text-neutral-200">No generations yet</p>
                <p className="text-[11px] uppercase tracking-wide text-neutral-600">
                  Preview Result (Watermarked)
                </p>
              </div>
            ) : (
              images.map((image) => {
                const isBroken = brokenIds[image.id] ?? false
                return (
                  <div key={image.id} className="flex flex-col items-center">
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
                          <p className="text-[11px] uppercase tracking-wide text-neutral-600">
                            Preview Result (Watermarked)
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-full overflow-hidden rounded-lg bg-neutral-950/70">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.url}
                              alt="Generated model"
                              className="aspect-[4/5] w-full object-cover transition-all duration-200 ease-out group-hover:scale-[1.02]"
                              onError={() => onImageError(image.id)}
                            />
                          </div>
                          <p className="text-[11px] uppercase tracking-wide text-neutral-600">
                            {image.mode === 'preview' ? 'Preview Result (Watermarked)' : 'HD Result'}
                          </p>
                          <button
                            type="button"
                            className="mt-2 mx-auto inline-flex w-[70%] items-center justify-center rounded-xl bg-white py-1.5 text-xs text-black transition-colors duration-200 ease-out hover:bg-neutral-200 sm:w-[60%]"
                            onClick={() => onDownload(image.url)}
                            aria-label="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
