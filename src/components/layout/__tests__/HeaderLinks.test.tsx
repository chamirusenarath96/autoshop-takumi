import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '../Header'
import messages from '@/messages/en.json'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/shop-links', () => ({
  INSTAGRAM_URL: 'https://www.instagram.com/autoshop_takumi/',
  INSTAGRAM_HANDLE: '@autoshop_takumi',
  JAPAN_STORE_URL: 'https://example.jp/store',
  MAP_URL: '',
}))

describe('Header external links', () => {
  it('links to Instagram and the Japan store in new tabs when the store URL is set', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Header locale="en" />
      </NextIntlClientProvider>,
    )
    const insta = screen.getByRole('link', { name: 'Instagram' })
    expect(insta).toHaveAttribute('href', 'https://www.instagram.com/autoshop_takumi/')
    expect(insta).toHaveAttribute('target', '_blank')
    expect(insta).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(screen.getByRole('link', { name: /Japan store/ })).toHaveAttribute('href', 'https://example.jp/store')
  })
})
