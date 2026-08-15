import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Footer } from '../Footer'
import messages from '@/messages/en.json'
import type { SiteSettingsData } from '@/lib/site-settings'

const baseSiteSettings: SiteSettingsData = {
  shopName: 'Autoshop Takumi',
  contactEmail: 'hi@example.com',
  contactPhone: '022-342-2285',
  address: null,
  businessHours: null,
  instagramUrl: null,
  instagramHandle: null,
}

function renderFooter(overrides: Partial<SiteSettingsData> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Footer locale="en" siteSettings={{ ...baseSiteSettings, ...overrides }} />
    </NextIntlClientProvider>,
  )
}

describe('Footer', () => {
  it('renders business hours when configured', () => {
    renderFooter({ businessHours: 'Mon–Sat 9:00–18:00, closed Sundays' })
    expect(screen.getByText('Mon–Sat 9:00–18:00, closed Sundays')).toBeInTheDocument()
  })

  it('renders without business hours when not configured', () => {
    renderFooter({ businessHours: null })
    expect(screen.queryByText(/closed Sundays/)).not.toBeInTheDocument()
  })
})
