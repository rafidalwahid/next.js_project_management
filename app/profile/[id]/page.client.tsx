"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfileHeader } from "@/components/profile/user-profile-header"
import { UserProfileOverview } from "@/components/profile/user-profile-overview"
import { UserProfileProjects } from "@/components/profile/user-profile-projects"
import { UserProfileTasks } from "@/components/profile/user-profile-tasks"
import { UserProfileActivity } from "@/components/profile/user-profile-activity"
import { UserProfileSettings } from "@/components/profile/user-profile-settings"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Spinner } from "@/components/ui/spinner"
import { UserProfile } from "@/hooks/use-user-profile"

interface UserProfileClientProps {
  userId: string;
  initialUser: UserProfile;
}

export default function UserProfileClient({ userId, initialUser }: UserProfileClientProps) {
  const { data: session } = useSession()
  
  const {
    profile,
    projects,
    tasks,
    activities,
    stats,
    isLoading,
    isError,
    updateProfile,
    uploadProfileImage
  } = useUserProfile(userId, initialUser)

  const [activeTab, setActiveTab] = useState("overview")
  // Make sure we have a valid session with user ID
  const sessionUserId = session?.user?.id
  const isOwnProfile = sessionUserId === userId
  const isAdmin = session?.user?.role === "admin"
  const canEdit = isOwnProfile || isAdmin

  // Log session info for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Client: Session user ID:', sessionUserId)
      console.log('Client: Requested profile ID:', userId)
      console.log('Client: Is own profile:', isOwnProfile)
      console.log('Client: Is admin:', isAdmin)
      console.log('Client: Can edit:', canEdit)
    }
  }, [sessionUserId, userId, isOwnProfile, isAdmin, canEdit])

  // If the profile is loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // If there was an error loading the profile, show an error message
  if (isError || !profile) {
    console.error('Profile error:', isError);
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error Loading Profile</h1>
        <p className="text-muted-foreground">
          There was an error loading this user profile. Please try again later.
        </p>
        <div className="text-sm text-red-500 max-w-md text-center mt-2">
          {isError instanceof Error ? isError.message : 'Unknown error occurred'}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{isOwnProfile ? 'My Profile' : `${profile.name || 'User'}'s Profile`}</h1>
      </div>

      {/* Profile Header with User Info and Stats */}
      <UserProfileHeader
        user={profile}
        canEdit={canEdit}
        onUpdateProfile={updateProfile}
        onUploadImage={uploadProfileImage}
        stats={stats}
      />

      {/* Tabs for Different Profile Sections */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-3">
            <TabsList className="bg-transparent h-14">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Overview</TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-background rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Projects</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-background rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Tasks</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-background rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Activity</TabsTrigger>
              {canEdit && <TabsTrigger value="settings" className="data-[state=active]:bg-background rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Settings</TabsTrigger>}
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="mt-0">
              <UserProfileOverview user={profile} />
            </TabsContent>

            <TabsContent value="projects" className="mt-0">
              <UserProfileProjects projects={projects} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <UserProfileTasks tasks={tasks} />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <UserProfileActivity activities={activities} />
            </TabsContent>

            {canEdit && (
              <TabsContent value="settings" className="mt-0">
                <UserProfileSettings
                  user={profile}
                  onUpdateProfile={updateProfile}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
