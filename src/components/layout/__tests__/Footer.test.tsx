import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Footer } from '../Footer'
import en from '@/messages/en.json'
import ja from '@/messages/ja.json'

function renderFooter(locale: 'en' | 'ja' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'en' ? en : ja}>
      <Footer locale={locale} />
    </NextIntlClientProvider>,
  )
}

describe('Footer', () => {
  it('renders contact details and business hours from the translation files, not the CMS', () => {
    renderFooter('en')
    expect(screen.getByText(en.shop.phone)).toBeInTheDocument()
    expect(screen.getByText(en.shop.hours)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Follow us on Instagram' })).toHaveAttribute('href', en.shop.instagramUrl)
  })

  it('renders the Japanese shop name and hours in the ja locale', () => {
    renderFooter('ja')
    expect(screen.getAllByText(ja.shop.name).length).toBeGreaterThan(0)
    expect(screen.getByText(ja.shop.hours)).toBeInTheDocument()
  })
})
