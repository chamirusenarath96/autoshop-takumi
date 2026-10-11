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
  // Photos are public site content: without this, Payload's default (auth required) makes
  // /api/media/file/<name> return 403 to visitors wherever uploads are served by the app
  // itself (local dev, preview deployments without R2), leaving every image broken.
  access: {
    read: () => true,
  },
  fields: [
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
      // Public media reads must not expose which staff user uploaded a file.
      access: { read: ({ req }) => Boolean(req.user) },
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
