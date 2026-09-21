import type { CollectionConfig } from 'payload'
import { isNumberPresent, isTextPresent } from '@/lib/vehicle-locale'
import { generateUniqueSlug } from '@/lib/slug'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'make', 'year', 'status', 'priceJpy'],
  },
  fields: [
    {
      // Stored (not virtual — Payload's admin.useAsTitle only supports a virtual field when
      // it's linked to a relationship) computed display title, kept in sync by the beforeChange
      // hook below. Read-only — staff edit titleJa/titleEn instead.
      name: 'displayTitle',
      type: 'text',
      admin: { readOnly: true, description: 'Computed automatically from Title (Japanese)/(English) — not editable' },
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
      unique: true,
      admin: {
        description: 'Auto-generated from the English title when left blank; editable',
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
    },
    {
      name: 'model',
      type: 'relationship',
      relationTo: 'models',
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
      min: 1900,
      max: new Date().getFullYear() + 1,
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
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data

        // Presence-based effective slug: an explicit `slug: null` clears it and must
        // regenerate; a request that omits `slug` entirely must preserve the persisted value.
        const effectiveSlug = 'slug' in data ? data.slug : originalDoc?.slug
        if (isTextPresent(effectiveSlug)) return data

        const effectiveTitleEn = 'titleEn' in data ? data.titleEn : originalDoc?.titleEn
        if (!isTextPresent(effectiveTitleEn)) return data

        const existing = await req.payload.find({
          collection: 'vehicles',
          where: originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {},
          limit: 0,
          pagination: false,
          depth: 0,
        })
        const existingSlugs = existing.docs
          .map((doc) => (doc as { slug?: string | null }).slug)
          .filter((slug): slug is string => isTextPresent(slug))

        data.slug = generateUniqueSlug(effectiveTitleEn, existingSlugs)
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        // Effective state: this request's data merged over what's already persisted, so a
        // status-only PATCH against a record with fields already saved from an earlier edit
        // still sees them (see spec 002-vehicle-ja-en-pricing-fields FR-008).
        const effective = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>

        data.displayTitle = isTextPresent(effective.titleJa)
          ? effective.titleJa
          : isTextPresent(effective.titleEn)
            ? effective.titleEn
            : '(untitled)'

        if (effective.status !== 'available') return data

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

        const missingFields: string[] = []
        if (!effective.make) missingFields.push('make')
        if (!effective.model) missingFields.push('model')
        if (!isNumberPresent(effective.year)) missingFields.push('year')
        if (missingFields.length > 0) {
          throw new Error(
            `The following field(s) are required before a vehicle can be set to Available: ${missingFields.join(', ')}.`,
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
