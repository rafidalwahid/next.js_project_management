"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BarChart3, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { useProjects } from "@/hooks/use-data"
import { useUsers } from "@/hooks/use-users"
import { teamApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function NewTeamMemberPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { projects } = useProjects(1, 100)
  const { users } = useUsers()
  const { toast } = useToast()

  // Check if user has permission to add team members
  useEffect(() => {
    if (session?.user?.role !== "admin" && session?.user?.role !== "manager") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to add team members",
        variant: "destructive"
      })
      router.push("/team")
    }
  }, [session, router, toast])
  const [memberData, setMemberData] = useState({
    userId: "",
    projectId: "",
    role: "member",
  })

  const [createNewUser, setCreateNewUser] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMemberData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setMemberData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (createNewUser) {
        // First create the user
        if (!newUserData.name || !newUserData.email || !newUserData.password) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required fields for the new user",
            variant: "destructive",
          })
          return
        }

        // Create the user via API
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUserData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create user')
        }

        const userData = await response.json()

        // Now add the newly created user to the team
        await teamApi.addTeamMember({
          ...memberData,
          userId: userData.id,
        })

        toast({
          title: "Success",
          description: `User ${newUserData.name} created and added to the team`,
        })
      } else {
        // Just add existing user to team
        if (!memberData.userId || !memberData.projectId) {
          toast({
            title: "Validation Error",
            description: "Please select both a user and a project",
            variant: "destructive",
          })
          return
        }

        await teamApi.addTeamMember(memberData)
        toast({
          title: "Team member added",
          description: "Team member has been added successfully",
        })
      }

      router.push("/team")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Team Member</h1>
        <div className="flex items-center gap-2">
          <Link href="/team">
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
            <CardTitle>Member Information</CardTitle>
            <CardDescription>Enter the details of the new team member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={!createNewUser ? "default" : "outline"}
                    onClick={() => setCreateNewUser(false)}
                    className="w-full"
                  >
                    Existing User
                  </Button>
                  <Button
                    type="button"
                    variant={createNewUser ? "default" : "outline"}
                    onClick={() => setCreateNewUser(true)}
                    className="w-full"
                  >
                    Create New User
                  </Button>
                </div>
              </div>

              {!createNewUser ? (
                <div className="grid gap-2">
                  <Label htmlFor="userId">Select User</Label>
                  <Select name="userId" onValueChange={(value) => setMemberData(prev => ({ ...prev, userId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="text-sm font-medium">New User Information</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter user's name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter user's email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userRole">User Role</Label>
                    <Select
                      name="userRole"
                      defaultValue="user"
                      onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Regular User</SelectItem>
                        {session?.user?.role === "admin" && (
                          <>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="projectId">Project</Label>
              <Select name="projectId" onValueChange={(value) => setMemberData(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue="member" onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  {session?.user?.role === "admin" && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Member
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
