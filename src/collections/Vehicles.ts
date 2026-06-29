import type { CollectionConfig } from 'payload'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'make', 'year', 'status', 'price'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'e.g. "1999 Toyota Supra RZ"' },
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
      name: 'currency',
      type: 'select',
      defaultValue: 'JPY',
      options: [
        { label: 'JPY (¥)', value: 'JPY' },
        { label: 'USD ($)', value: 'USD' },
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
      admin: { description: 'Short overview shown near the top of the detail page' },
    },
    {
      name: 'highlights',
      type: 'array',
      label: 'Highlights (bullet points)',
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: 'Long Description',
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
          required: true,
          localized: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
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
      admin: { description: 'Override the page <title> for SEO' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      localized: true,
      admin: { description: 'Override the meta description for SEO' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Block publishing without a hero image
        if (data.status === 'available' && !data.heroImage) {
          throw new Error('A hero image is required before a vehicle can be set to Available.')
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
