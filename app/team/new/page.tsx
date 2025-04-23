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
import { teamApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function NewTeamMemberPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { projects } = useProjects(1, 100)
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
    name: "",
    email: "",
    role: "",
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
      await teamApi.addTeamMember(memberData)
      toast({
        title: "Team member added",
        description: "New team member has been added successfully",
      })
      router.push("/team")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add team member",
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
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={memberData.name}
                onChange={handleInputChange}
                placeholder="Enter the member's name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={memberData.email}
                onChange={handleInputChange}
                placeholder="Enter the email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the role" />
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
