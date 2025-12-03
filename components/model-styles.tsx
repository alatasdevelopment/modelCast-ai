"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
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
  { id: "modelcast-output", src: "/results/modelcast_output.png", width: 1024, height: 1024, alt: "ModelCast signature grid" },
]

const categories = ["Women", "Men", "Kids", "Studio", "Street", "Editorial"]

export default function ModelStyles() {
  const hasImages = styleImages.length > 0
  const listRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToIndex = useCallback((index: number) => {
    if (!listRef.current) return
    const nodes = Array.from(listRef.current.children) as HTMLElement[]
    const target = nodes[index]
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
    }
  }, [])

  const handleArrowClick = (direction: "prev" | "next") => {
    setActiveIndex((current) => {
      const next = direction === "prev" ? current - 1 : current + 1
      const clamped = Math.min(Math.max(next, 0), styleImages.length - 1)
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
        const { scrollLeft } = container
        let nearestIndex = 0
        let nearestDistance = Infinity

        children.forEach((child, index) => {
          const distance = Math.abs(child.offsetLeft - scrollLeft)
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

  return (
    <section
      id="model-styles"
      role="region"
      aria-labelledby="model-styles-heading"
      className="relative overflow-hidden bg-black py-24 sm:py-28"
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
            <div className="mt-12 flex items-center justify-between">
              <p className="text-sm text-zinc-500">Swipe or use the arrows to browse looks.</p>
              <div className="hidden items-center gap-3 sm:flex">
                <button
                  type="button"
                  aria-label="Previous style"
                  onClick={() => handleArrowClick("prev")}
                  disabled={activeIndex === 0}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next style"
                  onClick={() => handleArrowClick("next")}
                  disabled={activeIndex === styleImages.length - 1}
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
                {styleImages.map((style) => (
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
                  disabled={activeIndex === 0}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next style"
                  onClick={() => handleArrowClick("next")}
                  disabled={activeIndex === styleImages.length - 1}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              {styleImages.map((style, index) => (
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
