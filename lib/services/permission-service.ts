import prisma from '@/lib/prisma';
import { PermissionSystem, PERMISSIONS, ROLES } from '@/lib/permissions/permission-system';

/**
 * Service for handling permissions in the application
 * This is a simplified version that uses the user.role field instead of the complex role-permission system
 */
export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return false;
      }

      // Use the permission system to check if the role has the permission
      return PermissionSystem.hasPermission(user.role, permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
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

      // Use the permission system to get permissions for the role
      return PermissionSystem.getPermissionsForRole(user.role);
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string }[]> {
    return PermissionSystem.getAllPermissions();
  }

  /**
   * Get all available roles
   */
  static async getAllRoles(): Promise<{ id: string; name: string; description: string; color: string }[]> {
    return PermissionSystem.getAllRoles();
  }

  /**
   * Get the permission matrix
   */
  static async getPermissionMatrix(): Promise<Record<string, string[]>> {
    return PermissionSystem.getPermissionMatrix();
  }

  /**
   * Update a user's role
   */
  static async updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
      // Validate the role
      if (!Object.values(ROLES).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }

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
