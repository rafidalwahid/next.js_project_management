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
import { RoleBadge } from "@/components/ui/role-badge.simplified"

interface UserProfileViewProps {
  profile: UserProfile
  stats: {
    projectCount: number
    taskCount: number
    completionRate: number
  }
  isCurrentUser: boolean
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>
  onUpdateImage: (file: File) => Promise<void>
}

export function UserProfileView({
  profile,
  stats,
  isCurrentUser,
  onUpdateProfile,
  onUpdateImage
}: UserProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    jobTitle: profile.jobTitle || "",
    department: profile.department || "",
    location: profile.location || "",
    phone: profile.phone || "",
    skills: profile.skills || ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        jobTitle: profile.jobTitle || "",
        department: profile.department || "",
        location: profile.location || "",
        phone: profile.phone || "",
        skills: profile.skills || ""
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSaveProfile = async () => {
    try {
      await onUpdateProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }

  const handleImageClick = () => {
    if (isCurrentUser) {
      setIsImageDialogOpen(true)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      await onUpdateImage(file)
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploading(false)
      setIsImageDialogOpen(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Format dates
  const formattedCreatedDate = profile.createdAt 
    ? formatDate(new Date(profile.createdAt))
    : "Not available"
  
  const lastLoginDate = profile.lastLogin
    ? formatDate(new Date(profile.lastLogin))
    : "Not available"

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-lg border bg-card text-card-foreground shadow">
        <div className="md:flex">
          {/* Avatar Section */}
          <div className="relative flex flex-col items-center p-6 md:w-1/3">
            <div 
              className={`relative h-32 w-32 cursor-${isCurrentUser ? 'pointer' : 'default'}`}
              onClick={handleImageClick}
            >
              <Avatar className="h-32 w-32 border-2 border-black/10">
                {profile.image ? (
                  <AvatarImage src={profile.image} alt={profile.name || "User"} />
                ) : null}
                <AvatarFallback className="text-4xl">
                  {getUserInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              {isCurrentUser && (
                <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
                  <Camera className="h-4 w-4" />
                </div>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-bold">{profile.name || "Unnamed User"}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            
            {profile.jobTitle && (
              <p className="mt-1 text-sm font-medium">{profile.jobTitle}</p>
            )}
            
            <div className="mt-4 flex items-center gap-2">
              <RoleBadge role={profile.role} />
            </div>
            
            {isCurrentUser && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={handleEditToggle}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            )}
            
            {isEditing && (
              <Button 
                variant="default" 
                size="sm" 
                className="mt-2"
                onClick={handleSaveProfile}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            )}
          </div>
          
          {/* Stats Section */}
          <div className="flex flex-col border-t p-6 md:w-2/3 md:border-l md:border-t-0">
            <h3 className="text-xl font-semibold">Overview</h3>
            
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={profile.role} showTooltip={true} />
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
                    <p className="text-sm text-muted-foreground">Projects</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">{stats.projectCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Tasks Completed</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.taskCount}</p>
                    <p className="text-xs text-muted-foreground">Total tasks</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Completion Rate</h4>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{stats.completionRate}%</p>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
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
                      <RoleBadge role={profile.role} />
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
              </CardContent>
            </Card>
            
            {/* Contact Information */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">No phone number</span>
                  </div>
                )}
                
                {profile.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">No location</span>
                  </div>
                )}
                
                {profile.department ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.department}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm">No department</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Enter your bio"
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm">
                    {profile.bio || (
                      <span className="text-muted-foreground">No bio available</span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="Enter your skills (e.g. Project Management, UI/UX, Development)"
                    className="min-h-[100px]"
                  />
                ) : (
                  <div>
                    {profile.skills ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.split(',').map((skill, index) => (
                          <Badge key={index} variant="secondary" className="px-2 py-1">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills listed</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>
                Projects the user is involved in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Project list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Tasks assigned to the user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Task list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>
                Recent user activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity log will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Image Upload Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new profile picture. The image will be resized to fit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-2 border-black/10">
                {profile.image ? (
                  <AvatarImage src={profile.image} alt={profile.name || "User"} />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {getUserInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Spinner className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
