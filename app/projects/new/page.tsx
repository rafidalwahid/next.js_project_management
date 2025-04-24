"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Save, X, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreateStatusModal } from "@/components/projects/create-status-modal"
import { projectApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useProjectStatuses } from "@/hooks/use-project-statuses"

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { statuses, mutate: mutateStatuses } = useProjectStatuses()
  const [createStatusModalOpen, setCreateStatusModalOpen] = useState(false)
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    statusId: "", // Primary status
    statusIds: [] as string[], // Multiple statuses
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    if (name === 'statusId' && value === 'create-new') {
      setCreateStatusModalOpen(true)
      return
    }
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusCreated = useCallback((newStatus: any) => {
    console.log("New status created:", newStatus)
    // Update the statuses list
    mutateStatuses()
    // Set the new status as the selected one
    if (newStatus && newStatus.id) {
      console.log("Setting status ID to:", newStatus.id)
      setProjectData(prev => ({ ...prev, statusId: newStatus.id }))
    }
  }, [mutateStatuses])

  const handleDateChange = (name: string) => (date: Date | undefined) => {
    console.log(`Date change for ${name}:`, date);
    if (date) {
      setProjectData((prev) => ({ ...prev, [name]: date.toISOString() }))
    } else {
      // If date is cleared, set to null
      setProjectData((prev) => ({ ...prev, [name]: null }))
    }
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
    e.preventDefault();

    try {
      // Validate before submission
      if (!validateProject()) {
        return;
      }

      // Format dates properly
      const dataToSubmit = {
        ...projectData,
        startDate: projectData.startDate || null,
        endDate: projectData.endDate || null
      };

      console.log('Formatted data for API:', dataToSubmit);

      const response = await projectApi.createProject(dataToSubmit);

      if (response.project) {
        toast({
          title: "Success",
          description: "Project created successfully",
        });
        router.push("/projects");
      }
    } catch (error) {
      let errorMessage = "Failed to create project";

      if (error instanceof Error) {
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.details?.title?._errors) {
            errorMessage = parsedError.details.title._errors[0];
          } else {
            errorMessage = parsedError.message || errorMessage;
          }
        } catch {
          errorMessage = error.message || errorMessage;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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
              <CardContent className="space-y-4">
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
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker onSelect={handleDateChange("startDate")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <DatePicker onSelect={handleDateChange("endDate")} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="statusId">Primary Status</Label>
                    <Select onValueChange={handleSelectChange("statusId")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color || '#888888' }}
                              />
                              {status.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="create-new" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-3.5 w-3.5" />
                            Create New Status
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="statusIds">Additional Statuses (Optional)</Label>
                    <MultiSelect
                      options={statuses
                        .filter(status => status.id !== projectData.statusId)
                        .map(status => ({
                          value: status.id,
                          label: status.name,
                          color: status.color
                        }))}
                      selected={projectData.statusIds}
                      onChange={(selectedValues) => {
                        setProjectData(prev => ({ ...prev, statusIds: selectedValues }))
                      }}
                      placeholder="Select additional statuses"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      A project can have multiple statuses. Select one or more additional statuses.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Project
                </Button>
              </CardFooter>
            </form>
          </Card>
      </div>

      {/* Create Status Modal */}
      <CreateStatusModal
        open={createStatusModalOpen}
        onOpenChange={setCreateStatusModalOpen}
        onStatusCreated={handleStatusCreated}
      />
    </DashboardLayout>
  )
}
