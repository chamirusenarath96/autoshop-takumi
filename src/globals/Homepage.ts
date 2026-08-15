import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: {
    group: 'Site Configuration',
  },
  fields: [
    {
      name: 'heroHeading',
      type: 'text',
      localized: true,
    },
    {
      name: 'heroSubheading',
      type: 'text',
      localized: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'aboutBlurb',
      type: 'richText',
      localized: true,
    },
    {
      name: 'featuredVehicles',
      type: 'relationship',
      relationTo: 'vehicles',
      hasMany: true,
      admin: {
        description: 'Leave empty to auto-show the 6 newest available vehicles',
      },
    },
    {
      name: 'whyUsPoints',
      type: 'array',
      label: 'Why Us / Trust Signals',
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'body',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'contactSummary',
      type: 'richText',
      localized: true,
      label: 'Hours / Location blurb (shown above footer)',
    },
    {
      name: 'heroStats',
      type: 'array',
      label: 'Hero Stats (e.g. "22 years", "4 lifts")',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'services',
      type: 'array',
      fields: [
        {
          name: 'icon',
          type: 'text',
          admin: { description: 'lucide-react icon name, e.g. "Wrench"' },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          type: 'text',
          localized: true,
        },
        {
          name: 'priceFrom',
          type: 'text',
          localized: true,
          admin: { description: 'e.g. "¥8,000" or "Quote"' },
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Three Steps',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'shopSection',
      type: 'group',
      label: 'Shop Teaser',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'heading',
          type: 'text',
          localized: true,
        },
        {
          name: 'body',
          type: 'text',
          localized: true,
        },
        {
          name: 'linkText',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'ctaBanner',
      type: 'group',
      label: 'CTA Banner',
      fields: [
        {
          name: 'heading',
          type: 'text',
          localized: true,
        },
        {
          name: 'body',
          type: 'text',
          localized: true,
        },
        {
          name: 'buttonText',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
}
