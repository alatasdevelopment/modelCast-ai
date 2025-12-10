"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type StyleImage = {
  id: string
  src: string
  width: number
  height: number
  alt: string
}

const styleImages: StyleImage[] = [
  { id: "editorial-women", src: "/results/editorial_women.png", width: 832, height: 1248, alt: "Studio muse womenswear" },
  { id: "street", src: "/results/street.png", width: 864, height: 1184, alt: "Menswear street style" },
  { id: "outdoor", src: "/results/outdoor.png", width: 1152, height: 896, alt: "Outdoor lifestyle fashion shot" },
  { id: "child-outdoor", src: "/results/child_outdoor.png", width: 864, height: 1184, alt: "Kids outdoor portrait" },
  { id: "old-editorial", src: "/results/old_editorial.png", width: 864, height: 1184, alt: "Senior editorial look" },
  { id: "studio-2", src: "/results/studio2.png", width: 864, height: 1184, alt: "Studio runway pose" },
  { id: "outdoor-2", src: "/results/outdoor_2.png", width: 896, height: 1152, alt: "Editorial outdoor full body" },
  { id: "studio", src: "/results/studio.png", width: 864, height: 1184, alt: "Studio portrait" },
  { id: "old-woman-studio", src: "/results/old_worman_studio.png", width: 864, height: 1184, alt: "Classic studio womenswear" },
  { id: "editorial-2", src: "/results/editorial_2.png", width: 864, height: 1184, alt: "Monochrome editorial pose" },
]

const categories = ["Women", "Men", "Kids", "Studio", "Street", "Editorial"]

export default function ModelStyles() {
  const listRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hiddenImageIds, setHiddenImageIds] = useState<Set<string>>(() => new Set())

  const visibleImages = useMemo(
    () => styleImages.filter((style) => !hiddenImageIds.has(style.id)),
    [hiddenImageIds],
  )

  const hasImages = visibleImages.length > 0

  const scrollToIndex = useCallback((index: number) => {
    if (!listRef.current) return
    const nodes = Array.from(listRef.current.children) as HTMLElement[]
    const target = nodes[index]
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
    }
  }, [])

  const clampIndex = useCallback(
    (index: number) => {
      if (visibleImages.length === 0) return 0
      return Math.min(Math.max(index, 0), visibleImages.length - 1)
    },
    [visibleImages.length],
  )

  const handleArrowClick = (direction: "prev" | "next") => {
    if (visibleImages.length === 0) return
    setActiveIndex((current) => {
      const next = direction === "prev" ? current - 1 : current + 1
      const clamped = clampIndex(next)
      scrollToIndex(clamped)
      return clamped
    })
  }

  useEffect(() => {
    const container = listRef.current
    if (!container) return
    let frame: number | null = null

    const handleScroll = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const children = Array.from(container.children) as HTMLElement[]
        const { scrollLeft, offsetWidth } = container
        const viewportCenter = scrollLeft + offsetWidth / 2
        let nearestIndex = 0
        let nearestDistance = Infinity

        children.forEach((child, index) => {
          const childCenter = child.offsetLeft + child.offsetWidth / 2
          const distance = Math.abs(childCenter - viewportCenter)
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestIndex = index
          }
        })

        setActiveIndex(nearestIndex)
      })
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current))
  }, [clampIndex])

  const hideImageById = useCallback((id: string) => {
    setHiddenImageIds((prev) => {
      if (prev.has(id)) {
        return prev
      }
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleImageError = useCallback((id: string, src: string) => {
    hideImageById(id)
    console.warn(`[model-styles] Failed to load image ${src}; removing from carousel.`)
  }, [hideImageById])

  useEffect(() => {
    if (typeof window === "undefined") return
    let canceled = false

    const verifyImages = async () => {
      const failures = await Promise.all(
        styleImages.map(async (style) => {
          const tryRequest = async (init?: RequestInit) => {
            try {
              const response = await fetch(style.src, { cache: "no-store", ...init })
              if (response.ok) {
                return null
              }
              if (response.status === 405 && init?.method === "HEAD") {
                return tryRequest({ method: "GET" })
              }
            } catch (error) {
              console.warn(`[model-styles] Unable to verify ${style.src}`, error)
              return style.id
            }
            return style.id
          }

          return tryRequest({ method: "HEAD" })
        }),
      )

      if (canceled) return

      failures.forEach((id) => {
        if (id) {
          hideImageById(id)
        }
      })
    }

    void verifyImages()

    return () => {
      canceled = true
    }
  }, [hideImageById])

  return (
    <section
      id="model-styles"
      role="region"
      aria-labelledby="model-styles-heading"
      className="relative overflow-hidden bg-black py-16 sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(163,255,89,0.08),transparent_55%)]" />
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-lime-300/80">Model Styles</p>
          <h2 id="model-styles-heading" className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-semibold text-white">
            Realistic looks that match how your customers shop
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            Swap between professional studio, lifestyle street, outdoor, and editorial moods. Every style is calibrated to
            showcase apparel with believable lighting and atmosphere.
          </p>
        </div>

        {hasImages ? (
          <>
            <div className="mt-10 flex items-center justify-between">
              <p className="text-sm text-zinc-500">Swipe or use the arrows to browse looks.</p>
              <div className="hidden items-center gap-3 sm:flex">
                <button
                  type="button"
                  aria-label="Previous style"
                  onClick={() => handleArrowClick("prev")}
                  disabled={visibleImages.length === 0 || activeIndex === 0}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next style"
                  onClick={() => handleArrowClick("next")}
                  disabled={visibleImages.length === 0 || activeIndex === visibleImages.length - 1}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div
                className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6"
                style={{ scrollbarWidth: "thin" }}
                aria-label="Model style gallery"
                ref={listRef}
              >
                {visibleImages.map((style) => (
                  <figure key={style.id} className="flex-shrink-0 snap-center">
                    <div className="flex items-center justify-center rounded-3xl bg-black/80 p-4 shadow-sm">
                      <Image
                        src={style.src}
                        alt={style.alt}
                        width={style.width}
                        height={style.height}
                        className="h-auto w-auto max-h-[480px] max-w-[360px] object-contain md:max-w-[420px] lg:max-w-[520px]"
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 33vw"
                        priority={false}
                        onError={() => handleImageError(style.id, style.src)}
                      />
                    </div>
                  </figure>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 sm:hidden">
                <button
                  type="button"
                  aria-label="Previous style"
                  onClick={() => handleArrowClick("prev")}
                  disabled={visibleImages.length === 0 || activeIndex === 0}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next style"
                  onClick={() => handleArrowClick("next")}
                  disabled={visibleImages.length === 0 || activeIndex === visibleImages.length - 1}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              {visibleImages.map((style, index) => (
                <button
                  key={`dot-${style.id}`}
                  type="button"
                  aria-label={`Go to style ${index + 1}`}
                  onClick={() => scrollToIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${activeIndex === index ? "w-6 bg-lime-300" : "w-3 bg-white/20"}`}
                />
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500">
              {categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center text-base text-zinc-300">
            Model style gallery coming soon — we&rsquo;re updating our examples.
          </p>
        )}
      </div>
    </section>
  )
}
