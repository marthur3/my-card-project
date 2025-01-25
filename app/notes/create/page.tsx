import { NoteForm } from "@/components/notes/note-form"
import { ContactList } from "@/components/contacts/contact-list"
import { ExportList } from "@/components/notes/export-list"

export default function CreateNotePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Note Generator Pro</h1>
      <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <NoteForm />
          <ExportList />
        </div>
        <ContactList />
      </div>
    </div>
  )
}

