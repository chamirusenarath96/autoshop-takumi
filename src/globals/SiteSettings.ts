import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Site Configuration',
  },
  fields: [
    {
      name: 'shopName',
      type: 'text',
      required: true,
      localized: true,
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
      name: 'address',
      type: 'textarea',
      localized: true,
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
      name: 'defaultSeoTitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'defaultSeoDescription',
      type: 'textarea',
      localized: true,
    },
  ],
}
