import { describe, it, expect } from 'vitest'
import { mapLegacyVehicleFields } from './vehicle-field-mapping'
import { VEHICLE_MIGRATION_FIXTURE } from './vehicle-migration-fixture'

/**
 * Validates mapLegacyVehicleFields() against the T030 fixture — the closest equivalent to
 * quickstart.md Scenario 5's pre/post comparison achievable in this environment: running
 * scripts/migrate-vehicle-fields.ts itself (a thin Local API wrapper around this same function)
 * requires the `payload` CLI/tsx path, which hits the same pre-existing tsx/@next/env ESM-CJS
 * interop failure documented in README Known Issues for `npm run seed` — confirmed to reproduce
 * identically for this script. The pure mapping logic exercised here is what the script runs
 * per-document; only the Local API read/write plumbing around it is untestable in this sandbox.
 */
describe('vehicle migration mapping — fixture validation (quickstart.md Scenario 5)', () => {
  it('migrates every fixture entry without throwing, and never drops a legacy price', () => {
    for (const entry of VEHICLE_MIGRATION_FIXTURE) {
      const update = mapLegacyVehicleFields(entry.legacy, entry.current)

      const hadLegacyPrice = typeof entry.legacy.priceSource.price === 'number'
      if (hadLegacyPrice) {
        const migratedSomewhere = update.priceJpy !== undefined || update.priceUsd !== undefined
        expect(migratedSomewhere, `${entry.description}: legacy price was dropped`).toBe(true)
      }
    }
  })

  it('defaults a blank or unrecognized currency to JPY (not USD, not dropped)', () => {
    const blankCurrency = VEHICLE_MIGRATION_FIXTURE.find((e) => e.description.includes('blank currency'))!
    const unrecognizedCurrency = VEHICLE_MIGRATION_FIXTURE.find((e) => e.description.includes('unrecognized currency'))!

    expect(mapLegacyVehicleFields(blankCurrency.legacy, blankCurrency.current).priceJpy).toBe(1000000)
    expect(mapLegacyVehicleFields(unrecognizedCurrency.legacy, unrecognizedCurrency.current).priceJpy).toBe(2000000)
  })

  it('maps a USD legacy currency to priceUsd, leaving priceJpy untouched', () => {
    const usdEntry = VEHICLE_MIGRATION_FIXTURE.find((e) => e.description.startsWith('a USD-currency'))!
    const update = mapLegacyVehicleFields(usdEntry.legacy, usdEntry.current)
    expect(update.priceUsd).toBe(28000)
    expect(update.priceJpy).toBeUndefined()
  })

  it('carries a pre-existing data gap forward as-is, without throwing', () => {
    const gapEntry = VEHICLE_MIGRATION_FIXTURE.find((e) => e.description.includes('pre-existing data gap'))!
    expect(() => mapLegacyVehicleFields(gapEntry.legacy, gapEntry.current)).not.toThrow()
    const update = mapLegacyVehicleFields(gapEntry.legacy, gapEntry.current)
    expect(update.titleJa).toBeUndefined()
    expect(update.titleEn).toBeUndefined()
  })

  it('resumes a partially-migrated document without overwriting the already-migrated field', () => {
    const partialEntry = VEHICLE_MIGRATION_FIXTURE.find((e) => e.description.includes('partially-migrated'))!
    const update = mapLegacyVehicleFields(partialEntry.legacy, partialEntry.current)
    expect(update.titleJa).toBeUndefined() // already migrated — left untouched
    expect(update.titleEn).toBe('Partially Migrated Vehicle') // still blank — now filled
    expect(update.priceJpy).toBe(3000000)
  })

  it('is a true no-op on a second run against its own output (idempotent)', () => {
    for (const entry of VEHICLE_MIGRATION_FIXTURE) {
      const firstRun = mapLegacyVehicleFields(entry.legacy, entry.current)
      const fullyMigrated = { ...entry.current, ...firstRun }
      const secondRun = mapLegacyVehicleFields(entry.legacy, fullyMigrated)
      expect(secondRun, `${entry.description}: re-running after migration was not a no-op`).toEqual({})
    }
  })
})
