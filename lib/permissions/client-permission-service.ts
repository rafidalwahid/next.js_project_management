// lib/permissions/client-permission-service.ts
// Client-side version of the permission service that uses API calls

import { ROLES } from "@/lib/permissions/permission-constants";
import { ClientDbPermissionService } from "@/lib/permissions/client-db-permission-service";

/**
 * Client-side Permission Service
 *
 * This service provides a unified way to check permissions in client components.
 * It does NOT use Prisma and is safe to use in client components.
 * It uses the ClientDbPermissionService for database-backed permission checks.
 */
export class ClientPermissionService {
  /**
   * Check if a user has a specific permission based on their role
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static async hasPermission(role: string, permission: string): Promise<boolean> {
    // Admin role always has all permissions
    if (role === ROLES.ADMIN) {
      return true;
    }

    // Use the database-backed client permission service
    return await ClientDbPermissionService.hasPermission(role, permission);
  }

  /**
   * Synchronous version of hasPermission for immediate UI rendering
   * This is less accurate but provides a quick initial result
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission based on role, false otherwise
   */
  static hasPermissionSync(role: string, permission: string): boolean {
    // Admin role always has all permissions
    if (role === ROLES.ADMIN) {
      return true;
    }

    // For non-admin roles, we need to check with the server
    // Return false and let the async version update the UI
    return false;
  }

  /**
   * Get all permissions for a user based on their role
   *
   * @param role The user's role
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    return await ClientDbPermissionService.getPermissionsForRole(role);
  }

  /**
   * Synchronous version of getPermissionsForRole for immediate UI rendering
   * This is less accurate but provides a quick initial result
   *
   * @param role The user's role
   * @returns An array of basic permissions based on role
   */
  static getPermissionsForRoleSync(role: string): string[] {
    // Basic permissions that all authenticated users have
    const basicPermissions = [
      "view_dashboard",
      "view_projects",
      "edit_profile",
      "view_attendance",
      "task_creation",
      "task_management"
    ];

    // Admin role has all permissions
    if (role === ROLES.ADMIN) {
      return [
        ...basicPermissions,
        "user_management",
        "manage_roles",
        "manage_permissions",
        "project_creation",
        "project_management",
        "project_deletion",
        "team_management",
        "team_add",
        "team_remove",
        "team_view",
        "task_assignment",
        "task_deletion",
        "system_settings",
        "attendance_management",
        "view_team_attendance"
      ];
    }

    // Manager role has project and team management permissions
    if (role === ROLES.MANAGER) {
      return [
        ...basicPermissions,
        "project_creation",
        "project_management",
        "team_management",
        "team_add",
        "team_remove",
        "team_view",
        "task_assignment",
        "task_deletion",
        "view_team_attendance"
      ];
    }

    // User role has basic permissions plus team view
    if (role === ROLES.USER) {
      return [
        ...basicPermissions,
        "team_view"
      ];
    }

    // Guest role has only view permissions
    return ["view_projects"];
  }

  /**
   * Get all available permissions
   *
   * @returns A promise that resolves to an array of permission objects
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string; category?: string }[]> {
    return await ClientDbPermissionService.getAllPermissions();
  }

  /**
   * Get all available roles
   *
   * @returns A promise that resolves to an array of role objects
   */
  static async getAllRoles(): Promise<{ id: string; name: string; description: string; color: string }[]> {
    return await ClientDbPermissionService.getAllRoles();
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
