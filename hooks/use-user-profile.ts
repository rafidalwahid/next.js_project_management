import useSWR from 'swr';
import { useState } from 'react';
import { userApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  bio?: string | null;
  jobTitle?: string | null;
  // Additional profile fields would be added here
};

export type UserProfileData = {
  user: UserProfile;
  projects: Array<{
    id: string;
    title: string;
    statusId: string;
    status: {
      id: string;
      name: string;
      color: string;
      description?: string | null;
      isDefault: boolean;
    };
    startDate: string | null;
    endDate: string | null;
    role: string;
    joinedAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: {
      id: string;
      title: string;
    };
  }>;
  activities: Array<{
    id: string;
    action: string;
    entityType: string;
    description: string | null;
    createdAt: string;
    project: {
      id: string;
      title: string;
    } | null;
    task: {
      id: string;
      title: string;
    } | null;
  }>;
  stats: {
    projectCount: number;
    taskCount: number;
    teamCount: number;
    completionRate: string;
  };
};

export function useUserProfile(userId: string, initialUser?: UserProfile) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR<UserProfileData>(
    userId ? `/api/users/${userId}` : null,
    async () => {
      try {
        const response = await userApi.getUserProfile(userId);
        return response as UserProfileData;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      errorRetryCount: 2,
      fallbackData: initialUser ? {
        user: initialUser,
        projects: [],
        tasks: [],
        activities: [],
        stats: {
          projectCount: 0,
          taskCount: 0,
          teamCount: 0,
          completionRate: '0%'
        }
      } : undefined
    }
  );

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      await userApi.updateUserProfile(userId, profileData);
      await mutate();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfileImage = async (file: File) => {
    if (!userId) return null;

    setIsUpdating(true);
    try {
      const response = await userApi.uploadProfileImage(file);
      if (response.url) {
        await updateProfile({ image: response.url });
        return response.url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile: data?.user,
    projects: data?.projects || [],
    tasks: data?.tasks || [],
    activities: data?.activities || [],
    stats: data?.stats || {
      projectCount: 0,
      taskCount: 0,
      teamCount: 0,
      completionRate: '0%'
    },
    isLoading,
    isError: error,
    isUpdating,
    updateProfile,
    uploadProfileImage,
    mutate,
  };
}
