import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleSwitcher } from '../LocaleSwitcher'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/vehicles',
  useRouter: () => ({ push }),
}))

describe('LocaleSwitcher', () => {
  it('renders the language names in their own language', () => {
    render(<LocaleSwitcher locale="en" />)
    expect(screen.getByText('日本語')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('highlights the active locale', () => {
    render(<LocaleSwitcher locale="en" />)
    const enBtn = screen.getByText('English')
    expect(enBtn).toHaveAttribute('data-state', 'on')
    expect(screen.getByText('日本語')).toHaveAttribute('data-state', 'off')
  })

  it('does not navigate when the active language is clicked again', async () => {
    push.mockClear()
    render(<LocaleSwitcher locale="en" />)
    await userEvent.click(screen.getByText('English'))
    expect(push).not.toHaveBeenCalled()
  })

  it('switches to JA when JA is clicked', async () => {
    render(<LocaleSwitcher locale="en" />)
    await userEvent.click(screen.getByText('日本語'))
    expect(push).toHaveBeenCalledWith('/ja/vehicles')
  })
})
