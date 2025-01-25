"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PlusCircle } from "lucide-react"

type Contact = {
  id: string
  fullName: string
  lastEvent?: string
  lastLetter?: Date
}

// This would typically come from your database
const mockContacts: Contact[] = [
  {
    id: "1",
    fullName: "Joe John",
    lastEvent: "Thank You",
    lastLetter: new Date("2024-01-20"),
  },
  {
    id: "2",
    fullName: "Mikey",
    lastEvent: "Other",
    lastLetter: new Date("2024-01-20"),
  },
]

export function ContactList() {
  const [contacts] = useState<Contact[]>(mockContacts)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">Contacts</CardTitle>
        <Button variant="ghost" size="icon">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between space-x-4 rounded-md border p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {contact.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{contact.fullName}</p>
                    {contact.lastEvent && <p className="text-sm text-muted-foreground">Last: {contact.lastEvent}</p>}
                  </div>
                </div>
                {contact.lastLetter && (
                  <p className="text-xs text-muted-foreground">{contact.lastLetter.toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

