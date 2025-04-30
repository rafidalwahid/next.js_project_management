"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { DASHBOARD_DEFAULTS } from "@/lib/constants/attendance"

interface EmployeeSelectorProps {
  value: string
  onChange: (value: string) => void
}

interface User {
  id: string
  name: string | null
  email: string
  department?: string | null
}

export default function EmployeeSelector({ value, onChange }: EmployeeSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch users only once on component mount
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/users?fields=id,name,email,department&limit=${DASHBOARD_DEFAULTS.PAGINATION_LIMIT}`,
          { signal }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        
        const data = await response.json()
        setUsers(data.users || [])
      } catch (error) {
        // Only log error if it's not an abort error
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching users:', error)
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()

    // Cleanup function to abort fetch if component unmounts
    return () => {
      controller.abort();
    };
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-10">
        <Spinner />
      </div>
    )
  }
  
  // Group users by department for better organization
  const usersByDepartment = users.reduce((acc: Record<string, User[]>, user) => {
    const department = user.department || 'Other'
    if (!acc[department]) {
      acc[department] = []
    }
    acc[department].push(user)
    return acc
  }, {})
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="Select an employee" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(usersByDepartment).map(([department, deptUsers]) => (
          <SelectGroup key={department}>
            <SelectLabel>{department}</SelectLabel>
            {deptUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}