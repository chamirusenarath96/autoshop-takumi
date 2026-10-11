import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VehicleScroller } from '../VehicleScroller'
import { VehicleCard } from '@/components/vehicles/VehicleCard'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as any
  ;(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
  ;(globalThis as any).IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
})

const vehicle = (n: number) => ({ id: String(n), titleEn: `Car ${n}`, year: 2000 + n, status: 'available', priceJpy: 1000000 * n })

describe('VehicleScroller', () => {
  it('renders every card in one labelled, scrollable row', () => {
    render(
      <VehicleScroller label="Latest arrivals">
        {[1, 2, 3].map((n) => (
          <VehicleCard key={n} vehicle={vehicle(n)} locale="en" compact />
        ))}
      </VehicleScroller>,
    )
    expect(screen.getByRole('region', { name: 'Latest arrivals' })).toBeInTheDocument()
    expect(screen.getAllByRole('group')).toHaveLength(3)
    expect(screen.getByText('Car 3')).toBeInTheDocument()
  })

  it('sizes slides as a fraction of the row so several cards peek in on every breakpoint', () => {
    render(
      <VehicleScroller label="Latest arrivals">
        <VehicleCard vehicle={vehicle(1)} locale="en" compact />
      </VehicleScroller>,
    )
    const slide = screen.getByRole('group')
    expect(slide.className).toContain('basis-[68%]')
    expect(slide.className).toContain('lg:basis-1/4')
  })
})
