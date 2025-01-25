"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"

const noteTypes = [
  "Thank You",
  "Birthday",
  "Interview Follow-up",
  "Condolence",
  "Congratulations",
  "Just Saying Hi",
  "Other",
]

const formSchema = z.object({
  noteType: z.string(),
  occasion: z.string(),
  recipient: z.string(),
  details: z.string().optional(),
  content: z.string(),
})

export function NoteForm() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      noteType: "",
      occasion: "",
      recipient: "",
      details: "",
      content: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsGenerating(true)
      const response = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = await response.json()
      form.setValue("content", data.content)
      toast({
        title: "Note Generated",
        description: "Your note has been generated successfully.",
      })
    } catch (error) {
      console.error("Failed to generate note:", error)
      toast({
        title: "Error",
        description: "Failed to generate note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function saveDraft() {
    try {
      setIsSaving(true)
      const values = form.getValues()
      const response = await fetch("/api/notes/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        toast({
          title: "Draft Saved",
          description: "Your note draft has been saved successfully.",
        })
      } else {
        throw new Error("Failed to save draft")
      }
    } catch (error) {
      console.error("Failed to save draft:", error)
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="noteType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select note type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {noteTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="occasion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occasion or Gift</FormLabel>
                <FormControl>
                  <Input placeholder="Describe the occasion or gift" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient</FormLabel>
                <FormControl>
                  <Input placeholder="Who is this note for?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional context or suggestions"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note Content</FormLabel>
                <FormControl>
                  <Textarea placeholder="Generated note will appear here" className="min-h-[200px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Note"}
            </Button>
            <Button type="button" variant="outline" onClick={saveDraft} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}

