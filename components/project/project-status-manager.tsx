"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { GripVertical, Plus, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProjectStatus {
  id: string
  name: string
  color: string
  description?: string | null
  order: number
  isDefault: boolean
  projectId: string
}

interface ProjectStatusManagerProps {
  projectId: string
  initialStatuses: ProjectStatus[]
}

function SortableStatusItem({ status, onEdit, onDelete }: { 
  status: ProjectStatus, 
  onEdit: (id: string, field: string, value: string) => void,
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md mb-2 bg-background"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: status.color }}
        />
        <Input 
          value={status.name} 
          onChange={(e) => onEdit(status.id, "name", e.target.value)}
          className="h-8"
        />
      </div>
      
      <Input 
        type="color" 
        value={status.color} 
        onChange={(e) => onEdit(status.id, "color", e.target.value)}
        className="w-12 h-8 p-1"
      />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-destructive"
        onClick={() => onDelete(status.id)}
        disabled={status.isDefault}
        title={status.isDefault ? "Cannot delete default status" : "Delete status"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ProjectStatusManager({ projectId, initialStatuses }: ProjectStatusManagerProps) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>(initialStatuses)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      setStatuses((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex).map((status, index) => ({
          ...status,
          order: index,
        }))
      })
      
      // Update the order on the server
      try {
        const response = await fetch(`/api/projects/${projectId}/statuses/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statusIds: statuses.map((status) => status.id),
          }),
        })
        
        if (!response.ok) {
          throw new Error("Failed to update status order")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update status order",
          variant: "destructive",
        })
      }
    }
  }
  
  const handleEditStatus = (id: string, field: string, value: string) => {
    setStatuses((prev) =>
      prev.map((status) =>
        status.id === id ? { ...status, [field]: value } : status
      )
    )
  }
  
  const handleDeleteStatus = async (id: string) => {
    // Check if this is a default status
    const statusToDelete = statuses.find((s) => s.id === id)
    if (statusToDelete?.isDefault) {
      toast({
        title: "Cannot delete default status",
        description: "Default statuses cannot be deleted",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/statuses/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete status")
      }
      
      setStatuses((prev) => prev.filter((status) => status.id !== id))
      
      toast({
        title: "Status deleted",
        description: "The status has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleAddStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/statuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Status",
          color: "#6E56CF", // Default color
          order: statuses.length,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create status")
      }
      
      const data = await response.json()
      setStatuses((prev) => [...prev, data.status])
      
      toast({
        title: "Status created",
        description: "New status has been created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true)
      
      // Update all statuses
      const promises = statuses.map((status) =>
        fetch(`/api/projects/${projectId}/statuses/${status.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: status.name,
            color: status.color,
            order: status.order,
          }),
        })
      )
      
      await Promise.all(promises)
      
      toast({
        title: "Changes saved",
        description: "Status changes have been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Project Statuses</h3>
          <p className="text-sm text-muted-foreground">
            Drag to reorder. Changes are saved automatically.
          </p>
        </div>
        <Button onClick={handleAddStatus} disabled={isLoading} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Status
        </Button>
      </div>
      
      <div className="space-y-1">
        {statuses.filter(s => s.isDefault).length > 0 && (
          <div className="flex items-center mb-2">
            <Badge variant="outline" className="text-xs">
              Default statuses cannot be deleted
            </Badge>
          </div>
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {statuses.map((status) => (
              <SortableStatusItem
                key={status.id}
                status={status}
                onEdit={handleEditStatus}
                onDelete={handleDeleteStatus}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
