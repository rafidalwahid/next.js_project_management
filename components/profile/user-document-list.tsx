"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { FileText, Download, Trash2, File } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { formatFileSize } from "@/lib/format-utils"

interface Document {
  id: string
  name: string
  description: string
  fileType: string
  fileSize: number
  filePath: string
  createdAt: string
}

interface UserDocumentListProps {
  userId: string
  canEdit: boolean
}

export function UserDocumentList({ userId, canEdit }: UserDocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/documents`)

      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [userId])

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/documents?documentId=${documentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      // Refresh the documents list
      fetchDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document. Please try again.")
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <File className="h-8 w-8 text-blue-500" />
    } else if (fileType.includes("pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="h-8 w-8 text-blue-700" />
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <FileText className="h-8 w-8 text-green-700" />
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/60 mb-4" />
          <h3 className="text-lg font-medium">No Documents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You haven't uploaded any documents yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                {getFileIcon(document.fileType)}
              </div>
              <div className="flex-grow min-w-0 w-full">
                <h3 className="font-medium text-base truncate">{document.name}</h3>
                {document.description && (
                  <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>Uploaded {formatDate(document.createdAt, "MMM d, yyyy")}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="flex-1 sm:flex-initial" asChild>
                  <a href={document.filePath} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </Button>
                {canEdit && (
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial" onClick={() => handleDelete(document.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
