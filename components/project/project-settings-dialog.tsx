"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectStatusManager } from "@/components/project/project-status-manager"

interface ProjectSettingsDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  project: {
    id: string
    title: string
    description: string | null
    startDate: string | null
    endDate: string | null
    dueDate: string | null
    estimatedTime: number | null
  }
  statuses: {
    id: string
    name: string
    color: string
    description?: string | null
    order: number
    isDefault: boolean
    projectId: string
  }[]
}

export function ProjectSettingsDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  project,
  statuses
}: ProjectSettingsDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || "",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
    endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
    dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split("T")[0] : "",
    estimatedTime: project.estimatedTime || 0,
  })

  // Update form data when project changes
  useEffect(() => {
    setFormData({
      title: project.title,
      description: project.description || "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split("T")[0] : "",
      estimatedTime: project.estimatedTime || 0,
    })
  }, [project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          dueDate: formData.dueDate || null,
          estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update project")
      }

      toast({
        title: "Project updated",
        description: "Project settings have been updated successfully",
      })

      if (onSuccess) {
        onSuccess()
      }
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Update your project details and manage statuses
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="statuses">Statuses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="flex">
                    <div className="bg-muted p-2 rounded-l-md flex items-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="flex">
                    <div className="bg-muted p-2 rounded-l-md flex items-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <div className="flex">
                    <div className="bg-muted p-2 rounded-l-md flex items-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Hours</Label>
                  <div className="flex">
                    <div className="bg-muted p-2 rounded-l-md flex items-center">
                      <Clock className="h-4 w-4" />
                    </div>
                    <Input
                      id="estimatedTime"
                      name="estimatedTime"
                      type="number"
                      min="0"
                      value={formData.estimatedTime}
                      onChange={handleChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="statuses" className="mt-4">
            <ProjectStatusManager projectId={projectId} initialStatuses={statuses} />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="project-form" 
            disabled={isLoading || activeTab !== "general"}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
