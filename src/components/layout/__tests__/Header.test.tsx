import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '../Header'
import messages from '@/messages/en.json'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/vehicles',
  useRouter: () => ({ push: vi.fn() }),
}))

const siteSettings = {
  instagramUrl: 'https://instagram.com/autoshop_takumi',
  instagramHandle: '@autoshop_takumi',
} as any

function renderHeader() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Header locale="en" siteSettings={siteSettings} />
    </NextIntlClientProvider>,
  )
}

describe('Header mobile nav toggle', () => {
  it('has a hamburger control that is closed by default', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument()
  })

  it('reveals nav links, locale switcher, and Instagram link once opened', async () => {
    renderHeader()
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()

    const panel = within(screen.getByTestId('mobile-nav-panel'))
    expect(panel.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Inventory' })).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'About' })).toBeInTheDocument()
    expect(panel.getByRole('link', { name: /follow us on instagram/i })).toBeInTheDocument()
    expect(panel.getByText('JA')).toBeInTheDocument()
    expect(panel.getByText('EN')).toBeInTheDocument()
  })
})
