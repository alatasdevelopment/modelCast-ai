"use client"

import Image from "next/image"
import { motion } from "framer-motion"

const styles = [
  {
    title: "Studio",
    tag: "Premium",
    description: "Crisp lighting, seamless backdrop, editorial-ready.",
    img: "https://images.unsplash.com/photo-1602810318383-1e4e6b08e4ce?auto=format&fit=crop&w=900&q=80",
    badgeColor: "bg-lime-500/15 text-lime-300 border border-lime-400/30",
  },
  {
    title: "Street",
    tag: "Urban",
    description: "City textures with natural motion and attitude.",
    img: "https://images.unsplash.com/photo-1593032465171-cdf8e54db449?auto=format&fit=crop&w=900&q=80",
    badgeColor: "bg-white/10 text-white border border-white/20",
  },
  {
    title: "Outdoor",
    tag: "Natural",
    description: "Sunlit environments, foliage, and real depth.",
    img: "https://images.unsplash.com/photo-1600185366265-36f1d9b8aef0?auto=format&fit=crop&w=900&q=80",
    badgeColor: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
  },
  {
    title: "Editorial",
    tag: "Editorial",
    description: "Art-directed compositions with premium styling.",
    img: "https://images.unsplash.com/photo-1591608512684-3a9c9e8a6857?auto=format&fit=crop&w=900&q=80",
    badgeColor: "bg-sky-500/15 text-sky-200 border border-sky-400/30",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 45 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

export default function ModelStyles() {
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

        {/* Desktop / Tablet grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4"
        >
          {styles.map((style) => (
            <motion.div
              key={style.title}
              variants={cardVariants}
              whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(163,255,88,0.15)" }}
              transition={{ duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={style.img}
                  alt={`${style.title} AI model preview`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              </div>
              <div className="space-y-3 p-5">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.badgeColor}`}>
                  {style.tag}
                </span>
                <h3 className="text-xl font-semibold text-white">{style.title}</h3>
                <p className="text-sm text-zinc-400">{style.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile carousel */}
        <div className="mt-12 flex gap-5 overflow-x-auto pb-4 md:hidden" style={{ scrollbarWidth: "none" }}>
          {styles.map((style) => (
            <motion.div
              key={style.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45 }}
              className="snap-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm min-w-[260px]"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={style.img}
                  alt={`${style.title} AI model preview`}
                  fill
                  sizes="260px"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              </div>
              <div className="space-y-3 p-5">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.badgeColor}`}>
                  {style.tag}
                </span>
                <h3 className="text-xl font-semibold text-white">{style.title}</h3>
                <p className="text-sm text-zinc-400">{style.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
