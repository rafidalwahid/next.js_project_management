"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Save, X, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState({ name: "", color: "#6E56CF", description: "", isDefault: false })

  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    estimatedTime: "",
    initialStatuses: [] as Array<{ name: string; color: string; description?: string; isDefault: boolean }>
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string) => (date: Date | undefined) => {
    if (date) {
      setProjectData((prev) => ({ ...prev, [name]: date.toISOString() }))
    } else {
      // If date is cleared, set to null
      setProjectData((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleAddStatus = () => {
    if (!newStatus.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Status name is required",
        variant: "destructive",
      })
      return
    }

    // Check for duplicate status names
    if (projectData.initialStatuses.some(s => s.name.toLowerCase() === newStatus.name.toLowerCase())) {
      toast({
        title: "Validation Error",
        description: "A status with this name already exists",
        variant: "destructive",
      })
      return
    }

    // If this is the first status or isDefault is true, make sure only one status is default
    const updatedStatuses = [...projectData.initialStatuses]

    if (newStatus.isDefault) {
      // Remove default flag from other statuses
      updatedStatuses.forEach(status => {
        status.isDefault = false
      })
    } else if (updatedStatuses.length === 0) {
      // If this is the first status, make it default regardless
      newStatus.isDefault = true
    }

    // Add the new status
    updatedStatuses.push({ ...newStatus })

    setProjectData(prev => ({ ...prev, initialStatuses: updatedStatuses }))
    setNewStatus({ name: "", color: "#6E56CF", description: "", isDefault: false })
    setIsStatusDialogOpen(false)
  }

  const handleRemoveStatus = (index: number) => {
    const updatedStatuses = [...projectData.initialStatuses]
    const removedStatus = updatedStatuses.splice(index, 1)[0]

    // If the removed status was default and we have other statuses, make the first one default
    if (removedStatus.isDefault && updatedStatuses.length > 0) {
      updatedStatuses[0].isDefault = true
    }

    setProjectData(prev => ({ ...prev, initialStatuses: updatedStatuses }))
  }

  const handleSetDefaultStatus = (index: number) => {
    const updatedStatuses = [...projectData.initialStatuses]

    // Remove default flag from all statuses
    updatedStatuses.forEach((status, i) => {
      status.isDefault = i === index
    })

    setProjectData(prev => ({ ...prev, initialStatuses: updatedStatuses }))
  }

  const validateProject = () => {
    if (!projectData.title) {
      toast({
        title: "Validation Error",
        description: "Project title is required",
        variant: "destructive",
      });
      return false;
    }

    if (projectData.title.length < 3) {
      toast({
        title: "Validation Error",
        description: "Project title must be at least 3 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Validate before submission
      if (!validateProject()) {
        return
      }

      setIsSubmitting(true)

      // Format data for submission
      const dataToSubmit = {
        ...projectData,
        startDate: projectData.startDate || null,
        endDate: projectData.endDate || null,
        estimatedTime: projectData.estimatedTime && projectData.estimatedTime.trim() !== ""
          ? parseFloat(projectData.estimatedTime)
          : null
      }

      console.log("Submitting project data:", dataToSubmit);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Project creation error:", errorData)

        // Handle validation errors specifically
        if (response.status === 400 && errorData.details) {
          // Format validation errors for display
          const validationErrors = Object.entries(errorData.details)
            .map(([field, errors]: [string, any]) => {
              if (field === '_errors' && Array.isArray(errors)) {
                return errors.join(', ')
              }
              if (typeof errors === 'object' && errors._errors) {
                return `${field}: ${errors._errors.join(', ')}`
              }
              return null
            })
            .filter(Boolean)
            .join('\n')

          throw new Error(`Validation failed:\n${validationErrors || errorData.error}`)
        }

        throw new Error(errorData.error || "Failed to create project")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: "Project created successfully",
      })

      router.push(`/projects/${data.project.id}`)
    } catch (error) {
      let errorMessage = "Failed to create project"

      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Check if the error message contains multiple lines (validation errors)
      if (errorMessage.includes('\n')) {
        const lines = errorMessage.split('\n')
        const title = lines[0]
        const details = lines.slice(1).join('\n')

        toast({
          title: title,
          description: (
            <div className="mt-2 max-h-[200px] overflow-y-auto">
              {details.split('\n').map((line, i) => (
                <p key={i} className="text-sm">{line}</p>
              ))}
            </div>
          ),
          variant: "destructive",
          duration: 5000, // Show longer for validation errors
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
            <div className="flex items-center gap-2">
              <Link href="/projects">
                <Button variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Enter the basic details of the new project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Project Title (minimum 3 characters)</Label>
                  <Input
                    id="title"
                    name="title"
                    value={projectData.title}
                    onChange={handleInputChange}
                    placeholder="Enter project title"
                    minLength={3}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={projectData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the project and its objectives"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker onSelect={handleDateChange("startDate")} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <DatePicker onSelect={handleDateChange("endDate")} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
                    <Input
                      id="estimatedTime"
                      name="estimatedTime"
                      type="number"
                      min="0"
                      step="0.5"
                      value={projectData.estimatedTime}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Project Statuses</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsStatusDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Status
                    </Button>
                  </div>

                  {projectData.initialStatuses.length === 0 ? (
                    <div className="text-center py-4 border rounded-md bg-muted/30">
                      <p className="text-muted-foreground">
                        No statuses defined. Add statuses to organize your project tasks.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default statuses will be created if none are specified.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projectData.initialStatuses.map((status, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            <div>
                              <div className="font-medium flex items-center">
                                {status.name}
                                {status.isDefault && (
                                  <Badge className="ml-2" variant="outline">Default</Badge>
                                )}
                              </div>
                              {status.description && (
                                <div className="text-xs text-muted-foreground">{status.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!status.isDefault && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultStatus(index)}
                              >
                                Make Default
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStatus(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Project
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
      </div>

      {/* Add Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusName">Name</Label>
              <Input
                id="statusName"
                value={newStatus.name}
                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                placeholder="e.g., In Progress"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusColor">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="statusColor"
                  type="color"
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  placeholder="#6E56CF"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusDescription">Description (optional)</Label>
              <Textarea
                id="statusDescription"
                value={newStatus.description}
                onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                placeholder="Describe what this status represents"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newStatus.isDefault}
                onChange={(e) => setNewStatus({ ...newStatus, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault">Make this the default status for new tasks</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStatus} disabled={!newStatus.name.trim()}>Add Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
