import type { CollectionConfig } from 'payload'
import { isNumberPresent, isTextPresent } from '@/lib/vehicle-locale'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'make', 'year', 'status', 'price'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      // No longer required at the schema level — the paired titleJa/titleEn fields below are
      // the fields staff actually fill in now; publish-readiness is enforced by the beforeChange
      // hook instead (FR-008), and this field is removed entirely once the migration lands (T036).
      localized: true,
      admin: { description: 'e.g. "1999 Toyota Supra RZ" (legacy — being replaced by Title (Japanese)/Title (English) below)' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'titleJa',
          type: 'text',
          label: 'Title (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'titleEn',
          type: 'text',
          label: 'Title (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Auto-generated from English title; editable',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Available', value: 'available' },
        { label: 'Reserved', value: 'reserved' },
        { label: 'Sold', value: 'sold' },
      ],
    },
    {
      name: 'make',
      type: 'relationship',
      relationTo: 'makes',
      required: true,
    },
    {
      name: 'model',
      type: 'relationship',
      relationTo: 'models',
      required: true,
      filterOptions: ({ siblingData }) => {
        const data = siblingData as Record<string, unknown>
        if (data?.make) {
          return { make: { equals: data.make } }
        }
        return true
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          admin: { width: '50%', description: 'Legacy — being replaced by Price (JPY)/Price (USD) below' },
        },
        {
          name: 'priceOnRequest',
          type: 'checkbox',
          label: 'Price on Request ("Contact for price")',
          defaultValue: false,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'JPY',
      options: [
        { label: 'JPY (¥)', value: 'JPY' },
        { label: 'USD ($)', value: 'USD' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'priceJpy',
          type: 'number',
          label: 'Price (JPY)',
          admin: { width: '50%' },
        },
        {
          name: 'priceUsd',
          type: 'number',
          label: 'Price (USD)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'mileageKm',
      type: 'number',
      label: 'Mileage (km)',
    },
    {
      name: 'transmission',
      type: 'select',
      options: [
        { label: 'Manual (MT)', value: 'MT' },
        { label: 'Automatic (AT)', value: 'AT' },
        { label: 'CVT', value: 'CVT' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'bodyType',
      type: 'select',
      options: [
        { label: 'Sedan', value: 'sedan' },
        { label: 'Coupe', value: 'coupe' },
        { label: 'SUV', value: 'suv' },
        { label: 'Wagon', value: 'wagon' },
        { label: 'Kei', value: 'kei' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'exteriorColor',
      type: 'text',
      localized: true,
      admin: { description: 'Legacy — being replaced by Exterior Color (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'exteriorColorJa',
          type: 'text',
          label: 'Exterior Color (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'exteriorColorEn',
          type: 'text',
          label: 'Exterior Color (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'shakenExpiry',
      type: 'date',
      label: 'Shaken (車検) Expiry',
      admin: {
        description: 'Japanese roadworthiness inspection expiry — hide on frontend if blank',
        date: { pickerAppearance: 'monthOnly' },
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      admin: { description: 'Legacy (short overview) — being replaced by Summary (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'summaryJa',
          type: 'textarea',
          label: 'Summary (Japanese)',
          admin: { width: '50%', description: 'Short overview shown near the top of the detail page' },
        },
        {
          name: 'summaryEn',
          type: 'textarea',
          label: 'Summary (English)',
          admin: { width: '50%', description: 'Short overview shown near the top of the detail page' },
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      label: 'Highlights (bullet points)',
      fields: [
        {
          name: 'text',
          type: 'text',
          // No longer required — see the paired textJa/textEn fields below (legacy field only).
          localized: true,
          admin: { description: 'Legacy — being replaced by the Japanese/English fields below' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'textJa',
              type: 'text',
              label: 'Text (Japanese)',
              admin: { width: '50%' },
            },
            {
              name: 'textEn',
              type: 'text',
              label: 'Text (English)',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: 'Long Description (legacy — being replaced by Description (Japanese)/(English) below)',
    },
    {
      name: 'descriptionJa',
      type: 'richText',
      label: 'Description (Japanese)',
    },
    {
      name: 'descriptionEn',
      type: 'richText',
      label: 'Description (English)',
    },
    {
      name: 'specs',
      type: 'array',
      label: 'Spec Table (flexible key/value pairs)',
      admin: {
        description: 'Add rows for engine, suspension, brakes, wheels, tires, interior, remarks, etc.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          // No longer required — see the paired labelJa/labelEn fields below (legacy field only).
          localized: true,
          admin: { description: 'Legacy — being replaced by the Japanese/English fields below' },
        },
        {
          name: 'value',
          type: 'text',
          // No longer required — see the paired valueJa/valueEn fields below (legacy field only).
          localized: true,
          admin: { description: 'Legacy — being replaced by the Japanese/English fields below' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'labelJa',
              type: 'text',
              label: 'Label (Japanese)',
              admin: { width: '50%' },
            },
            {
              name: 'labelEn',
              type: 'text',
              label: 'Label (English)',
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'valueJa',
              type: 'text',
              label: 'Value (Japanese)',
              admin: { width: '50%' },
            },
            {
              name: 'valueEn',
              type: 'text',
              label: 'Value (English)',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      // Not required at schema level — drafts can exist without a photo.
      // The beforeChange hook blocks status:'available' without a heroImage.
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show on the homepage featured section' },
    },
    {
      name: 'relatedVehicles',
      type: 'relationship',
      relationTo: 'vehicles',
      hasMany: true,
    },
    {
      name: 'seoTitle',
      type: 'text',
      localized: true,
      admin: { description: 'Legacy — being replaced by SEO Title (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'seoTitleJa',
          type: 'text',
          label: 'SEO Title (Japanese)',
          admin: { width: '50%', description: 'Override the page <title> for SEO' },
        },
        {
          name: 'seoTitleEn',
          type: 'text',
          label: 'SEO Title (English)',
          admin: { width: '50%', description: 'Override the page <title> for SEO' },
        },
      ],
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      localized: true,
      admin: { description: 'Legacy — being replaced by SEO Description (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'seoDescriptionJa',
          type: 'textarea',
          label: 'SEO Description (Japanese)',
          admin: { width: '50%', description: 'Override the meta description for SEO' },
        },
        {
          name: 'seoDescriptionEn',
          type: 'textarea',
          label: 'SEO Description (English)',
          admin: { width: '50%', description: 'Override the meta description for SEO' },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data.status !== 'available') return data

        // Effective state: this request's data merged over what's already persisted, so a
        // status-only PATCH against a record with fields already saved from an earlier edit
        // still sees them (see spec 002-vehicle-ja-en-pricing-fields FR-008).
        const effective = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>

        if (!effective.heroImage) {
          throw new Error('A hero image is required before a vehicle can be set to Available.')
        }

        const hasTitle = isTextPresent(effective.titleJa) || isTextPresent(effective.titleEn)
        const hasPrice =
          isNumberPresent(effective.priceJpy) ||
          isNumberPresent(effective.priceUsd) ||
          effective.priceOnRequest === true
        if (!hasTitle || !hasPrice) {
          throw new Error(
            'A title and a price (or "price on request") are required before a vehicle can be set to Available.',
          )
        }

        return data
      },
    ],
  },
  access: {
    // Public reads: only available/reserved/sold vehicles (never drafts)
    read: ({ req }) => {
      if (req.user) return true
      return {
        status: {
          in: ['available', 'reserved', 'sold'],
        },
      }
    },
  },
}
