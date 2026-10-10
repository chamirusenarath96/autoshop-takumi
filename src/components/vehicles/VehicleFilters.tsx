'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

type Props = {
  makes: any[]
  models: any[]
  currentFilters: Record<string, string | undefined>
  locale: string
}

// Radix Select forbids an empty-string item value, so "all / unset" is this sentinel.
const ALL = '__all__'

export function VehicleFilters({ makes, models, currentFilters, locale }: Props) {
  const t = useTranslations('vehicles.filters')
  const tSort = useTranslations('vehicles.sort')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== ALL) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset model when make changes
      if (key === 'make') params.delete('model')
      router.push(`${pathname}?${params.toString()}`)
      setSheetOpen(false)
    },
    [searchParams, pathname, router],
  )

  const reset = useCallback(() => {
    router.push(pathname)
    setSheetOpen(false)
  }, [pathname, router])

  const filteredModels = currentFilters.make
    ? models.filter((m) => {
        const makeProp = m.make
        const makeId = typeof makeProp === 'object' ? makeProp?.id : makeProp
        return makeId === currentFilters.make
      })
    : models

  const fields = (idPrefix: string) => (
    <div className="flex flex-col gap-4">
      <FilterSelect
        id={`${idPrefix}-sort`}
        label={tSort('label')}
        value={currentFilters.sort ?? 'newest'}
        onChange={(v) => updateFilter('sort', v)}
        options={[
          { value: 'newest', label: tSort('newest') },
          { value: 'priceLow', label: tSort('priceLow') },
          { value: 'priceHigh', label: tSort('priceHigh') },
        ]}
      />
      <FilterSelect
        id={`${idPrefix}-make`}
        label={t('make')}
        value={currentFilters.make ?? ALL}
        onChange={(v) => updateFilter('make', v)}
        options={[{ value: ALL, label: t('all') }, ...makes.map((m) => ({ value: m.id, label: m.name }))]}
      />
      <FilterSelect
        id={`${idPrefix}-model`}
        label={t('model')}
        value={currentFilters.model ?? ALL}
        onChange={(v) => updateFilter('model', v)}
        options={[{ value: ALL, label: t('all') }, ...filteredModels.map((m) => ({ value: m.id, label: m.name }))]}
      />
      <FilterSelect
        id={`${idPrefix}-bodyType`}
        label={t('bodyType')}
        value={currentFilters.bodyType ?? ALL}
        onChange={(v) => updateFilter('bodyType', v)}
        options={[
          { value: ALL, label: t('all') },
          { value: 'sedan', label: locale === 'ja' ? 'セダン' : 'Sedan' },
          { value: 'coupe', label: locale === 'ja' ? 'クーペ' : 'Coupe' },
          { value: 'suv', label: 'SUV' },
          { value: 'wagon', label: locale === 'ja' ? 'ワゴン' : 'Wagon' },
          { value: 'kei', label: locale === 'ja' ? '軽自動車' : 'Kei' },
          { value: 'other', label: locale === 'ja' ? 'その他' : 'Other' },
        ]}
      />
      <FilterSelect
        id={`${idPrefix}-transmission`}
        label={t('transmission')}
        value={currentFilters.transmission ?? ALL}
        onChange={(v) => updateFilter('transmission', v)}
        options={[
          { value: ALL, label: t('all') },
          { value: 'MT', label: 'Manual (MT)' },
          { value: 'AT', label: 'Automatic (AT)' },
          { value: 'CVT', label: 'CVT' },
        ]}
      />
      <Button variant="outline" onClick={reset}>
        {t('reset')}
      </Button>
    </div>
  )

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <div className="hidden lg:block">{fields('desktop')}</div>

      {/* Mobile/tablet: trigger + sheet */}
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              {t('openFilters')}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{t('openFilters')}</SheetTitle>
            </SheetHeader>
            <div className="px-4">{fields('sheet')}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
