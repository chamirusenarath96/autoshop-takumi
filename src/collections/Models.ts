import type { CollectionConfig } from 'payload'

export const Models: CollectionConfig = {
  slug: 'models',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'make',
      type: 'relationship',
      relationTo: 'makes',
      required: true,
    },
    {
      name: 'chassisCode',
      type: 'text',
      admin: {
        description: 'e.g. "JZA80" — optional, for JDM enthusiast buyers',
      },
    },
  ],
}
