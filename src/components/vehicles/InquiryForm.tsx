'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  vehicleId: string
  locale: string
}

export function InquiryForm({ vehicleId, locale }: Props) {
  const t = useTranslations('inquiry')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = e.currentTarget
    const data = {
      vehicle: vehicleId,
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      locale,
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <p className="text-success font-medium">{t('success')}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="inquiry-name" className="block text-sm font-medium mb-1">{t('name')}</label>
        <Input id="inquiry-name" name="name" required />
      </div>
      <div>
        <label htmlFor="inquiry-email" className="block text-sm font-medium mb-1">{t('email')}</label>
        <Input id="inquiry-email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="inquiry-phone" className="block text-sm font-medium mb-1">{t('phone')}</label>
        <Input id="inquiry-phone" name="phone" type="tel" />
      </div>
      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium mb-1">{t('message')}</label>
        <textarea
          id="inquiry-message"
          name="message"
          required
          rows={4}
          className="w-full min-h-32 border border-input rounded-md px-3 py-2 text-base bg-background text-foreground sm:text-sm"
        />
      </div>
      {status === 'error' && <p className="text-destructive text-sm break-words">{t('error')}</p>}
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? '...' : t('submit')}
      </Button>
    </form>
  )
}
