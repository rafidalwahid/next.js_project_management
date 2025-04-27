"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Spinner } from "@/components/ui/spinner"
import { UserProfileView } from "@/components/profile/user-profile-view"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useToast } from "@/hooks/use-toast"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const userId = params.userId as string
  
  // Check if this is the current user's profile
  const isOwnProfile = session?.user?.id === userId
  
  // Determine if the current user can edit this profile
  const canEdit = isOwnProfile || session?.user?.role === "admin"
  
  // Use the user profile hook to fetch profile data
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
  } = useUserProfile(userId)
  
  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load user profile. The user may not exist.",
        variant: "destructive",
      })
      router.push("/team")
    }
  }, [isError, router, toast])
  
  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  
  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }
  
  // If profile data is not available, show error
  if (!profile) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">The requested user profile does not exist.</p>
        <button 
          onClick={() => router.push("/team")}
          className="text-primary hover:underline"
        >
          Go back to team
        </button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
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
    </div>
  )
}
