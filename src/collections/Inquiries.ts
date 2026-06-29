import type { CollectionConfig } from 'payload'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'vehicle', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'vehicle',
      type: 'relationship',
      relationTo: 'vehicles',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      name: 'locale',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Language the visitor was browsing in',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation !== 'create') return

        const resendApiKey = process.env.RESEND_API_KEY
        const notifyTo = process.env.NOTIFY_EMAIL_TO
        const notifyFrom = process.env.NOTIFY_EMAIL_FROM

        if (!resendApiKey || !notifyTo || !notifyFrom) return

        try {
          const { Resend } = await import('resend')
          const resend = new Resend(resendApiKey)
          await resend.emails.send({
            from: notifyFrom,
            to: notifyTo,
            subject: `New inquiry from ${doc.name}`,
            text: `New vehicle inquiry\n\nName: ${doc.name}\nEmail: ${doc.email}\nPhone: ${doc.phone || 'N/A'}\n\nMessage:\n${doc.message}\n\nView in admin: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/collections/inquiries/${doc.id}`,
          })
        } catch (err) {
          console.error('Failed to send inquiry notification email:', err)
        }
      },
    ],
  },
  access: {
    // Public can create (submit form) but not read or list
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
