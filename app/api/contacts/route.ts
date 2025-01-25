import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        notes: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 1
        }
      }
    })
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const contact = await prisma.contact.create({
      data: {
        fullName: json.fullName,
        email: json.email,
      },
    })
    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
