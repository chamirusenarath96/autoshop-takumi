import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    // Image size variants generated on upload via Sharp
    imageSizes: [
      { name: 'thumbnail', width: 400, position: 'centre' },
      { name: 'card', width: 800, position: 'centre' },
      { name: 'detail', width: 1600, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  admin: {
    useAsTitle: 'filename',
  },
  fields: [
    {
      // Deprecated — superseded by altJa/altEn below. Kept (not localized) until
      // scripts/migrate-content-locale-fields.ts has run against production and every consumer
      // reads the paired fields instead; see specs/003-remove-payload-localization.
      name: 'alt',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use Alt Text (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'altJa',
          type: 'text',
          label: 'Alt Text (Japanese)',
          admin: { width: '50%' },
        },
        {
          name: 'altEn',
          type: 'text',
          label: 'Alt Text (English)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (req.user) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
}
