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
  ],
}
