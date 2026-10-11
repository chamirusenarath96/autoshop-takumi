import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { GalleryGrid } from '../GalleryGrid'
import messages from '@/messages/en.json'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as any
  ;(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
  ;(globalThis as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
})

const photos = [1, 2, 3].map((n) => ({ id: String(n), thumb: `/t${n}.jpg`, full: `/f${n}.jpg`, alt: '' }))

function renderGrid(p = photos) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GalleryGrid photos={p} />
    </NextIntlClientProvider>,
  )
}

describe('GalleryGrid', () => {
  it('renders one labelled tile per photo and no captions', () => {
    renderGrid()
    expect(screen.getAllByRole('button', { name: /Open photo/ })).toHaveLength(3)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens a lightbox with the full-size photo and a position counter', async () => {
    renderGrid()
    await userEvent.click(screen.getByRole('button', { name: 'Open photo 2' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(document.querySelector('img[src="/f2.jpg"]')).not.toBeNull()
  })

  it('offers previous/next controls in the lightbox', async () => {
    renderGrid()
    await userEvent.click(screen.getByRole('button', { name: 'Open photo 1' }))
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument()
  })

  it('closes the lightbox with its close control', async () => {
    renderGrid()
    await userEvent.click(screen.getByRole('button', { name: 'Open photo 1' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no photos', () => {
    renderGrid([])
    expect(screen.getByText('Photos are on the way.')).toBeInTheDocument()
  })
})
