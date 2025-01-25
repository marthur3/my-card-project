"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ExportList() {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  async function handleExport() {
    try {
      setIsExporting(true)
      const response = await fetch("/api/notes/export", {
        method: "POST",
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = "exported_notes.csv"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast({
          title: "Export Successful",
          description: "Your notes have been exported successfully.",
        })
      } else {
        throw new Error("Failed to export notes")
      }
    } catch (error) {
      console.error("Failed to export notes:", error)
      toast({
        title: "Error",
        description: "Failed to export notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? "Exporting..." : "Create Export List"}
        </Button>
      </CardContent>
    </Card>
  )
}

