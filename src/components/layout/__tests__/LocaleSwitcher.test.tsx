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
  it('renders JA and EN buttons', () => {
    render(<LocaleSwitcher locale="en" />)
    expect(screen.getByText('JA')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('highlights the active locale', () => {
    render(<LocaleSwitcher locale="en" />)
    const enBtn = screen.getByText('EN')
    expect(enBtn.className).toMatch(/bg-\[hsl\(var\(--secondary\)\)\]/)
  })

  it('switches to JA when JA is clicked', async () => {
    render(<LocaleSwitcher locale="en" />)
    await userEvent.click(screen.getByText('JA'))
    expect(push).toHaveBeenCalledWith('/ja/vehicles')
  })
})
