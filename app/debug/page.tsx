'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { data: session } = useSession();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-session');
      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Session</h1>
          <p className="text-muted-foreground">
            View your current session and permission information
          </p>
        </div>
        <Button onClick={fetchSessionData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>Your current session details</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token and Permissions</CardTitle>
          <CardDescription>Your JWT token and permission checks</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
            {sessionData ? JSON.stringify(sessionData, null, 2) : 'Loading...'}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
