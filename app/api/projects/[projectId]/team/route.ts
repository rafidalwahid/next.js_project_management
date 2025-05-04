import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated This API endpoint is deprecated. Use /api/team-management?projectId={projectId} instead.
 */

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  console.warn("This API endpoint is deprecated. Use /api/team-management?projectId={projectId} instead.");
  
  return NextResponse.redirect(new URL(`/api/team-management?projectId=${params.projectId}`, req.url));
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  console.warn("This API endpoint is deprecated. Use /api/team-management instead.");
  
  // Extract the userId from the request body
  const body = await req.json();
  const { userId } = body;
  
  // Redirect to the new endpoint
  const redirectUrl = new URL('/api/team-management', req.url);
  
  return NextResponse.redirect(redirectUrl, {
    status: 307, // Temporary redirect that preserves the HTTP method
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
