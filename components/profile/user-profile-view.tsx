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
import { UserAttendanceSummary } from "@/components/profile/user-attendance-summary"
import { UserDocumentList } from "@/components/profile/user-document-list"
import { UserProfileProjects } from "@/components/profile/user-profile-projects"
import { UserProfileTasks } from "@/components/profile/user-profile-tasks"

interface UserProfileViewProps {
  profile: UserProfile
  projects: any[]
  tasks: any[]
  activities: any[]
  teamMemberships?: any[]
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
  teamMemberships = [],
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
  const formattedCreatedDate = formatDate(profile.createdAt, "MMM d, yyyy");

  // Format last login date if available
  const lastLoginDate = formatDate(profile.lastLogin);

  // Handle document upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection for documents
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const file = files[0];
        console.log("File selected:", file.name);

        // Create form data
        const formData = new FormData();
        formData.append("file", file);

        // Upload the file
        const response = await fetch(`/api/users/${profile.id}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload document");
        }

        // Refresh the documents list
        setActiveTab("documents");

        // Show success message
        alert("Document uploaded successfully!");

        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error uploading document:", error);
        alert("Failed to upload document. Please try again.");

        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isOwnProfile ? 'My Profile' : `${profile.name || 'User'}'s Profile`}
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {canEdit && (
          <Button variant="default" onClick={handleEditProfileClick} className="w-full sm:w-auto">
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap">
          <TabsTrigger value="overview" className="flex-1 min-w-[100px]">Overview</TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 min-w-[100px]">Attendance</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 min-w-[100px]">Documents</TabsTrigger>
          <TabsTrigger value="projects" className="flex-1 min-w-[100px]">Projects</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 min-w-[100px]">Tasks</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 min-w-[100px]">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-6">
          <div className="grid gap-6 md:grid-cols-1">
            <UserAttendanceSummary userId={profile.id} />
          </div>
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            {/* Profile card */}
            <Card className="lg:col-span-2">
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

            {/* Right column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Status cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          {profile.lastLogin
                            ? formatDate(profile.lastLogin)
                            : <span className="text-sm font-normal text-muted-foreground">Not tracked</span>}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User information */}
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Detailed information about the user account.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
                      <p>{profile.name || "Admin User"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
                      <p className="break-words">{profile.email}</p>
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
                        {profile.lastLogin
                          ? formatDate(profile.lastLogin)
                          : <span className="text-sm text-muted-foreground">Not tracked</span>}
                      </p>
                    </div>
                  </div>

                  {/* Project Roles Section */}
                  <div className="mt-6 pt-6 border-t">
                    <UserProjectRoles userId={profile.id} teamMemberships={teamMemberships} />
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Documents</CardTitle>
              {canEdit && (
                <>
                  <Button onClick={handleUploadClick} size="sm" className="w-full sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif"
                  />
                </>
              )}
            </CardHeader>
            <CardContent>
              <UserDocumentList userId={profile.id} canEdit={canEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          {console.log('Projects data in UserProfileView:', projects)}
          <UserProfileProjects projects={projects} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          {console.log('Tasks data in UserProfileView:', tasks)}
          <UserProfileTasks tasks={tasks} />
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
                <div className="space-y-6">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0">
                      <div className="rounded-full bg-slate-100 p-2 mt-0.5 flex-shrink-0">
                        <CalendarClock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1 break-words">{activity.description}</p>
                        )}
                        {activity.project && (
                          <Badge variant="outline" className="mt-2">
                            {activity.project.title}
                          </Badge>
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