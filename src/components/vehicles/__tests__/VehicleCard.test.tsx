import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VehicleCard } from '../VehicleCard'

const baseVehicle = {
  id: '1',
  slug: 'test-supra',
  title: '1999 Toyota Supra RZ',
  year: 1999,
  status: 'available',
  price: 3500000,
  currency: 'JPY',
  mileageKm: 85000,
  priceOnRequest: false,
  heroImage: {
    url: '/test-image.jpg',
    sizes: { card: { url: '/test-image-card.jpg' } },
  },
}

describe('VehicleCard', () => {
  it('renders the vehicle title', () => {
    render(<VehicleCard vehicle={baseVehicle} locale="en" />)
    expect(screen.getByText('1999 Toyota Supra RZ')).toBeInTheDocument()
  })

  it('formats price in JPY for Japanese locale', () => {
    render(<VehicleCard vehicle={baseVehicle} locale="ja" />)
    expect(screen.getByText(/3,500,000/)).toBeInTheDocument()
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
