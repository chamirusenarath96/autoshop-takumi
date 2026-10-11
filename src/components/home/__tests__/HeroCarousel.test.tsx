import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { HeroCarousel } from '../HeroCarousel'
import messages from '@/messages/en.json'

beforeAll(() => {
  // happy-dom lacks these browser APIs, which embla-carousel and the reduced-motion check read.
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as any
  ;(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
  ;(globalThis as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
})

const slides = [
  { url: '/a.jpg', alt: 'Shop front' },
  { url: '/b.jpg', alt: 'Workshop' },
  { url: '/c.jpg', alt: 'Delivery' },
]

function renderHero(s = slides) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HeroCarousel slides={s}>
        <h1>Your best car, from us</h1>
      </HeroCarousel>
    </NextIntlClientProvider>,
  )
}

describe('HeroCarousel', () => {
  it('renders every slide photo and the overlaid headline', () => {
    renderHero()
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Your best car, from us' })).toBeInTheDocument()
  })

  it('loads only the first photo eagerly', () => {
    renderHero()
    const imgs = screen.getAllByRole('img')
    expect(imgs[0]).toHaveAttribute('loading', 'eager')
    expect(imgs[1]).toHaveAttribute('loading', 'lazy')
  })

  it('shows arrows and one dot per slide when there are several slides', () => {
    renderHero()
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Go to slide/ })).toHaveLength(3)
  })

  it('hides the controls for a single slide', () => {
    renderHero(slides.slice(0, 1))
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument()
  })

  it('falls back to a plain brand band with the headline when there are no photos', () => {
    renderHero([])
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your best car, from us' })).toBeInTheDocument()
  })
})
