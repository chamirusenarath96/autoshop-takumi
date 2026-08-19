import type { GlobalConfig } from 'payload'
import { isTextPresent } from '@/lib/content-locale'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Site Configuration',
  },
  fields: [
    {
      // Deprecated — superseded by shopNameJa/shopNameEn below. Kept (not required, not
      // localized) until scripts/migrate-content-locale-fields.ts has run against production
      // and every consumer reads the paired fields instead; see specs/003-remove-payload-localization.
      name: 'shopName',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use Shop Name (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'shopNameJa',
          type: 'text',
          label: 'Shop Name (Japanese)',
          admin: { width: '50%' },
          validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
            if (isTextPresent(value) || isTextPresent(siblingData?.shopNameEn)) return true
            return 'At least one of Shop Name (Japanese) or Shop Name (English) is required.'
          },
        },
        {
          name: 'shopNameEn',
          type: 'text',
          label: 'Shop Name (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      // Deprecated — superseded by addressJa/addressEn below.
      name: 'address',
      type: 'textarea',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use Address (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'addressJa',
          type: 'textarea',
          label: 'Address (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'addressEn',
          type: 'textarea',
          label: 'Address (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'X (Twitter)', value: 'twitter' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'LINE', value: 'line' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'notificationEmails',
      type: 'array',
      label: 'Inquiry Notification Recipients',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'showSoldVehicles',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show sold vehicles on the listing page (as social proof)',
    },
    {
      // Out of scope for specs/003-remove-payload-localization (not in its data-model.md) —
      // left as-is, still localized.
      name: 'businessHours',
      type: 'text',
      localized: true,
      admin: { description: 'e.g. "Mon–Sat 9:00–18:00, closed Sundays"' },
    },
    {
      // Deprecated — superseded by defaultSeoTitleJa/defaultSeoTitleEn below.
      name: 'defaultSeoTitle',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use SEO Title (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'defaultSeoTitleJa',
          type: 'text',
          label: 'SEO Title (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'defaultSeoTitleEn',
          type: 'text',
          label: 'SEO Title (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      // Deprecated — superseded by defaultSeoDescriptionJa/defaultSeoDescriptionEn below.
      name: 'defaultSeoDescription',
      type: 'textarea',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use SEO Description (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'defaultSeoDescriptionJa',
          type: 'textarea',
          label: 'SEO Description (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'defaultSeoDescriptionEn',
          type: 'textarea',
          label: 'SEO Description (English)',
          admin: { width: '50%' },
        },
      ],
    },
  ],
}
