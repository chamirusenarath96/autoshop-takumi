'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

type Props = {
  makes: any[]
  models: any[]
  currentFilters: Record<string, string | undefined>
  locale: string
}

export function VehicleFilters({ makes, models, currentFilters, locale }: Props) {
  const t = useTranslations('vehicles.filters')
  const tSort = useTranslations('vehicles.sort')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset model when make changes
      if (key === 'make') params.delete('model')
      router.push(`${pathname}?${params.toString()}`)
      setDrawerOpen(false)
    },
    [searchParams, pathname, router],
  )

  const reset = useCallback(() => {
    router.push(pathname)
    setDrawerOpen(false)
  }, [pathname, router])

  const filteredModels = currentFilters.make
    ? models.filter((m) => {
        const makeProp = m.make
        const makeId = typeof makeProp === 'object' ? makeProp?.id : makeProp
        return makeId === currentFilters.make
      })
    : models

  const fields = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="takumi-eyebrow text-foreground">{t('make')}</h2>
        <button onClick={reset} className="text-xs text-primary hover:underline">
          {t('reset')}
        </button>
      </div>

      {/* Sort */}
      <FilterSelect
        label={tSort('label')}
        value={currentFilters.sort ?? ''}
        onChange={(v) => updateFilter('sort', v)}
        options={[
          { value: 'newest', label: tSort('newest') },
          { value: 'priceLow', label: tSort('priceLow') },
          { value: 'priceHigh', label: tSort('priceHigh') },
        ]}
        allLabel={tSort('newest')}
      />

      {/* Make */}
      <FilterSelect
        label={t('make')}
        value={currentFilters.make ?? ''}
        onChange={(v) => updateFilter('make', v)}
        options={makes.map((m) => ({ value: m.id, label: m.name }))}
        allLabel={t('all')}
      />

      {/* Model */}
      <FilterSelect
        label={t('model')}
        value={currentFilters.model ?? ''}
        onChange={(v) => updateFilter('model', v)}
        options={filteredModels.map((m) => ({ value: m.id, label: m.name }))}
        allLabel={t('all')}
      />

      {/* Body type */}
      <FilterSelect
        label={t('bodyType')}
        value={currentFilters.bodyType ?? ''}
        onChange={(v) => updateFilter('bodyType', v)}
        options={[
          { value: 'sedan', label: locale === 'ja' ? 'セダン' : 'Sedan' },
          { value: 'coupe', label: locale === 'ja' ? 'クーペ' : 'Coupe' },
          { value: 'suv', label: 'SUV' },
          { value: 'wagon', label: locale === 'ja' ? 'ワゴン' : 'Wagon' },
          { value: 'kei', label: locale === 'ja' ? '軽自動車' : 'Kei' },
          { value: 'other', label: locale === 'ja' ? 'その他' : 'Other' },
        ]}
        allLabel={t('all')}
      />

      {/* Transmission */}
      <FilterSelect
        label={t('transmission')}
        value={currentFilters.transmission ?? ''}
        onChange={(v) => updateFilter('transmission', v)}
        options={[
          { value: 'MT', label: 'Manual (MT)' },
          { value: 'AT', label: 'Automatic (AT)' },
          { value: 'CVT', label: 'CVT' },
        ]}
        allLabel={t('all')}
      />
    </div>
  )

  return (
    <>
      {/* Desktop: always-visible inline sidebar (unchanged behavior) */}
      <div className="hidden lg:block">{fields}</div>

      {/* Mobile/tablet: trigger + drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-input rounded-md px-4 py-2.5 text-sm font-medium bg-background text-foreground"
        >
          {t('openFilters')}
        </button>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-heading">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="relative w-full max-w-xs h-full bg-background text-foreground overflow-y-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 id="filter-drawer-heading" className="font-semibold text-lg">{t('openFilters')}</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t('closeFilters')}
                  className="text-2xl leading-none px-2 py-1"
                >
                  ×
                </button>
              </div>
              {fields}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  allLabel: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-11 border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
