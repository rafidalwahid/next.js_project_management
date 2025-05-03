import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UnifiedPermissionSystem } from "@/lib/permissions/unified-permission-system";

/**
 * Middleware for API routes to handle authentication and authorization
 * 
 * @param handler The API route handler function
 * @param requiredPermission Optional permission required to access the route
 * @returns A new handler function with authentication and authorization checks
 */
export function withAuth(
  handler: (req: NextRequest, context: any, session: any) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check authorization if a permission is required
      if (requiredPermission) {
        const userRole = session.user.role;
        
        if (!UnifiedPermissionSystem.hasPermission(userRole, requiredPermission)) {
          return NextResponse.json(
            { error: "Forbidden: Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Call the original handler with the session
      return handler(req, context, session);
    } catch (error) {
      console.error("API middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for API routes that need to check resource-specific permissions
 * 
 * @param permissionChecker Function that checks if the user has permission for the specific resource
 * @param handler The API route handler function
 * @returns A new handler function with resource-specific permission checks
 */
export function withResourcePermission(
  permissionChecker: (resourceId: string, session: any, action: string) => Promise<{ hasPermission: boolean, error?: string }>,
  handler: (req: NextRequest, context: any, session: any, resource: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Check authentication
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get the resource ID from the context
      const resourceId = context.params?.id || context.params?.taskId || context.params?.projectId;
      
      if (!resourceId) {
        return NextResponse.json(
          { error: "Resource ID not found in request" },
          { status: 400 }
        );
      }

      // Determine the action based on the HTTP method
      let action = 'view';
      switch (req.method) {
        case 'POST':
          action = 'create';
          break;
        case 'PUT':
        case 'PATCH':
          action = 'update';
          break;
        case 'DELETE':
          action = 'delete';
          break;
      }

      // Check resource-specific permission
      const { hasPermission, error } = await permissionChecker(resourceId, session, action);
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: error || "Forbidden: Insufficient permissions" },
          { status: error === "Resource not found" ? 404 : 403 }
        );
      }

      // Call the original handler with the session and resource
      return handler(req, context, session, resourceId);
    } catch (error) {
      console.error("API resource permission middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  };
}
