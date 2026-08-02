import { test, expect } from '@playwright/test'
import { assertNoHorizontalOverflow, attachPageLoadTiming, AUTH_STATE_PATH, createPublishedVehicle } from './helpers'

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const

test.describe('Responsive — mobile (375px)', () => {
  test.use({ viewport: VIEWPORTS.mobile, hasTouch: true })
})

test.describe('Responsive — tablet (768px)', () => {
  test.use({ viewport: VIEWPORTS.tablet })
})

test.describe('Responsive — desktop (1280px)', () => {
  test.use({ viewport: VIEWPORTS.desktop })
})
