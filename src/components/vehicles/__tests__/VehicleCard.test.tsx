import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VehicleCard } from '../VehicleCard'

const baseVehicle = {
  id: '1',
  slug: 'test-supra',
  titleJa: '1999年式 トヨタ スープラ RZ',
  titleEn: '1999 Toyota Supra RZ',
  year: 1999,
  status: 'available',
  priceJpy: 3500000,
  priceUsd: undefined,
  mileageKm: 85000,
  priceOnRequest: false,
  heroImage: {
    url: '/test-image.jpg',
    sizes: { card: { url: '/test-image-card.jpg' } },
  },
}

describe('VehicleCard', () => {
  it('renders the vehicle title matching the active locale', () => {
    render(<VehicleCard vehicle={baseVehicle} locale="en" />)
    expect(screen.getByText('1999 Toyota Supra RZ')).toBeInTheDocument()
  })

  it('falls back to the other language when the active locale title is blank', () => {
    render(<VehicleCard vehicle={{ ...baseVehicle, titleEn: undefined }} locale="en" />)
    expect(screen.getByText('1999年式 トヨタ スープラ RZ')).toBeInTheDocument()
  })

  it('omits the title fallback only when both languages are blank', () => {
    render(<VehicleCard vehicle={{ ...baseVehicle, titleJa: undefined, titleEn: undefined, title: undefined }} locale="en" />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('')
  })

  it('formats the JPY price for Japanese locale', () => {
    render(<VehicleCard vehicle={baseVehicle} locale="ja" />)
    expect(screen.getByText(/3,500,000/)).toBeInTheDocument()
  })

  it('shows both JPY and USD prices when both are set', () => {
    render(<VehicleCard vehicle={{ ...baseVehicle, priceUsd: 23000 }} locale="en" />)
    expect(screen.getByText(/3,500,000/)).toBeInTheDocument()
    expect(screen.getByText(/23,000/)).toBeInTheDocument()
  })

  it('shows mileage', () => {
    render(<VehicleCard vehicle={baseVehicle} locale="en" />)
    expect(screen.getByText(/85,000 km/)).toBeInTheDocument()
  })

  it('shows "Contact for price" when priceOnRequest is true', () => {
    render(<VehicleCard vehicle={{ ...baseVehicle, priceOnRequest: true }} locale="en" />)
    expect(screen.getByText('Contact for price')).toBeInTheDocument()
  })

  it('shows "要お問い合わせ" for Japanese priceOnRequest', () => {
    render(<VehicleCard vehicle={{ ...baseVehicle, priceOnRequest: true }} locale="ja" />)
    expect(screen.getByText('要お問い合わせ')).toBeInTheDocument()
  })

  it('shows sold badge when status is sold', () => {
    render(<VehicleCard vehicle={{ ...baseVehicle, status: 'sold' }} locale="en" />)
    expect(screen.getByText('Sold')).toBeInTheDocument()
  })

  it('links to the vehicle detail page', () => {
    render(<VehicleCard vehicle={baseVehicle} locale="en" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/en/vehicles/test-supra')
  })
})
