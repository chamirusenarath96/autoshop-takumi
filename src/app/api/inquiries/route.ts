import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = await getPayload()

    const inquiry = await payload.create({
      collection: 'inquiries',
      data: {
        vehicle: body.vehicle,
        name: body.name,
        email: body.email,
        phone: body.phone || undefined,
        message: body.message,
        locale: body.locale,
        status: 'new',
      },
      overrideAccess: false,
    })

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 })
  } catch (err: any) {
    console.error('Inquiry creation error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
