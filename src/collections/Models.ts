import type { CollectionConfig } from 'payload'
import { isTextPresent } from '@/lib/content-locale'

export const Models: CollectionConfig = {
  slug: 'models',
  admin: {
    // Computed by the beforeChange hook below from nameJa/nameEn — 'name' itself is deprecated
    // and no longer populated by the admin form, so it can't drive the list-view title anymore.
    useAsTitle: 'displayName',
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: { readOnly: true, description: 'Computed automatically from Name (Japanese)/(English) — not editable' },
    },
    {
      // Deprecated — superseded by nameJa/nameEn below. Kept (not required, not localized)
      // until scripts/migrate-content-locale-fields.ts has run against production and every
      // consumer reads the paired fields instead; see specs/003-remove-payload-localization.
      name: 'name',
      type: 'text',
      localized: true,
      admin: { readOnly: true, description: 'Deprecated — use Name (Japanese)/(English) below' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nameJa',
          type: 'text',
          label: 'Name (Japanese)',
          admin: { width: '50%' },
          validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
            if (isTextPresent(value) || isTextPresent(siblingData?.nameEn)) return true
            return 'At least one of Name (Japanese) or Name (English) is required.'
          },
        },
        {
          name: 'nameEn',
          type: 'text',
          label: 'Name (English)',
          admin: { width: '50%' },
        },
      ],
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
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const effective = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
        data.displayName = isTextPresent(effective.nameJa)
          ? effective.nameJa
          : isTextPresent(effective.nameEn)
            ? effective.nameEn
            : '(untitled)'
        return data
      },
    ],
  },
}
