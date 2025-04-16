"use client"

import { UserProfile } from "@/hooks/use-user-profile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface UserProfileOverviewProps {
  user: UserProfile
}

export function UserProfileOverview({ user }: UserProfileOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>User contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd className="text-sm capitalize">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
              <dd className="text-sm">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="text-sm">{formatDate(user.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Skills & Expertise</CardTitle>
          <CardDescription>User skills and areas of expertise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {/* This would be populated from user.skills once added to the schema */}
              <div className="rounded-md bg-secondary px-2 py-1 text-xs">Project Management</div>
              <div className="rounded-md bg-secondary px-2 py-1 text-xs">UI/UX Design</div>
              <div className="rounded-md bg-secondary px-2 py-1 text-xs">React</div>
              <div className="rounded-md bg-secondary px-2 py-1 text-xs">TypeScript</div>
              <div className="rounded-md bg-secondary px-2 py-1 text-xs">Next.js</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle>About</CardTitle>
          <CardDescription>User bio and information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user.bio || "No bio information available. This user hasn't added a description yet."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
