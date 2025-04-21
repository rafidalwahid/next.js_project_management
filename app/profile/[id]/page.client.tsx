"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/hooks/use-user-profile"
import { UserProfileView } from "@/components/profile/user-profile-view"
import type { UserProfile } from "@/hooks/use-user-profile"

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
    // Safe logging that won't throw even if isError is undefined
    if (isError) {
      console.error('Profile error:', isError);
    } else {
      console.error('Profile error: No profile data available');
    }

    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Error Loading Profile</h1>
        <p className="text-muted-foreground">
          There was an error loading this user profile. Please try again later.
        </p>
        <div className="text-sm text-red-500 max-w-md text-center mt-2">
          {isError && isError instanceof Error 
            ? isError.message 
            : 'Failed to load profile data'}
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
    <UserProfileView
      profile={profile}
      projects={projects}
      tasks={tasks}
      activities={activities}
      stats={stats}
      canEdit={canEdit}
      isOwnProfile={isOwnProfile}
      onUpdateProfile={updateProfile}
      onUploadImage={uploadProfileImage}
    />
  )
}
