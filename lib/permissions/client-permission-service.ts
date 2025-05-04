// lib/permissions/client-permission-service.ts
// Client-side version of the permission service that doesn't use Prisma

import { UnifiedPermissionSystem, PERMISSIONS } from "@/lib/permissions/unified-permission-system";

/**
 * Client-side Permission Service
 *
 * This service provides a unified way to check permissions in client components.
 * It does NOT use Prisma and is safe to use in client components.
 */
export class ClientPermissionService {
  /**
   * Check if a user has a specific permission based on their role
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static hasPermission(role: string, permission: string): boolean {
    return UnifiedPermissionSystem.hasPermission(role, permission);
  }

  /**
   * Get all permissions for a user based on their role
   *
   * @param role The user's role
   * @returns An array of permission strings
   */
  static getPermissionsForRole(role: string): string[] {
    return UnifiedPermissionSystem.getPermissionsForRole(role);
  }

  /**
   * Get all available permissions
   *
   * @returns An array of permission objects with id, name, description, and category
   */
  static getAllPermissions(): { id: string; name: string; description: string; category?: string }[] {
    return UnifiedPermissionSystem.getAllPermissions();
  }

  /**
   * Get all available roles
   *
   * @returns An array of role objects with id, name, description, and color
   */
  static getAllRoles(): { id: string; name: string; description: string; color: string }[] {
    return UnifiedPermissionSystem.getAllRoles();
  }

  /**
   * Get all roles that have a specific permission
   *
   * @param permission The permission to check
   * @returns An array of role strings
   */
  static getRolesWithPermission(permission: string): string[] {
    return UnifiedPermissionSystem.getRolesWithPermission(permission);
  }

  /**
   * Check if a user is authorized to access their own resource or has admin privileges
   * 
   * @param userId The current user's ID
   * @param userRole The current user's role
   * @param resourceUserId The user ID associated with the resource
   * @param adminOnly Whether only admins should have access regardless of ownership
   * @returns An object with hasPermission and error properties
   */
  static checkOwnerOrAdmin(
    userId: string | undefined,
    userRole: string | undefined,
    resourceUserId: string,
    adminOnly: boolean = false
  ): { hasPermission: boolean; error?: string } {
    // If no user ID, no permission
    if (!userId) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = userId === resourceUserId;

    // Check if user is an admin
    const isAdmin = userRole === "admin";

    // Check if user is a manager
    const isManager = userRole === "manager";

    // If adminOnly is true, only admins have access regardless of ownership
    if (adminOnly) {
      return {
        hasPermission: isAdmin,
        error: isAdmin ? undefined : "Forbidden: Admin access required"
      };
    }

    // Otherwise, owners, admins, and managers have access
    return {
      hasPermission: isOwner || isAdmin || isManager,
      error: (isOwner || isAdmin || isManager) ? undefined : "Forbidden: Insufficient permissions"
    };
  }
}
