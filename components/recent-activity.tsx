'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  project?: {
    id: string;
    title: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
}

export function RecentActivity() {
  const [limit] = useState(5);

  const { data, error, isLoading } = useSWR<{ activities: Activity[] }>(
    `/api/activities?limit=${limit}`,
    async url => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <Spinner />
        <p className="mt-2 text-sm text-muted-foreground">Loading recent activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-sm text-red-500 p-4">
        Error loading recent activities. Please try again later.
      </div>
    );
  }

  if (!data?.activities?.length) {
    return (
      <div className="text-center text-sm text-muted-foreground p-4">
        No recent activities to display.
      </div>
    );
  }

  // Helper function to format activity description
  const formatActivityDescription = (activity: Activity) => {
    const userName = activity.user?.name || 'Unknown user';

    switch (activity.action) {
      case 'created':
        return (
          <>
            <span className="font-semibold">{userName}</span> created {activity.entityType}{' '}
            <span className="font-semibold">
              {activity.entityType === 'project' ? activity.project?.title : activity.task?.title}
            </span>
          </>
        );
      case 'updated':
        return (
          <>
            <span className="font-semibold">{userName}</span> updated {activity.entityType}{' '}
            <span className="font-semibold">
              {activity.entityType === 'project' ? activity.project?.title : activity.task?.title}
            </span>
          </>
        );
      case 'completed':
        return (
          <>
            <span className="font-semibold">{userName}</span> completed {activity.entityType}{' '}
            <span className="font-semibold">
              {activity.entityType === 'project' ? activity.project?.title : activity.task?.title}
            </span>
          </>
        );
      case 'commented':
        return (
          <>
            <span className="font-semibold">{userName}</span> commented on {activity.entityType}{' '}
            <span className="font-semibold">
              {activity.entityType === 'project' ? activity.project?.title : activity.task?.title}
            </span>
          </>
        );
      case 'assigned':
        return (
          <>
            <span className="font-semibold">{userName}</span> assigned {activity.entityType}{' '}
            <span className="font-semibold">
              {activity.entityType === 'project' ? activity.project?.title : activity.task?.title}
            </span>
          </>
        );
      default:
        // If there's a custom description, use it
        if (activity.description) {
          return <>{activity.description}</>;
        }

        // Fallback for any other actions
        return (
          <>
            <span className="font-semibold">{userName}</span> {activity.action}{' '}
            {activity.entityType}
          </>
        );
    }
  };

  return (
    <div className="space-y-8">
      {data.activities.map(activity => (
        <div key={activity.id} className="flex items-start gap-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.user?.image || ''} alt={activity.user?.name || ''} />
            <AvatarFallback>
              {activity.user?.name
                ?.split(' ')
                .map(n => n[0])
                .join('') || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">
              {formatActivityDescription(activity)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
