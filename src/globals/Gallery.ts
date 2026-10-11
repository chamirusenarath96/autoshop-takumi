import type { GlobalConfig } from 'payload'

// Photos of delivered cars for the public Gallery tab. Photos only — no model captions.
export const Gallery: GlobalConfig = {
  slug: 'gallery',
  admin: {
    group: 'Site Configuration',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'photos',
      type: 'array',
      label: 'Gallery photos',
      admin: {
        description:
          'Photos of cars we have delivered. Landscape 4:3, at least 1600×1200 px, JPEG/WebP under 1 MB. Drag to reorder — the first photos also appear on the landing page.',
      },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
  ],
}
