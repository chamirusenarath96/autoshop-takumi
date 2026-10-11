import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '../Header'
import messages from '@/messages/en.json'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/gallery',
  useRouter: () => ({ push: vi.fn() }),
}))


function renderHeader() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Header locale="en" />
    </NextIntlClientProvider>,
  )
}

describe('Header mobile nav toggle', () => {
  it('has a menu control that is closed by default', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-nav-panel')).not.toBeInTheDocument()
  })

  it('reveals nav links and the locale switcher once opened', async () => {
    renderHeader()
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }))

    const panel = within(screen.getByTestId('mobile-nav-panel'))
    expect(panel.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Gallery' })).toBeInTheDocument()
    expect(panel.queryByRole('link', { name: 'About' })).not.toBeInTheDocument()
    expect(panel.getByText('日本語')).toBeInTheDocument()
    expect(panel.getByText('English')).toBeInTheDocument()
  })
})

describe('Header wordmark', () => {
  it('renders the shop name as a text wordmark linking home', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Autoshop Takumi' })).toHaveAttribute('href', '/en')
  })
})

describe('Header Japan store link', () => {
  it('is hidden while no Japan store URL is configured', () => {
    renderHeader()
    expect(screen.queryByRole('link', { name: /Japan store/ })).not.toBeInTheDocument()
  })
})
