'use client'

import { useMemo, useState } from 'react'
import { Download, Eye, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { GeneratedImage } from './types'

interface ResultsGalleryProps {
  images: GeneratedImage[]
  isGenerating?: boolean
}

export function ResultsGallery({ images, isGenerating = false }: ResultsGalleryProps) {
  const [showAll, setShowAll] = useState(false)
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({})

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

  const flattened = useMemo(
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

  const galleryItems = flattened.slice(0, 3)

  const gridPlacementClass = galleryItems.length === 1 ? "place-content-center" : "place-content-start"
  const renderLoadingCard = (key?: string) => (
    <div
      key={key}
      className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          animation: 'shimmer 1.5s linear infinite',
          backgroundSize: '200% 100%',
          backgroundImage:
            'linear-gradient(110deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.04) 100%)',
        }}
      />
      <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-3 text-neutral-100">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-green)]" />
        <span className="text-sm font-medium tracking-wide text-neutral-200">Generating…</span>
      </div>
    </div>
  );

  return (
    <Card className="relative gap-6 overflow-hidden rounded-2xl border-white/12 bg-[#111111]/58 p-6 shadow-[0_0_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(159,255,87,0.45)] to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-green-muted)]">
            <ImageIcon className="h-4 w-4 text-[var(--brand-green)]" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">Gallery</p>
            <h2 className="text-lg font-semibold tracking-[0.18em] text-neutral-50">Recent Generations</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm font-medium text-[var(--brand-green)] transition hover:text-[color:rgba(159,255,87,0.85)]"
        >
          View all →
        </button>
      </div>

      {galleryItems.length === 0 ? (
        isGenerating ? (
          <div className="grid min-h-[240px] grid-cols-1 place-content-center">
            {renderLoadingCard("generating-empty")}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(159,255,87,0.35)] to-[rgba(159,255,87,0.08)]">
              <div className="absolute inset-0 rounded-full bg-[var(--brand-green-muted)] blur-xl" aria-hidden />
              <Sparkles className="h-8 w-8 text-[var(--brand-green)]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-medium text-neutral-200">No generations yet</p>
              <p className="text-sm text-neutral-400">Your next AI model shots will land here.</p>
            </div>
          </div>
        )
      ) : (
        <div className={`grid min-h-[240px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 ${gridPlacementClass}`}>
          {isGenerating && renderLoadingCard("generating-active")}
          {galleryItems.map((image) => {
            const modeLabel = image.mode === "preview" ? "Preview Result" : "HD Result"
            const isBroken = brokenIds[image.id] ?? false
            return (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] transition-all duration-300 hover:border-[var(--brand-green)]/55 hover:shadow-[0_0_26px_rgba(159,255,87,0.18)]"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="relative h-full w-full">
                    {!isBroken ? (
                      <img
                        src={image.url}
                        alt="Generated model"
                        className="h-full w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.04]"
                        onError={() => handleImageError(image.id)}
                      />
                    ) : null}
                    {isBroken ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/12 bg-black/50 text-center text-sm text-neutral-300">
                        <Sparkles className="h-6 w-6 text-[var(--brand-green)]" />
                        <span>Preview not available</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="absolute top-2 left-2 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(159,255,87,0.85)]">
                  {modeLabel}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  <button
                    type="button"
                    className="flex w-[140px] items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                    onClick={() => toast({ title: 'Viewer coming soon' })}
                  >
                    <Eye className="h-4 w-4" /> View
                  </button>
                  <button
                    type="button"
                    className="flex w-[140px] items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                    onClick={() => handleDownload(image.url)}
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-xs text-neutral-200 backdrop-blur">
                  {image.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-3xl overflow-hidden border-white/10 bg-[#101010]/95 px-6 py-6 text-white shadow-[0_0_28px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-8">
          <DialogHeader>
            <DialogTitle className="tracking-[0.18em] text-[var(--brand-green)]">All Generations</DialogTitle>
            <DialogDescription className="text-sm text-neutral-400">
              Browse your recent AI model shots.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flattened.map((image) => {
                const isBroken = brokenIds[image.id] ?? false
                return (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] shadow-[0_0_18px_rgba(0,0,0,0.35)] transition hover:border-[var(--brand-green)]/55"
                  >
                    <div className="aspect-[3/4] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="relative h-full w-full">
                        {!isBroken ? (
                          <img
                            src={image.url}
                            alt="Generated model"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            onError={() => handleImageError(image.id)}
                          />
                        ) : null}
                        {isBroken ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/12 bg-black/55 text-center text-sm text-neutral-300">
                            <Sparkles className="h-6 w-6 text-[var(--brand-green)]" />
                            <span>Preview not available</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        className="flex w-[140px] items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                        onClick={() => toast({ title: 'Viewer coming soon' })}
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button
                        type="button"
                        className="flex w-[140px] items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                        onClick={() => handleDownload(image.url)}
                      >
                        <Download className="h-4 w-4" /> Download
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[11px] text-neutral-200 backdrop-blur">
                      {image.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_0_12px_rgba(0,0,0,0.35)] hover:bg-white/90"
              onClick={() => setShowAll(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
