// lib/permissions/db-permission-service.ts
// Database-only permission service with no fallbacks to hardcoded permissions

import prisma from "@/lib/prisma";
import { ROLES } from "./permission-constants";

/**
 * Database-Only Permission Service
 *
 * This service provides a unified way to check permissions across the application
 * using only the database, with no fallbacks to hardcoded permissions.
 */
export class DbPermissionService {
  /**
   * Check if a user has a specific permission based on their role
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static async hasPermission(role: string, permission: string): Promise<boolean> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        return true;
      }

      // Get the permission from the database
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: {
            name: role
          },
          permission: {
            name: permission
          }
        }
      });

      // If found in the database, the role has the permission
      return !!rolePermission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for role ${role}:`, error);
      return false;
    }
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

      // Use the database-backed permission system to check if the role has the permission
      return await this.hasPermission(user.role, permission);
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
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        // Get all permissions from the database
        const allPermissions = await prisma.permission.findMany();
        return allPermissions.map(p => p.name);
      }

      // Get the permissions from the database
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            name: role
          }
        },
        include: {
          permission: true
        }
      });

      // Return the permissions
      return rolePermissions.map(rp => rp.permission.name);
    } catch (error) {
      console.error(`Error getting permissions for role ${role}:`, error);
      return [];
    }
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

      // Use the database-backed permission system to get permissions for the role
      return await this.getPermissionsForRole(user.role);
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all available permissions with metadata
   *
   * @returns An array of permission objects with id, name, description, and category
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string; category?: string }[]> {
    try {
      // Get all permissions from the database
      const permissions = await prisma.permission.findMany();
      
      // Map to the expected format
      return permissions.map(p => ({
        id: p.name,
        name: p.name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '),
        description: p.description || `Permission to ${p.name.replace(/_/g, ' ')}`,
        category: p.category
      }));
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Get all roles that have a specific permission
   *
   * @param permission The permission to check
   * @returns An array of role strings
   */
  static async getRolesWithPermission(permission: string): Promise<string[]> {
    try {
      // Get all roles that have this permission from the database
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          permission: {
            name: permission
          }
        },
        include: {
          role: true
        }
      });

      // Return the roles
      return rolePermissions.map(rp => rp.role.name);
    } catch (error) {
      console.error(`Error getting roles with permission ${permission}:`, error);
      return [];
    }
  }

  /**
   * Get all available roles with metadata
   *
   * @returns An array of role objects with id, name, description, and color
   */
  static async getAllRoles(): Promise<{ id: string; name: string; description: string; color: string }[]> {
    try {
      // Get all roles from the database
      const roles = await prisma.role.findMany();
      
      // Map to the expected format
      return roles.map(r => ({
        id: r.name,
        name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
        description: r.description || `${r.name.charAt(0).toUpperCase() + r.name.slice(1)} role`,
        color: r.color || 'bg-gray-500'
      }));
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }
}
