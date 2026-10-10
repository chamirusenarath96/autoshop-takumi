import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeToggle } from '../ThemeToggle'
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
