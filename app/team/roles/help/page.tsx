"use client"

import Link from "next/link"
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert, Users, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/ui/role-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function RolesHelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/team/roles" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Role Management
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Understanding Roles</h1>
          <p className="text-muted-foreground">
            Learn about the different types of roles in the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role System Overview</CardTitle>
          <CardDescription>
            Our application uses two types of roles to manage permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="system" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">System Roles</TabsTrigger>
              <TabsTrigger value="project">Project Roles</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="prose max-w-none">
                  <h3>System Roles</h3>
                  <p>
                    System roles apply across the entire application and determine what features a user can access.
                    These roles are assigned at the user level and affect all interactions with the system.
                  </p>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="admin" type="system" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        System administrators with full access to all features and settings
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Manage all users and their roles</li>
                          <li>Access all projects and settings</li>
                          <li>Configure system-wide settings</li>
                          <li>Manage permissions and roles</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="manager" type="system" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        System managers with elevated access to manage users and projects
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Create and manage projects</li>
                          <li>Manage users (except admins)</li>
                          <li>View system reports</li>
                          <li>Limited system configuration</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="user" type="system" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        Regular users with standard access to projects they're assigned to
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Access assigned projects</li>
                          <li>Manage own profile</li>
                          <li>Create and manage tasks (based on project role)</li>
                          <li>View team members</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="project" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="prose max-w-none">
                  <h3>Project Roles</h3>
                  <p>
                    Project roles apply only to specific projects and determine what actions a user can perform within that project.
                    A user can have different roles in different projects.
                  </p>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="owner" type="project" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        Project creator with full control over the project
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Full control over project settings</li>
                          <li>Add/remove team members</li>
                          <li>Assign project roles</li>
                          <li>Delete the project</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="admin" type="project" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        Project administrator with management permissions
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Manage project settings</li>
                          <li>Add/remove team members</li>
                          <li>Assign project roles (except owner)</li>
                          <li>Manage all tasks</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="manager" type="project" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        Project manager with team management permissions
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Manage tasks and assignments</li>
                          <li>Add team members</li>
                          <li>Update project details</li>
                          <li>View project reports</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <RoleBadge role="member" type="project" showTooltip={false} />
                      </TableCell>
                      <TableCell>
                        Regular project team member
                      </TableCell>
                      <TableCell>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>View project details</li>
                          <li>Work on assigned tasks</li>
                          <li>Create and update own tasks</li>
                          <li>View team members</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How Roles Work Together</CardTitle>
          <CardDescription>
            Understanding the interaction between system and project roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h3>Role Hierarchy</h3>
            <p>
              System roles and project roles work together to determine a user's permissions:
            </p>
            
            <ul>
              <li>
                <strong>System roles</strong> determine what features a user can access across the entire application.
              </li>
              <li>
                <strong>Project roles</strong> determine what actions a user can perform within a specific project.
              </li>
            </ul>
            
            <h3>Examples</h3>
            
            <div className="bg-muted p-4 rounded-md my-4">
              <h4 className="text-lg font-medium mb-2">Example 1: System Admin</h4>
              <p>
                A user with the <RoleBadge role="admin" type="system" showTooltip={false} /> system role has access to all features
                and can manage all projects, even if they don't have a specific project role assigned.
              </p>
            </div>
            
            <div className="bg-muted p-4 rounded-md my-4">
              <h4 className="text-lg font-medium mb-2">Example 2: Project Owner</h4>
              <p>
                A user with the <RoleBadge role="user" type="system" showTooltip={false} /> system role and 
                <RoleBadge role="owner" type="project" showTooltip={false} className="ml-2" /> project role
                has full control over their project, but can't access system-wide settings or other projects.
              </p>
            </div>
            
            <div className="bg-muted p-4 rounded-md my-4">
              <h4 className="text-lg font-medium mb-2">Example 3: Multiple Project Roles</h4>
              <p>
                A user can have different roles in different projects. For example, they might be an
                <RoleBadge role="admin" type="project" showTooltip={false} className="mx-2" /> in one project
                but just a <RoleBadge role="member" type="project" showTooltip={false} /> in another.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
