'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

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
    },
    [searchParams, pathname, router],
  )

  const reset = () => router.push(pathname)

  const filteredModels = currentFilters.make
    ? models.filter((m) => {
        const makeProp = m.make
        const makeId = typeof makeProp === 'object' ? makeProp?.id : makeProp
        return makeId === currentFilters.make
      })
    : models

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t('make')}</h2>
        <button onClick={reset} className="text-xs text-[hsl(var(--primary))] hover:underline">
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
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[hsl(var(--border))] rounded px-3 py-2 text-sm bg-white"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
