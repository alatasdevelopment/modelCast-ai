'use client'

import { Download, Image as ImageIcon, Loader2, Share2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

import type { GeneratedImage } from './types'

interface ResultsGalleryProps {
  images: GeneratedImage[]
  isGenerating?: boolean
}

export function ResultsGallery({ images, isGenerating = false }: ResultsGalleryProps) {
  const handleDownload = (url: string) => {
    toast({
      title: 'Download coming soon',
      description: 'Images will be available for download after generation is connected.',
    })
    console.log('Download image', url)
  }

  const handleShare = (id: string) => {
    toast({
      title: 'Share coming soon',
      description: 'Sharing options will be available once integrations are wired.',
    })
    console.log('Share image', id)
  }

  const gridPlacementClass = images.length > 0 && images.length < 3 ? "place-content-center" : "place-content-start"
  const renderLoadingCard = (key?: string) => (
    <div
      key={key}
      className="group relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.03]"
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
        <Loader2 className="h-6 w-6 animate-spin text-[#00ff87]" />
        <span className="text-sm font-medium tracking-wide text-neutral-200">Generating…</span>
      </div>
    </div>
  )

  return (
    <Card className="gap-6 rounded-xl border-white/10 bg-white/[0.04] p-4 shadow-[0_0_25px_#00FF87]/10 backdrop-blur-xl sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ff87]/10">
            <ImageIcon className="h-4 w-4 text-[#00ff87]" />
          </span>
          <h2 className="text-lg font-semibold tracking-[0.015em] text-neutral-50">Recent Generations</h2>
        </div>
        <span className="cursor-default text-sm font-medium text-[#71ffb4]/70">
          View all →
        </span>
      </div>

      {images.length === 0 ? (
        isGenerating ? (
          <div className="grid min-h-[240px] grid-cols-1 place-content-center">
            {renderLoadingCard("generating-empty")}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#00ff87]/20 to-[#00ff87]/5">
              <div className="absolute inset-0 rounded-full bg-[#00ff87]/15 blur-xl" aria-hidden />
              <Sparkles className="h-8 w-8 text-[#00ff87]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-medium text-neutral-200">No generations yet</p>
              <p className="text-sm text-neutral-400">Your next AI model shots will land here.</p>
            </div>
          </div>
        )
      ) : (
        <div className={`grid min-h-[240px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 ${gridPlacementClass}`}>
          {isGenerating && renderLoadingCard("generating-active")}
          {images.slice(0, 3).map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.03] transition-all duration-300 hover:border-[#00ff87]/35 hover:shadow-[0_0_25px_#00FF87]/20"
            >
              <div className="aspect-[3/4] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Generated model"
                  className="h-full w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.04]"
                />
              </div>

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(image.url)}
                  className="h-10 w-10 rounded-full"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => handleShare(image.id)}
                  className="h-10 w-10 rounded-full"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-xs text-neutral-200 backdrop-blur">
                {image.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
