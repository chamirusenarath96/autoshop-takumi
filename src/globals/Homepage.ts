import type { GlobalConfig } from 'payload'
import { isTextPresent } from '@/lib/content-locale'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: {
    group: 'Site Configuration',
  },
  fields: [
    {
      // Deprecated — superseded by heroHeadingJa/heroHeadingEn below.
      name: 'heroHeading',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use Hero Heading (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'heroHeadingJa',
          type: 'text',
          label: 'Hero Heading (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'heroHeadingEn',
          type: 'text',
          label: 'Hero Heading (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      // Deprecated — superseded by heroSubheadingJa/heroSubheadingEn below.
      name: 'heroSubheading',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use Hero Subheading (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'heroSubheadingJa',
          type: 'text',
          label: 'Hero Subheading (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'heroSubheadingEn',
          type: 'text',
          label: 'Hero Subheading (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      // Deprecated — superseded by aboutBlurbJa/aboutBlurbEn below. Not currently rendered by
      // any page consumer (see research.md's equivalent note for defaultSeoTitle/Description) —
      // this migration covers its storage only.
      name: 'aboutBlurb',
      type: 'richText',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use About Blurb (Japanese)/(English) below' },
    },
    {
      name: 'aboutBlurbJa',
      type: 'richText',
      label: 'About Blurb (Japanese)',
    },
    {
      name: 'aboutBlurbEn',
      type: 'richText',
      label: 'About Blurb (English)',
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
          // Deprecated — superseded by headingJa/headingEn below.
          name: 'heading',
          type: 'text',
          localized: true,
          admin: { readOnly: true, description: 'Deprecated — use Heading (Japanese)/(English) below' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'headingJa',
              type: 'text',
              label: 'Heading (Japanese)',
              admin: { width: '50%' },
              validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
                if (isTextPresent(value) || isTextPresent(siblingData?.headingEn)) return true
                return 'At least one of Heading (Japanese) or Heading (English) is required.'
              },
            },
            {
              name: 'headingEn',
              type: 'text',
              label: 'Heading (English)',
              admin: { width: '50%' },
            },
          ],
        },
        {
          // Deprecated — superseded by bodyJa/bodyEn below.
          name: 'body',
          type: 'text',
          localized: true,
          admin: { readOnly: true, description: 'Deprecated — use Body (Japanese)/(English) below' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'bodyJa',
              type: 'text',
              label: 'Body (Japanese)',
              admin: { width: '50%' },
            },
            {
              name: 'bodyEn',
              type: 'text',
              label: 'Body (English)',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      // Deprecated — superseded by contactSummaryJa/contactSummaryEn below. Not currently
      // rendered by any page consumer (see research.md's equivalent note for
      // defaultSeoTitle/Description) — this migration covers its storage only.
      name: 'contactSummary',
      type: 'richText',
      localized: true,
      label: 'Hours / Location blurb (shown above footer) — deprecated, use paired fields below',
    },
    {
      name: 'contactSummaryJa',
      type: 'richText',
      label: 'Hours / Location blurb (Japanese, shown above footer)',
    },
    {
      name: 'contactSummaryEn',
      type: 'richText',
      label: 'Hours / Location blurb (English, shown above footer)',
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
