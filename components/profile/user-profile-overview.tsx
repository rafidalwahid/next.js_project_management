"use client"

import { UserProfile } from "@/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Mail, User, Calendar, MapPin, Phone, Briefcase } from "lucide-react"

interface UserProfileOverviewProps {
  user: UserProfile
}

export function UserProfileOverview({ user }: UserProfileOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-7">
      {/* Left Column - About Section (Spans 3 columns) */}
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>User bio and information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {user.bio || "No bio information available. This user hasn't added a description yet."}
          </p>
        </CardContent>
      </Card>

      {/* Right Column - Contact Information (Spans 2 columns) */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>User contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <User className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Member Since</p>
                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section (Full Width) */}
      <Card className="md:col-span-7">
        <CardHeader>
          <CardTitle>Skills & Expertise</CardTitle>
          <CardDescription>User skills and areas of expertise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* This would be populated from user.skills once added to the schema */}
            <Badge variant="secondary">Project Management</Badge>
            <Badge variant="secondary">UI/UX Design</Badge>
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Next.js</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
