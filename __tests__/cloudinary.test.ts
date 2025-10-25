import { describe, expect, it, vi } from 'vitest'

import { ensureModelcastWatermark } from '@/lib/cloudinary'

describe('ensureModelcastWatermark', () => {
  it('injects the ModelCast overlay when missing', () => {
    const original = 'https://res.cloudinary.com/demo/image/upload/v123/sample.png'
    const transformed = ensureModelcastWatermark(original)

    expect(transformed).toContain('l_modelcast_watermark')
    expect(transformed).toContain('/upload/l_modelcast_watermark,o_25,g_south_east,x_10,y_10/')
  })

  it('avoids duplicating the overlay if already present', () => {
    const existing =
      'https://res.cloudinary.com/demo/image/upload/l_modelcast_watermark,o_25,g_south_east,x_10,y_10/v123/sample.png'
    const transformed = ensureModelcastWatermark(existing)

    expect(transformed).toBe(existing)
  })

  it('can append a cache buster when a new overlay is applied', () => {
    vi.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'))

    const original = 'https://res.cloudinary.com/demo/image/upload/v123/sample.png'
    const transformed = ensureModelcastWatermark(original, { cacheBust: true })

    expect(transformed).toContain('cb=1704067200000')

    vi.useRealTimers()
  })
})
