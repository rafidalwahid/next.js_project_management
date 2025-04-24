"use client"

import { useState, useRef } from "react"
import { Pencil, Shield, Clock, Calendar, FileText, Upload, User, CalendarClock, X, File, Clock4, Save, Camera, Phone, MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/utils"
import type { UserProfile } from "@/hooks/use-user-profile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RoleBadge } from "@/components/ui/role-badge"
import { UserProjectRoles } from "@/components/profile/user-project-roles"

interface UserProfileViewProps {
  profile: UserProfile
  projects: any[]
  tasks: any[]
  activities: any[]
  stats: {
    projectCount: number
    taskCount: number
    teamCount: number
    completionRate: string
  }
  canEdit: boolean
  isOwnProfile: boolean
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>
  onUploadImage: (file: File) => Promise<string | null>
}

export function UserProfileView({
  profile,
  projects,
  tasks,
  activities,
  stats,
  canEdit,
  isOwnProfile,
  onUpdateProfile,
  onUploadImage
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    jobTitle: profile.jobTitle || "",
    location: profile.location || "",
    phone: profile.phone || "",
    department: profile.department || ""
  })

  const getUserInitials = () => {
    if (!profile.name) return "U"

    const nameParts = profile.name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return nameParts[0].substring(0, 2).toUpperCase()
  }

  // Format dates in a more readable way
  const formattedCreatedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  // Format last login date if available
  const lastLoginDate = profile.lastLogin
    ? new Date(profile.lastLogin).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not available';

  // Handle document upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // In a real app, you would upload the file to your server here
      console.log("File selected:", files[0].name);

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle profile edit dialog open
  const handleEditProfileClick = () => {
    // Reset form data to current profile values
    setProfileData({
      name: profile.name || "",
      bio: profile.bio || "",
      jobTitle: profile.jobTitle || "",
      location: profile.location || "",
      phone: profile.phone || "",
      department: profile.department || ""
    });
    setEditDialogOpen(true);
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      await onUpdateProfile(profileData);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jobTitle" className="text-right">
                Job Title
              </Label>
              <Input
                id="jobTitle"
                value={profileData.jobTitle}
                onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleProfileUpdate}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isOwnProfile ? 'My Profile' : `${profile.name || 'User'}'s Profile`}
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {canEdit && (
          <Button variant="default" onClick={handleEditProfileClick}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-7">
            {/* Profile card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 mb-4">
                      {profile.image ? (
                        <AvatarImage src={profile.image} alt={profile.name || "User"} />
                      ) : (
                        <AvatarFallback className="text-lg font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {canEdit && (
                      <div className="absolute bottom-4 right-0 bg-primary text-white rounded-full p-1 cursor-pointer"
                           onClick={() => fileInputRef.current?.click()}>
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                await onUploadImage(file);
                                // Clear the input value so the same file can be selected again
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              } catch (error) {
                                console.error('Error uploading image:', error);
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{profile.name || "Admin User"}</h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>

                <div className="flex flex-col gap-3 text-sm border-t pt-4">
                  {profile.bio && (
                    <div className="mb-2">
                      <p className="text-muted-foreground italic">"{profile.bio}"</p>
                    </div>
                  )}
                  {profile.jobTitle && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">{profile.jobTitle}</p>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{profile.department}</p>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{profile.phone}</p>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-muted-foreground">{profile.location}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status cards */}
            <div className="md:col-span-5 grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">System Role</p>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={profile.role} type="system" showTooltip={true} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xl font-bold h-8">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xl font-bold">
                        {lastLoginDate === 'Not available'
                          ? <span className="text-sm font-normal text-muted-foreground">Not tracked</span>
                          : lastLoginDate}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User information */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Detailed information about the user account.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
                      <p>{profile.name || "Admin User"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
                      <p>{profile.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">System Role</h3>
                      <div className="mt-1">
                        <RoleBadge role={profile.role} type="system" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                      <p>Active</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Created On</h3>
                      <p>{formattedCreatedDate}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Login</h3>
                      <p>
                        {lastLoginDate === 'Not available'
                          ? <span className="text-sm text-muted-foreground">Not tracked in this application</span>
                          : lastLoginDate}
                      </p>
                    </div>
                  </div>

                  {/* Project Roles Section */}
                  <div className="mt-6 pt-6 border-t">
                    <UserProjectRoles userId={profile.id} />
                  </div>

                  {/* Account Actions */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium mb-4">Account Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" size="sm">Change Password</Button>
                      <Button variant="outline" size="sm">Update Email</Button>
                      <Button variant="outline" size="sm">Two-Factor Authentication</Button>
                    </div>
                  </div>

                  {/* User ID and Creation Date (small text) */}
                  <div className="mt-6 text-xs text-muted-foreground">
                    User ID: {profile.id} • Created on {formattedCreatedDate}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button onClick={handleUploadClick} size="sm" className="ml-auto">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </CardHeader>
            <CardContent>
              {/* Check if real documents exist - no documents property yet, so show empty state */}
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/60 mb-4" />
                <h3 className="text-lg font-medium">No Documents</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven't uploaded any documents yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Check if real projects exist */}
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <File className="h-10 w-10 text-muted-foreground/60 mb-4" />
                  <h3 className="text-lg font-medium">No Projects</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You haven't been assigned to any projects yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project.id} className="rounded-lg border p-4">
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">Project ID: {project.id}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Check if real tasks exist */}
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <CalendarClock className="h-10 w-10 text-muted-foreground/60 mb-4" />
                  <h3 className="text-lg font-medium">No Tasks</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have any assigned tasks at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map(task => (
                    <div key={task.id} className="rounded-lg border p-4">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">Priority: {task.priority}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <CalendarClock className="h-10 w-10 text-muted-foreground/60 mb-4" />
                  <h3 className="text-lg font-medium">No Activity</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There is no recent activity to display.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 mb-6">
                      <div className="rounded-full bg-slate-100 p-2 mt-0.5">
                        <CalendarClock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}