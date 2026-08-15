import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { VehicleFilters } from '../VehicleFilters'
import messages from '@/messages/en.json'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/en/vehicles',
  useSearchParams: () => new URLSearchParams(),
}))

function renderFilters() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <VehicleFilters makes={[]} models={[]} currentFilters={{}} locale="en" />
    </NextIntlClientProvider>,
  )
}

describe('VehicleFilters mobile drawer', () => {
  it('is closed by default', () => {
    renderFilters()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens on trigger click', async () => {
    renderFilters()
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('meets the 44px minimum tap-target height', () => {
    renderFilters()
    expect(screen.getByRole('button', { name: 'Filters' }).className).toMatch(/min-h-11/)
  })

  it('closes on its close control', async () => {
    renderFilters()
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close filters' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
