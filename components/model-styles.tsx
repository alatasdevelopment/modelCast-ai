"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type StyleCard = {
  id: string
  category: string
  title: string
  description: string
  src: string
}

const styles: StyleCard[] = [
  {
    id: "studio-muse",
    category: "Womenswear",
    title: "Studio Muse",
    description: "Clean studio silhouette for detailed looks.",
    src: "/results/editorial_women.png",
  },
  {
    id: "street-edge",
    category: "Menswear",
    title: "Street Edge",
    description: "Natural street textures with tailored layers.",
    src: "/results/street.png",
  },
  {
    id: "urban-youth",
    category: "Kids",
    title: "Urban Youth",
    description: "Playful city wander highlighting childrenswear.",
    src: "/results/street_child.png",
  },
  {
    id: "editorial-legacy",
    category: "Senior",
    title: "Editorial Legacy",
    description: "Timeless portraiture with luxe wardrobe styling.",
    src: "/results/old_editorial.png",
  },
  {
    id: "atelier-classic",
    category: "Womenswear",
    title: "Atelier Classic",
    description: "Tailored looks with soft studio gradients.",
    src: "/results/old_worman_studio.png",
  },
  {
    id: "studio-poise",
    category: "Womenswear",
    title: "Studio Poise",
    description: "Seamless backdrop that shows garments head-to-toe.",
    src: "/results/studio.png",
  },
  {
    id: "runway-studio",
    category: "Editorial",
    title: "Runway Studio",
    description: "Bold posing with dramatic softbox lighting.",
    src: "/results/studio2.png",
  },
  {
    id: "monochrome-editorial",
    category: "Editorial",
    title: "Monochrome Editorial",
    description: "Art-directed compositions with tonal styling.",
    src: "/results/editorial_2.png",
  },
  {
    id: "modelcast-signature",
    category: "Lifestyle",
    title: "ModelCast Signature",
    description: "Flagship showcase mixing studio and lifestyle cues.",
    src: "/results/modelcast_output.png",
  },
]

const GAP_PX = 24

export default function ModelStyles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(1)
  const [cardWidth, setCardWidth] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const updateLayout = () => {
      const node = containerRef.current
      if (!node) return
      const width = node.clientWidth
      let nextVisible = 1
      if (width >= 1024) {
        nextVisible = 3
      } else if (width >= 768) {
        nextVisible = 2
      }
      const totalGap = (nextVisible - 1) * GAP_PX
      const computedWidth = nextVisible > 0 ? (width - totalGap) / nextVisible : width
      setVisibleCount(nextVisible)
      setCardWidth(computedWidth)
      setCurrentIndex((previous) => Math.min(previous, Math.max(styles.length - nextVisible, 0)))
    }

    updateLayout()

    const handleResize = () => updateLayout()
    window.addEventListener("resize", handleResize)

    const observer = new ResizeObserver(() => updateLayout())
    observer.observe(containerRef.current)

    return () => {
      window.removeEventListener("resize", handleResize)
      observer.disconnect()
    }
  }, [])

  if (styles.length === 0) {
    return (
      <section
        id="model-styles"
        role="region"
        aria-labelledby="model-styles-heading"
        className="relative overflow-hidden bg-black py-24 sm:py-28"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(163,255,89,0.08),transparent_55%)]" />
        <div className="container mx-auto max-w-4xl px-6 text-center text-zinc-300">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-lime-300/80">Model Styles</p>
          <h2 id="model-styles-heading" className="mt-4 text-[clamp(2rem,4vw,3.2rem)] font-semibold text-white">
            Realistic looks that match how your customers shop
          </h2>
          <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-base text-zinc-300">
            Model style gallery coming soon — we&rsquo;re updating our examples.
          </p>
        </div>
      </section>
    )
  }

  const maxIndex = Math.max(styles.length - visibleCount, 0)
  const progressSteps = Math.max(maxIndex + 1, 1)

  const shift = Math.max(cardWidth + GAP_PX, 0) * currentIndex

  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0))
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))

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

        <div className="mt-12 flex items-center justify-between">
          <p className="hidden text-sm text-zinc-400 sm:block">Explore the looks your customers expect.</p>
          <div className="hidden items-center gap-3 sm:flex">
            <button
              type="button"
              aria-label="Previous styles"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next styles"
              onClick={handleNext}
              disabled={currentIndex === maxIndex}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative mt-8">
          <div ref={containerRef} className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                gap: `${GAP_PX}px`,
                transform: `translateX(-${shift}px)`,
              }}
            >
              {styles.map((style) => (
                <div
                  key={style.id}
                  className="relative flex-shrink-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                  style={{ width: cardWidth ? `${cardWidth}px` : undefined }}
                >
                  <div className="relative h-[320px] w-full bg-black/40 sm:h-[360px] lg:h-[420px]">
                    <Image
                      src={style.src}
                      alt={`${style.title} AI model preview`}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 30vw"
                      className="h-full w-full object-contain object-center"
                      priority={false}
                    />
                    <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-200">
                      {style.category}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-5 pb-5 pt-16">
                      <p className="text-lg font-semibold text-white">{style.title}</p>
                      <p className="text-sm text-zinc-300">{style.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-black via-black/40 to-transparent sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-black via-black/40 to-transparent sm:block" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: progressSteps }).map((_, index) => {
              const isActive = index === currentIndex
              return (
                <span
                  key={`progress-${index}`}
                  className={`h-1.5 rounded-full ${isActive ? "w-6 bg-lime-300" : "w-3 bg-white/20"}`}
                />
              )
            })}
          </div>
          <div className="flex w-full items-center justify-between sm:hidden">
            <p className="text-sm text-zinc-400">Swipe to explore styles →</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous styles"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next styles"
                onClick={handleNext}
                disabled={currentIndex === maxIndex}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
