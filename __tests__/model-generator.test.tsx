import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ModelGenerator } from '@/components/dashboard/model-generator'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/lib/cloudinary', () => ({
  uploadToCloudinary: vi.fn(),
  deleteFromCloudinary: vi.fn(),
}))

const noop = async () => null

describe('ModelGenerator upload modes', () => {
  it('renders single upload UI with upgrade hint for free users', () => {
    render(
      <ModelGenerator
        onGenerate={noop}
        hasCredits
        modeLabel="Basic Mode"
        onUpgradeClick={vi.fn()}
        isPro={false}
      />,
    )

    expect(screen.getByText('Upload Garment Image')).toBeInTheDocument()
    expect(screen.queryByText('Upload Model Image')).not.toBeInTheDocument()
    expect(screen.getByText('Want to upload your own model photo?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeInTheDocument()
  })

  it('renders dual upload UI and advanced toggle for pro users', () => {
    render(
      <ModelGenerator
        onGenerate={noop}
        hasCredits
        modeLabel="Pro Mode"
        onUpgradeClick={vi.fn()}
        isPro
      />,
    )

    expect(screen.getByText('Upload Garment Image')).toBeInTheDocument()
    expect(screen.getByText('Upload Model Image')).toBeInTheDocument()
    expect(screen.getByLabelText('Upload my own model photo (Pro only)')).toBeInTheDocument()
  })
})
