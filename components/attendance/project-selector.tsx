"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { DASHBOARD_DEFAULTS } from "@/lib/constants/attendance"

interface ProjectSelectorProps {
  value: string
  onChange: (value: string) => void
}

interface Project {
  id: string
  title: string
}

export default function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch projects only once on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        // Use a small limit since we just need active projects for filtering
        const response = await fetch('/api/projects?status=active&limit=100&fields=id,title')
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjects()
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-10">
        <Spinner />
      </div>
    )
  }
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="All projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All projects</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}