import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { noteType, occasion, recipient, details, content } = await req.json()

    const note = await prisma.note.create({
      data: {
        noteType,
        occasion,
        details,
        content,
        status: "draft",
        contact: {
          connectOrCreate: {
            where: { fullName: recipient },
            create: { fullName: recipient },
          },
        },
      },
    })

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error("Failed to save draft:", error)
    return NextResponse.json({ success: false, error: "Failed to save draft" }, { status: 500 })
  }
}

