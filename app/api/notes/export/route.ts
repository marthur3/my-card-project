import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { stringify } from "csv-stringify/sync"

// const prisma = new PrismaClient()

export async function POST() {
  try {
    const notes = await prisma.note.findMany({
      include: {
        contact: true,
      },
      where: {
        status: "final",
      },
    })

    const csvData = notes.map((note) => ({
      Recipient: note.contact.fullName,
      Address: note.contact.address || "",
      City: note.contact.city || "",
      State: note.contact.state || "",
      "Zip Code": note.contact.zipCode || "",
      "Note Type": note.noteType,
      Occasion: note.occasion || "",
      Note: note.content,
    }))

    const csv = stringify(csvData, { header: true })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=exported_notes.csv",
      },
    })
  } catch (error) {
    console.error("Failed to export notes:", error)
    return NextResponse.json({ success: false, error: "Failed to export notes" }, { status: 500 })
  }
}

