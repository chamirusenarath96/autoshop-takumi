import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FacilityGallery } from '../FacilityGallery'

describe('FacilityGallery', () => {
  it('renders nothing when every item has a caption but no image', () => {
    const { container } = render(
      <FacilityGallery items={[{ caption: 'Lift bay 1' }, { caption: 'Lift bay 2' }]} />,
    )
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Lift bay 1')).not.toBeInTheDocument()
  })

  it('renders only items that have an image', () => {
    render(
      <FacilityGallery
        items={[
          { caption: 'No image here' },
          { image: { url: '/facility.jpg' }, caption: 'Paint booth' },
        ]}
      />,
    )
    expect(screen.queryByText('No image here')).not.toBeInTheDocument()
    expect(screen.getByText('Paint booth')).toBeInTheDocument()
    expect(screen.getByAltText('Paint booth')).toHaveAttribute('src', '/facility.jpg')
  })
})
