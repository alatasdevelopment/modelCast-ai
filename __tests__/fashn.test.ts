import { describe, expect, it } from 'vitest'

import {
  applyWatermark,
  buildFashnInputs,
  buildPrompt,
  enforceInputWhitelist,
  getModelCandidates,
} from '@/lib/fashn'

describe('FASHN helpers', () => {
  it('builds a descriptive prompt from options', () => {
    const prompt = buildPrompt({
      modelType: 'fashion',
      environment: 'studio',
      ageGroup: 'young',
      gender: 'female',
      style: 'streetwear',
      skinTone: 'warm',
    })

    expect(prompt).toContain('Full-body')
    expect(prompt).toContain('young adult female model')
    expect(prompt).toContain('warm skin tone')
    expect(prompt).toContain('streetwear outfit')
    expect(prompt).toContain('studio lighting')
  })

  it('builds try-on inputs with both garment and model images', () => {
    const inputs = buildFashnInputs('tryon-v1.6', {
      garmentImageUrl: 'https://res.cloudinary.com/demo/image/upload/garment.png',
      modelImageUrl: 'https://res.cloudinary.com/demo/image/upload/model.png',
      prompt: 'studio fashion',
    })

    expect(inputs).toMatchObject({
      garment_image: expect.stringContaining('/garment'),
      model_image: expect.stringContaining('/model'),
      prompt: 'studio fashion',
      output_format: 'png',
    })
  })

  it('omits prompt for try-on models when requested', () => {
    const inputs = buildFashnInputs(
      'tryon-v1.6',
      {
        garmentImageUrl: 'https://res.cloudinary.com/demo/image/upload/garment.png',
        modelImageUrl: 'https://res.cloudinary.com/demo/image/upload/model.png',
        prompt: 'should be omitted',
      },
      { includePrompt: false },
    )

    expect(inputs).toMatchObject({
      garment_image: expect.any(String),
      model_image: expect.any(String),
      output_format: 'png',
    })
    expect('prompt' in inputs).toBe(false)
  })

  it('builds product-to-model inputs with product image only', () => {
    const inputs = buildFashnInputs('product-to-model', {
      garmentImageUrl: 'https://res.cloudinary.com/demo/image/upload/garment.png',
      modelImageUrl: null,
      prompt: 'streetwear fashion',
    })

    expect(inputs).toEqual({
      output_format: 'png',
      prompt: 'streetwear fashion',
      product_image: expect.stringContaining('/garment'),
    })
  })

  it('enforces whitelist by removing unsupported keys', () => {
    const rawInputs = {
      output_format: 'png',
      prompt: 'studio look',
      product_image: 'https://res.cloudinary.com/demo/image/upload/product.png',
      garment_image: 'https://res.cloudinary.com/demo/image/upload/should-remove.png',
    }

    const sanitized = enforceInputWhitelist('product-to-model', rawInputs)
    expect(sanitized).toEqual({
      output_format: 'png',
      prompt: 'studio look',
      product_image: expect.stringContaining('/product'),
    })
    expect('garment_image' in sanitized).toBe(false)
  })

  it('keeps try-on required keys when whitelisting', () => {
    const rawInputs = {
      output_format: 'png',
      prompt: 'outdoor portrait',
      model_image: 'https://res.cloudinary.com/demo/image/upload/model.png',
      garment_image: 'https://res.cloudinary.com/demo/image/upload/garment.png',
    }

    const sanitized = enforceInputWhitelist('tryon-v1.6', rawInputs)
    expect(sanitized).toEqual(rawInputs)
  })

  it('selects the correct model candidates based on upload type', () => {
    expect(getModelCandidates(true)).toEqual(['tryon-v1.6', 'tryon-v1.5'])
    expect(getModelCandidates(false)).toEqual(['product-to-model'])
  })

  it('applies watermark to non-pro outputs', () => {
    const original = 'https://res.cloudinary.com/demo/image/upload/v123/modelcast.png'
    const watermarked = applyWatermark(original, { width: 1024, cacheBust: true })
    expect(watermarked).toContain('w_1024')
    expect(watermarked).toContain('l_modelcast_watermark')
    expect(watermarked).toContain('cb=')
    expect(watermarked).not.toBe(original)
  })

  it('applies overlay without width when not provided', () => {
    const original = 'https://res.cloudinary.com/demo/image/upload/v123/modelcast.png'
    const watermarked = applyWatermark(original)
    expect(watermarked).toContain('l_modelcast_watermark')
    expect(watermarked).not.toContain('w_1024')
  })

  it('does not duplicate watermark if already applied', () => {
    const alreadyWatermarked =
      'https://res.cloudinary.com/demo/image/upload/l_modelcast_watermark,o_35,g_south_east,x_10,y_10/v123/modelcast.png'
    expect(applyWatermark(alreadyWatermarked)).toBe(alreadyWatermarked)
  })
})
