"use client"

import { useState, useRef } from "react"
import { Camera, CalendarClock, Mail, User, Shield, Clock } from "lucide-react"
import { UserProfile } from "@/hooks/use-user-profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface UserProfileHeaderNewProps {
  user: UserProfile
  canEdit: boolean
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>
  onUploadImage: (file: File) => Promise<string | null>
  stats?: {
    projectCount: number
    taskCount: number
    teamCount: number
    completionRate: string
  }
}

export function UserProfileHeaderNew({
  user,
  canEdit,
  onUpdateProfile,
  onUploadImage,
  stats = {
    projectCount: 0,
    taskCount: 0,
    teamCount: 0,
    completionRate: '0%'
  }
}: UserProfileHeaderNewProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getUserInitials = () => {
    if (!user.name) return "U"

    const nameParts = user.name.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }

    return nameParts[0].substring(0, 2).toUpperCase()
  }

  const handleImageClick = () => {
    if (canEdit && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await onUploadImage(file)
    } finally {
      setIsUploading(false)
      // Clear the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Format dates in a more readable way
  const formattedCreatedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Last login date (mock - would come from the user profile in a real app)
  const lastLoginDate = "4/20/2023";

  return (
    <div className="space-y-8">
      {/* Profile Summary Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="relative">
                <Avatar
                  className="h-24 w-24 cursor-pointer shadow-sm border border-border"
                  onClick={handleImageClick}
                >
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name || "User"} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {canEdit && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                      {isUploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="text-center md:text-left space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{user.name || "Admin User"}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="px-2 py-0.5">
                    {user.role === "admin" ? "Manager" : user.role}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-0.5">
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Middle Column - User Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Full Name</h3>
                <p className="font-medium">{user.name || "Admin User"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Role</h3>
                <p className="font-medium">{user.role === "admin" ? "Manager" : user.role}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Created On</h3>
                <p className="font-medium">1/1/2023</p>
              </div>
            </div>

            {/* Right Column - Contact Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Email Address</h3>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                <p className="font-medium">Active</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Login</h3>
                <p className="font-medium">{lastLoginDate}</p>
              </div>
            </div>
          </div>
          
          {/* User ID and Creation Date (small text) */}
          <div className="mt-8 text-xs text-muted-foreground">
            User ID: {user.id.substring(0, 4)}... • Created on {formattedCreatedDate}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold">{stats.projectCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold">{stats.taskCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold">{stats.teamCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Teams</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-bold">{stats.completionRate}</p>
              <p className="text-sm text-muted-foreground mt-2">Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 