import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeToggle } from '../ThemeToggle'
import { ThemeSync } from '../ThemeSync'
import { themeInitScript } from '@/lib/theme'
import messages from '@/messages/en.json'

function renderToggle() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeToggle />
    </NextIntlClientProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.clear()
  })

  it('toggles the dark class on <html> and persists the choice', async () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Toggle theme' })

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('init script applies a stored dark preference before paint', () => {
    localStorage.setItem('theme', 'dark')
    new Function(themeInitScript)()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('init script leaves the page light by default', () => {
    new Function(themeInitScript)()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('ThemeSync', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.clear()
  })

  it('re-applies a saved dark theme when the layout mounts (e.g. after a language switch)', () => {
    localStorage.setItem('theme', 'dark')
    const first = render(<ThemeSync />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Language switch: Next.js swaps in a fresh <html> without the class, then remounts the layout.
    first.unmount()
    document.documentElement.classList.remove('dark')
    render(<ThemeSync />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes a stale dark class when the saved theme is light', () => {
    localStorage.setItem('theme', 'light')
    document.documentElement.classList.add('dark')
    render(<ThemeSync />)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
