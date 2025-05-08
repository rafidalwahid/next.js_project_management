import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getToken } from "next-auth/jwt";
import { EdgePermissionService } from "@/lib/permissions/edge-permission-service";

/**
 * GET /api/debug-session
 * Debug endpoint to check session and permissions
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Get the token
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Check specific permissions
    const permissions = {
      manage_roles: token ? EdgePermissionService.hasPermissionForToken(token, "manage_roles") : false,
      manage_permissions: token ? EdgePermissionService.hasPermissionForToken(token, "manage_permissions") : false,
      user_management: token ? EdgePermissionService.hasPermissionForToken(token, "user_management") : false,
      team_add: token ? EdgePermissionService.hasPermissionForToken(token, "team_add") : false,
    };
    
    // Return the session and token data
    return NextResponse.json({
      session,
      token: {
        ...token,
        // Don't expose the JWT secret
        secret: token?.secret ? "[REDACTED]" : undefined,
      },
      permissions,
    });
  } catch (error) {
    console.error("Error in debug-session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
