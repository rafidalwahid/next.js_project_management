import { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { UnifiedPermissionSystem, PERMISSIONS } from "@/lib/permissions/unified-permission-system";

/**
 * Centralized Permission Service
 *
 * This service provides a unified way to check permissions across the application.
 * It handles common permission checking patterns and provides consistent error responses.
 */
export class PermissionService {
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
   * Check if a user has a specific permission based on their user ID
   *
   * @param userId The user's ID
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermissionById(userId: string, permission: string): Promise<boolean> {
    try {
      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return false;
      }

      // Use the unified permission system to check if the role has the permission
      return this.hasPermission(user.role, permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
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
   * Get all permissions for a user based on their user ID
   *
   * @param userId The user's ID
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForUser(userId: string): Promise<string[]> {
    try {
      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return [];
      }

      // Use the unified permission system to get permissions for the role
      return this.getPermissionsForRole(user.role);
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if a user is authorized to access their own resource or has admin privileges
   *
   * @param session The user's session
   * @param resourceUserId The user ID associated with the resource
   * @param adminOnly Whether only admins should have access regardless of ownership
   * @returns An object with hasPermission and error properties
   */
  static checkOwnerOrAdmin(
    session: Session | null,
    resourceUserId: string,
    adminOnly: boolean = false
  ): { hasPermission: boolean; error?: string } {
    // If no session, no permission
    if (!session || !session.user.id) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = session.user.id === resourceUserId;

    // Check if user is an admin
    const isAdmin = session.user.role === "admin";

    // Check if user is a manager
    const isManager = session.user.role === "manager";

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
   * Update a user's role
   *
   * @param userId The user's ID
   * @param role The new role
   * @returns A promise that resolves to true if the update was successful, false otherwise
   */
  static async updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
      // Update the user's role
      await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      return true;
    } catch (error) {
      console.error(`Error updating role for user ${userId}:`, error);
      return false;
    }
  }
}


