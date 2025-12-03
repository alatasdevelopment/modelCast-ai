"use client"

import Image from "next/image"

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
            <div className="mt-14">
              <div
                className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6"
                style={{ scrollbarWidth: "thin" }}
                aria-label="Model style gallery"
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
